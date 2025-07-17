use anyhow::anyhow;
use log::{error, info};
use tauri::{App, Manager};

use crate::{bundle, config};

pub(crate) fn init(app: &mut App) -> anyhow::Result<()> {
    info!("Initializing application...");

    info!("Setting up global configurations...");
    let data_dir = app.path().app_data_dir();
    let data_dir = if let Ok(data_dir) = data_dir {
        info!("Data directory: {data_dir:?}");
        if data_dir.exists() && data_dir.is_dir() {
            info!("Data directory already exists.");
        } else if let Err(e) = std::fs::create_dir_all(&data_dir) {
            return Err(anyhow!(
                "Failed to create or access the data directory: {e:?}"
            ));
        } else {
            info!("Data directory created successfully.");
        }
        data_dir
    } else {
        return Err(anyhow!("No data directory found!"));
    };

    let mut bundle = bundle::BundleState::new();
    let bundle_dir = data_dir.join("bundle");
    if !bundle_dir.exists() {
        if let Err(e) = std::fs::create_dir_all(&bundle_dir) {
            return Err(anyhow!(
                "Failed to create or access the data directory: {e:?}"
            ));
        }
    }
    let dir = match (data_dir.join("bundle")).read_dir() {
        Ok(dir) => dir,
        Err(e) => {
            return Err(anyhow!("Failed to read data directory: {e:?}"));
        }
    };
    for child in dir.flatten() {
        if child.file_type().is_ok_and(|ft| ft.is_dir()) {
            info!(
                "Found existing bundle directory: {}",
                child.path().display()
            );
            if let Err(e) = bundle.add_bundle(child.path()) {
                error!("Failed to add bundle: {e:?}");
            }
        }
    }

    app.manage(bundle::AppBundleState::new(bundle));

    info!("Initializing configuration management...");
    let config_file_path = data_dir.join("config.json");
    let mut config_state = match config::ConfigState::load_from_file(&config_file_path) {
        Ok(mut state) => {
            state.global_settings.data_directory = Some(data_dir.clone());
            state
        }
        Err(e) => {
            error!("Failed to load config file, using default: {e:?}");
            let mut state = config::ConfigState::new();
            state.global_settings.data_directory = Some(data_dir.clone());
            state.config_file_path = Some(config_file_path);
            if let Err(save_err) = state.save_to_file() {
                error!("Failed to save default config: {save_err:?}");
            }
            state
        }
    };

    // Auto-activate previously enabled bundle if it exists
    if let Some(enabled_bundle_id) = &config_state.global_settings.enabled_bundle_id {
        let bundle_state = app.state::<bundle::AppBundleState>();
        let mut bundle_state = bundle_state.lock().unwrap();

        match bundle_state.activate_bundle(enabled_bundle_id) {
            Ok(_) => {
                info!("Auto-activated bundle: {enabled_bundle_id}");
            }
            Err(e) => {
                error!("Failed to auto-activate bundle {enabled_bundle_id}: {e:?}");
                // Clear the invalid bundle id from config
                config_state.global_settings.enabled_bundle_id = None;
                if let Err(save_err) = config_state.save_to_file() {
                    error!("Failed to save config after clearing invalid bundle id: {save_err:?}");
                }
            }
        }
    }

    app.manage(config::AppConfigState::new(config_state));

    info!("Application initialized successfully.");
    Ok(())
}
