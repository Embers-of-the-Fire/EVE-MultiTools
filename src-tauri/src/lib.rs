use log::error;

mod bundle;
mod config;
mod data;
mod init;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::new()
                        .clear_targets()
                        .target(tauri_plugin_log::Target::new(
                            tauri_plugin_log::TargetKind::LogDir {
                                file_name: Some("logs".to_string()),
                            },
                        ))
                        .target(tauri_plugin_log::Target::new(
                            tauri_plugin_log::TargetKind::Stdout,
                        ))
                        .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepAll)
                        .timezone_strategy(tauri_plugin_log::TimezoneStrategy::UseLocal)
                        .level(log::LevelFilter::Debug)
                        .build(),
                )?;
            } else {
                app.handle().plugin(
                    tauri_plugin_log::Builder::new()
                        .clear_targets()
                        .target(tauri_plugin_log::Target::new(
                            tauri_plugin_log::TargetKind::LogDir {
                                file_name: Some("logs".to_string()),
                            },
                        ))
                        .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepAll)
                        .timezone_strategy(tauri_plugin_log::TimezoneStrategy::UseLocal)
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            if let Err(e) = init::init(app) {
                error!("Failed to initialize application: {e:?}");
                Err(e)?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            config::get_config,
            config::set_theme,
            config::set_language,
            config::update_config,
            config::reset_config_to_default,
            config::get_config_file_path,
            config::set_enabled_bundle_id,
            bundle::import_bundle_file,
            bundle::remove_bundle,
            bundle::get_bundles,
            bundle::get_enabled_bundle_id,
            bundle::enable_bundle
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
