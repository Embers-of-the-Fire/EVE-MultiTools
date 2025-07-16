use log::{error, info};
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::BufReader;
use std::path::Path;
use std::{collections::HashMap, path::PathBuf, sync::Mutex};
use tauri::{Emitter, Manager};
use tokio::sync::mpsc;
use zip::ZipArchive;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ImportStage {
    Start,
    Extracting,
    Complete,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportProgress {
    pub stage: ImportStage,
    pub current: u64,
    pub total: u64,
    pub message_key: Option<String>,
    pub message_params: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ImportErrorType {
    DirectoryExists,
    InvalidFileName,
    IoError,
    ZipError,
    RegistrationError,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportResult {
    pub success: bool,
    pub bundle_name: Option<String>,
    pub error_type: Option<ImportErrorType>,
    pub error_params: Option<serde_json::Value>,
}

#[derive(Debug, Clone)]
pub struct BundleState {
    pub bundles: HashMap<String, BundleDescriptor>,
    pub activated_bundle: Option<crate::data::bundle::Bundle>,
}

pub type AppBundleState = Mutex<BundleState>;

impl BundleState {
    pub fn new() -> Self {
        Self {
            bundles: HashMap::new(),
            activated_bundle: None,
        }
    }

    pub fn add_bundle(&mut self, root: PathBuf) -> anyhow::Result<()> {
        let descriptor = BundleDescriptor::init(root)?;
        if self.bundles.contains_key(&descriptor.metadata.server_id) {
            return Err(anyhow::anyhow!(
                "Bundle with server ID {} already exists",
                descriptor.metadata.server_id
            ));
        }
        self.bundles
            .insert(descriptor.metadata.server_id.clone(), descriptor);
        Ok(())
    }

    pub fn activate_bundle(&mut self, server_id: &str) -> anyhow::Result<()> {
        if let Some(descriptor) = self.bundles.get(server_id) {
            self.activated_bundle = Some(crate::data::bundle::Bundle::load(descriptor.clone()));
            Ok(())
        } else {
            Err(anyhow::anyhow!(
                "Bundle with server ID {} not found",
                server_id
            ))
        }
    }

    pub fn import_bundle(&mut self, bundle_path: &Path, data_dir: &Path) -> anyhow::Result<String> {
        let bundle_file_name = bundle_path
            .file_stem()
            .ok_or_else(|| anyhow::anyhow!("Invalid bundle file name"))?
            .to_string_lossy()
            .to_string();

        let target_dir = data_dir.join("bundle").join(&bundle_file_name);

        if target_dir.exists() {
            return Err(anyhow::anyhow!(
                "Bundle directory '{}' already exists",
                bundle_file_name
            ));
        }

        let file = fs::File::open(bundle_path)?;
        let mut archive = ZipArchive::new(BufReader::new(file))?;

        fs::create_dir_all(&target_dir)?;

        for i in 0..archive.len() {
            let mut file = archive.by_index(i)?;
            let outpath = target_dir.join(file.name());

            if file.is_dir() {
                fs::create_dir_all(&outpath)?;
            } else {
                if let Some(parent) = outpath.parent() {
                    fs::create_dir_all(parent)?;
                }

                let mut outfile = fs::File::create(&outpath)?;
                std::io::copy(&mut file, &mut outfile)?;
            }
        }

        self.add_bundle(target_dir)?;

        Ok(bundle_file_name)
    }

    async fn import_bundle_blocking(
        bundle_path: PathBuf,
        data_dir: PathBuf,
        progress_sender: mpsc::UnboundedSender<ImportProgress>,
    ) -> anyhow::Result<String> {
        let _guard = progress_sender.send(ImportProgress {
            stage: ImportStage::Start,
            current: 0,
            total: 100,
            message_key: Some("bundle.progress.start".to_string()),
            message_params: None,
        });

        let bundle_file_name = bundle_path
            .file_stem()
            .ok_or_else(|| anyhow::anyhow!("Invalid bundle file name"))?
            .to_string_lossy()
            .to_string();

        let target_dir = data_dir.join("bundle").join(&bundle_file_name);

        if target_dir.exists() {
            let _guard = progress_sender.send(ImportProgress {
                stage: ImportStage::Error,
                current: 0,
                total: 100,
                message_key: Some("bundle.progress.directory_exists".to_string()),
                message_params: Some(serde_json::json!({ "name": bundle_file_name })),
            });
            return Err(anyhow::anyhow!(
                "Bundle directory '{}' already exists",
                bundle_file_name
            ));
        }

        let _guard = progress_sender.send(ImportProgress {
            stage: ImportStage::Extracting,
            current: 10,
            total: 100,
            message_key: Some("bundle.progress.opening_file".to_string()),
            message_params: None,
        });

        // 在blocking任务中处理zip文件
        let progress_sender_clone = progress_sender.clone();
        let bundle_path_clone = bundle_path.clone();
        let target_dir_clone = target_dir.clone();

        tokio::task::spawn_blocking(move || {
            let file = std::fs::File::open(&bundle_path_clone)?;
            let mut archive = ZipArchive::new(BufReader::new(file))?;

            let _guard = progress_sender_clone.send(ImportProgress {
                stage: ImportStage::Extracting,
                current: 20,
                total: 100,
                message_key: Some("bundle.progress.creating_directory".to_string()),
                message_params: None,
            });

            std::fs::create_dir_all(&target_dir_clone)?;

            let total_files = archive.len();
            let _guard = progress_sender_clone.send(ImportProgress {
                stage: ImportStage::Extracting,
                current: 30,
                total: 100,
                message_key: Some("bundle.progress.extracting_files".to_string()),
                message_params: Some(serde_json::json!({ "total": total_files })),
            });

            for i in 0..archive.len() {
                let mut file = archive.by_index(i)?;
                let outpath = target_dir_clone.join(file.name());

                if file.is_dir() {
                    std::fs::create_dir_all(&outpath)?;
                } else {
                    if let Some(parent) = outpath.parent() {
                        std::fs::create_dir_all(parent)?;
                    }

                    let mut outfile = std::fs::File::create(&outpath)?;
                    std::io::copy(&mut file, &mut outfile)?;
                }

                let progress = 30 + (i * 50 / total_files);
                let _guard = progress_sender_clone.send(ImportProgress {
                    stage: ImportStage::Extracting,
                    current: progress as u64,
                    total: 100,
                    message_key: Some("bundle.progress.extracting_file".to_string()),
                    message_params: Some(serde_json::json!({ 
                        "current": i + 1, 
                        "total": total_files 
                    })),
                });
            }

            anyhow::Result::<()>::Ok(())
        })
        .await??;

        let _guard = progress_sender.send(ImportProgress {
            stage: ImportStage::Complete,
            current: 100,
            total: 100,
            message_key: Some("bundle.progress.complete".to_string()),
            message_params: None,
        });

        Ok(bundle_file_name)
    }

    pub fn remove_bundle(&mut self, server_id: &str) -> anyhow::Result<()> {
        if let Some(descriptor) = self.bundles.remove(server_id) {
            // 删除bundle目录
            if descriptor.root.exists() {
                std::fs::remove_dir_all(&descriptor.root)?;
            }

            if self
                .activated_bundle
                .as_ref()
                .is_some_and(|b| b.descriptor.metadata.server_id == descriptor.metadata.server_id)
            {
                self.activated_bundle = None;
            }

            Ok(())
        } else {
            Err(anyhow::anyhow!(
                "Bundle with server ID {} not found",
                server_id
            ))
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BundleDescriptor {
    pub metadata: BundleMetadata,
    /// The root path of the bundle, which is the directory containing the `bundle.json` file.
    /// This is used to locate the bundle's assets.
    pub root: PathBuf,
}

impl BundleDescriptor {
    pub fn init(root: PathBuf) -> anyhow::Result<Self> {
        let metadata_path = root.join("bundle.descriptor");
        let metadata: BundleMetadata =
            serde_json::from_reader(std::fs::File::open(metadata_path)?)?;
        Ok(Self { metadata, root })
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BundleMetadata {
    #[serde(rename = "server")]
    pub server_id: String,
    #[serde(rename = "server-name")]
    pub server_name: BundleServerName,
    pub created: chrono::DateTime<chrono::Utc>,
    #[serde(rename = "game")]
    pub game_info: BundleGameInfo,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BundleServerName {
    pub en: String,
    pub zh: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BundleGameInfo {
    pub version: String,
    pub build: String,
}

#[tauri::command]
pub async fn import_bundle_file_async(
    bundle_path: String,
    _bundle_state: tauri::State<'_, AppBundleState>,
    config_state: tauri::State<'_, crate::config::AppConfigState>,
    app: tauri::AppHandle,
) -> Result<String, String> {
    let bundle_path = PathBuf::from(bundle_path);

    let data_dir = {
        let config = config_state
            .config
            .lock()
            .map_err(|e| format!("Failed to lock config state: {e}"))?;
        config
            .global_settings
            .data_directory
            .clone()
            .ok_or_else(|| "Data directory not set".to_string())?
    };

    let (progress_sender, mut progress_receiver) = mpsc::unbounded_channel::<ImportProgress>();

    let task_id = uuid::Uuid::new_v4().to_string();

    let app_clone = app.clone();
    let task_id_clone = task_id.clone();
    tokio::spawn(async move {
        while let Some(progress) = progress_receiver.recv().await {
            let _ = app_clone.emit(
                &format!("bundle_import_progress_{task_id_clone}"),
                &progress,
            );
        }
    });

    let task_id_clone = task_id.clone();
    let app_clone = app.clone();
    let data_dir_clone = data_dir.clone();
    tokio::spawn(async move {
        let bundle_state = app_clone.state::<AppBundleState>();
        let config_state = app_clone.state::<crate::config::AppConfigState>();
        let result = match BundleState::import_bundle_blocking(
            bundle_path,
            data_dir,
            progress_sender,
        )
        .await
        {
            Ok(bundle_name) => {
                let target_dir = data_dir_clone.join("bundle").join(&bundle_name);
                let mut state = bundle_state
                    .lock()
                    .map_err(|e| format!("Failed to lock state: {e}"));
                match state {
                    Ok(ref mut state) => {
                        if let Err(e) = state.add_bundle(target_dir) {
                            ImportResult {
                                success: false,
                                bundle_name: None,
                                error_type: Some(ImportErrorType::RegistrationError),
                                error_params: Some(serde_json::json!({ "error": e.to_string() })),
                            }
                        } else {
                            // Check if this is the only bundle and auto-activate if so
                            let should_auto_activate =
                                state.bundles.len() == 1 && state.activated_bundle.is_none();

                            if should_auto_activate {
                                // Get the server ID of the newly imported bundle
                                if let Some((server_id, _)) = state.bundles.iter().next() {
                                    let server_id = server_id.clone();

                                    // Activate the bundle
                                    if let Err(e) = state.activate_bundle(&server_id) {
                                        error!("Failed to auto-activate bundle {server_id}: {e:?}");
                                    } else {
                                        info!("Auto-activated bundle: {server_id}");

                                        // Save to config
                                        if let Ok(mut config) = config_state.config.lock() {
                                            config.global_settings.enabled_bundle_id =
                                                Some(server_id);
                                            if let Err(e) = config.save_to_file() {
                                                log::error!("Failed to save config after auto-activation: {e:?}");
                                            }
                                        }
                                    }
                                }
                            }

                            ImportResult {
                                success: true,
                                bundle_name: Some(bundle_name),
                                error_type: None,
                                error_params: None,
                            }
                        }
                    }
                    Err(e) => ImportResult {
                        success: false,
                        bundle_name: None,
                        error_type: Some(ImportErrorType::IoError),
                        error_params: Some(serde_json::json!({ "error": e })),
                    },
                }
            }
            Err(e) => ImportResult {
                success: false,
                bundle_name: None,
                error_type: Some(ImportErrorType::IoError),
                error_params: Some(serde_json::json!({ "error": e.to_string() })),
            },
        };

        let _ = app_clone.emit(&format!("bundle_import_result_{task_id_clone}"), &result);
    });

    Ok(task_id)
}

#[tauri::command]
pub fn import_bundle_file(
    bundle_path: String,
    bundle_state: tauri::State<AppBundleState>,
    config_state: tauri::State<crate::config::AppConfigState>,
) -> Result<String, String> {
    let bundle_path = PathBuf::from(bundle_path);

    // 获取数据目录
    let data_dir = {
        let config = config_state
            .config
            .lock()
            .map_err(|e| format!("Failed to lock config state: {e}"))?;
        config
            .global_settings
            .data_directory
            .clone()
            .ok_or_else(|| "Data directory not set".to_string())?
    };

    // 导入bundle
    let mut bundle_state = bundle_state
        .lock()
        .map_err(|e| format!("Failed to lock bundle state: {e}"))?;

    let result = bundle_state
        .import_bundle(&bundle_path, &data_dir)
        .map_err(|e| format!("Failed to import bundle: {e}"))?;

    // Check if this is the only bundle and auto-activate if so
    let should_auto_activate =
        bundle_state.bundles.len() == 1 && bundle_state.activated_bundle.is_none();

    if should_auto_activate {
        // Get the server ID of the newly imported bundle
        if let Some((server_id, _)) = bundle_state.bundles.iter().next() {
            let server_id = server_id.clone();

            // Activate the bundle
            if let Err(e) = bundle_state.activate_bundle(&server_id) {
                error!("Failed to auto-activate bundle {server_id}: {e:?}");
            } else {
                info!("Auto-activated bundle: {server_id}");

                // Save to config
                let mut config = config_state
                    .config
                    .lock()
                    .map_err(|e| format!("Failed to lock config state: {e}"))?;
                config.global_settings.enabled_bundle_id = Some(server_id);
                config
                    .save_to_file()
                    .map_err(|e| format!("Failed to save config: {e}"))?;
            }
        }
    }

    Ok(result)
}

#[tauri::command]
pub fn get_bundles(
    bundle_state: tauri::State<AppBundleState>,
) -> Result<Vec<BundleMetadata>, String> {
    let bundle_state = bundle_state
        .lock()
        .map_err(|e| format!("Failed to lock bundle state: {e}"))?;
    let bundles: Vec<BundleMetadata> = bundle_state
        .bundles
        .values()
        .map(|descriptor| descriptor.metadata.clone())
        .collect();
    Ok(bundles)
}

#[tauri::command]
pub fn get_enabled_bundle_id(
    bundle_state: tauri::State<AppBundleState>,
) -> Result<Option<String>, String> {
    let bundle_state = bundle_state
        .lock()
        .map_err(|e| format!("Failed to lock bundle state: {e}"))?;

    Ok(bundle_state
        .activated_bundle
        .as_ref()
        .map(|bundle| bundle.descriptor.metadata.server_id.clone()))
}

#[tauri::command]
pub fn enable_bundle(
    server_id: String,
    bundle_state: tauri::State<AppBundleState>,
    config_state: tauri::State<crate::config::AppConfigState>,
) -> Result<(), String> {
    let mut bundle_state = bundle_state
        .lock()
        .map_err(|e| format!("Failed to lock bundle state: {e}"))?;

    bundle_state
        .activate_bundle(&server_id)
        .map_err(|e| format!("Failed to activate bundle: {e}"))?;

    // Save to config
    let mut config = config_state
        .config
        .lock()
        .map_err(|e| format!("Failed to lock config: {e}"))?;
    config.global_settings.enabled_bundle_id = Some(server_id);
    config
        .save_to_file()
        .map_err(|e| format!("Failed to save config: {e}"))?;

    Ok(())
}

#[tauri::command]
pub fn remove_bundle(
    server_id: String,
    bundle_state: tauri::State<AppBundleState>,
    config_state: tauri::State<crate::config::AppConfigState>,
) -> Result<(), String> {
    let mut bundle_state = bundle_state
        .lock()
        .map_err(|e| format!("Failed to lock bundle state: {e}"))?;

    // Check if we're removing the currently enabled bundle
    let is_enabled = bundle_state
        .activated_bundle
        .as_ref()
        .is_some_and(|b| b.descriptor.metadata.server_id == server_id);

    bundle_state
        .remove_bundle(&server_id)
        .map_err(|e| format!("Failed to remove bundle: {e}"))?;

    // If the removed bundle was enabled, clear the config
    if is_enabled {
        let mut config = config_state
            .config
            .lock()
            .map_err(|e| format!("Failed to lock config: {e}"))?;
        config.global_settings.enabled_bundle_id = None;
        config
            .save_to_file()
            .map_err(|e| format!("Failed to save config: {e}"))?;
    }

    Ok(())
}
