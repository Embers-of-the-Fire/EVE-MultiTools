use anyhow::{Result, anyhow};
use log::info;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum Theme {
    #[default]
    Dark,
    Light,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum Language {
    #[serde(rename = "zh")]
    #[default]
    Chinese,
    #[serde(rename = "en")]
    English,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct GlobalSettings {
    pub theme: Theme,
    pub language: Language,
    #[serde(skip)]
    pub data_directory: Option<PathBuf>,
    pub enabled_bundle_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ConfigState {
    pub global_settings: GlobalSettings,
    #[serde(skip)]
    pub config_file_path: Option<PathBuf>,
}

impl ConfigState {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn load_from_file(config_path: &PathBuf) -> Result<Self> {
        if !config_path.exists() {
            info!("Configuration file does not exist, creating default configuration");
            let mut state = Self::new();
            state.config_file_path = Some(config_path.clone());
            state.save_to_file()?;
            return Ok(state);
        }

        let content = std::fs::read_to_string(config_path)?;
        let mut state: ConfigState = serde_json::from_str(&content)?;
        state.config_file_path = Some(config_path.clone());

        info!("Configuration loaded from file: {config_path:?}");
        Ok(state)
    }

    pub fn save_to_file(&self) -> Result<()> {
        let config_path = self
            .config_file_path
            .as_ref()
            .ok_or_else(|| anyhow!("No configuration file path set"))?;

        let content = serde_json::to_string_pretty(self)?;
        std::fs::write(config_path, content)?;

        info!("Configuration saved to file: {config_path:?}");
        Ok(())
    }

    pub fn reset_to_default(&mut self) -> Result<()> {
        let config_path = self.config_file_path.clone();
        let data_directory = self.global_settings.data_directory.clone();

        self.global_settings = GlobalSettings::default();
        self.global_settings.data_directory = data_directory;
        self.global_settings.enabled_bundle_id = None;
        self.config_file_path = config_path;

        self.save_to_file()?;
        info!("Configuration reset to default values");
        Ok(())
    }
}

pub struct AppConfigState {
    pub config: Mutex<ConfigState>,
}

impl AppConfigState {
    pub fn new(config: ConfigState) -> Self {
        AppConfigState {
            config: Mutex::new(config),
        }
    }
}

#[tauri::command]
pub fn get_config(state: State<AppConfigState>) -> Result<GlobalSettings, String> {
    let config = state
        .config
        .lock()
        .map_err(|e| format!("Failed to lock config: {e:?}"))?;
    Ok(config.global_settings.clone())
}

#[tauri::command]
pub fn set_theme(state: State<AppConfigState>, theme: Theme) -> Result<(), String> {
    let mut config = state
        .config
        .lock()
        .map_err(|e| format!("Failed to lock config: {e:?}"))?;
    config.global_settings.theme = theme;
    config
        .save_to_file()
        .map_err(|e| format!("Failed to save config: {e:?}"))?;
    Ok(())
}

#[tauri::command]
pub fn set_language(state: State<AppConfigState>, language: Language) -> Result<(), String> {
    let mut config = state
        .config
        .lock()
        .map_err(|e| format!("Failed to lock config: {e:?}"))?;
    config.global_settings.language = language;
    config
        .save_to_file()
        .map_err(|e| format!("Failed to save config: {e:?}"))?;
    Ok(())
}

#[tauri::command]
pub fn update_config(
    state: State<AppConfigState>,
    new_config: GlobalSettings,
) -> Result<(), String> {
    let mut config = state
        .config
        .lock()
        .map_err(|e| format!("Failed to lock config: {e:?}"))?;
    let data_directory = config.global_settings.data_directory.clone();

    config.global_settings = new_config;
    config.global_settings.data_directory = data_directory;

    config
        .save_to_file()
        .map_err(|e| format!("Failed to save config: {e:?}"))?;
    Ok(())
}

#[tauri::command]
pub fn reset_config_to_default(state: State<AppConfigState>) -> Result<GlobalSettings, String> {
    let mut config = state
        .config
        .lock()
        .map_err(|e| format!("Failed to lock config: {e:?}"))?;
    config
        .reset_to_default()
        .map_err(|e| format!("Failed to reset config: {e:?}"))?;
    Ok(config.global_settings.clone())
}

#[tauri::command]
pub fn get_config_file_path(state: State<AppConfigState>) -> Result<String, String> {
    let config = state
        .config
        .lock()
        .map_err(|e| format!("Failed to lock config: {e:?}"))?;
    let path = config
        .config_file_path
        .as_ref()
        .ok_or_else(|| "No config file path set".to_string())?;
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn set_enabled_bundle_id(
    state: State<AppConfigState>,
    bundle_id: Option<String>,
) -> Result<(), String> {
    let mut config = state
        .config
        .lock()
        .map_err(|e| format!("Failed to lock config: {e:?}"))?;
    config.global_settings.enabled_bundle_id = bundle_id;
    config
        .save_to_file()
        .map_err(|e| format!("Failed to save config: {e:?}"))?;
    Ok(())
}
