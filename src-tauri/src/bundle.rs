use serde::{Deserialize, Serialize};
use std::io::BufReader;
use std::{collections::HashMap, path::PathBuf};
use tauri::{ipc::Channel, Emitter, Manager};
use tokio::sync::{mpsc, Mutex};
use zip::ZipArchive;

#[derive(Clone, Serialize)]
struct BundleChangeStartPayload {
    #[serde(rename = "serverId")]
    server_id: String,
}

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

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", tag = "event", content = "data")]
pub enum BundleImportEvent {
    Progress {
        stage: ImportStage,
        current: u64,
        total: u64,
        message_key: Option<String>,
        message_params: Option<serde_json::Value>,
    },
    Result {
        success: bool,
        bundle_name: Option<String>,
        error_type: Option<ImportErrorType>,
        error_params: Option<serde_json::Value>,
    },
}

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

    pub async fn activate_bundle(&mut self, server_id: &str) -> anyhow::Result<()> {
        if let Some(descriptor) = self.bundles.get(server_id) {
            self.activated_bundle =
                Some(crate::data::bundle::Bundle::load(descriptor.clone()).await?);
            Ok(())
        } else {
            Err(anyhow::anyhow!(
                "Bundle with server ID {} not found",
                server_id
            ))
        }
    }

    async fn import_bundle(
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
            if self
                .activated_bundle
                .as_ref()
                .is_some_and(|b| b.descriptor.metadata.server_id == descriptor.metadata.server_id)
            {
                self.activated_bundle = None;
            }

            if descriptor.root.exists() {
                std::fs::remove_dir_all(&descriptor.root)?;
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
pub async fn import_bundle_file(
    bundle_path: String,
    config_state: tauri::State<'_, crate::config::AppConfigState>,
    app: tauri::AppHandle,
    on_event: Channel<BundleImportEvent>,
) -> Result<(), String> {
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

    // 启动进度转发任务
    let on_event_clone = on_event.clone();
    tokio::spawn(async move {
        while let Some(progress) = progress_receiver.recv().await {
            let _ = on_event_clone.send(BundleImportEvent::Progress {
                stage: progress.stage,
                current: progress.current,
                total: progress.total,
                message_key: progress.message_key,
                message_params: progress.message_params,
            });
        }
    });

    // 启动导入任务
    let app_clone = app.clone();
    let data_dir_clone = data_dir.clone();
    tokio::spawn(async move {
        let bundle_state = app_clone.state::<AppBundleState>();
        let import_result =
            BundleState::import_bundle(bundle_path, data_dir, progress_sender).await;

        let result: ImportResult;

        match import_result {
            Ok(bundle_name) => {
                let target_dir = data_dir_clone.join("bundle").join(&bundle_name);

                let mut state = bundle_state.lock().await;

                if let Err(e) = state.add_bundle(target_dir) {
                    result = ImportResult {
                        success: false,
                        bundle_name: None,
                        error_type: Some(ImportErrorType::RegistrationError),
                        error_params: Some(serde_json::json!({ "error": e.to_string() })),
                    };
                } else {
                    // Emit bundles-changed event
                    if let Err(e) = app_clone.emit("bundles-changed", ()) {
                        log::error!("Failed to emit bundles-changed event: {e:?}");
                    }

                    result = ImportResult {
                        success: true,
                        bundle_name: Some(bundle_name),
                        error_type: None,
                        error_params: None,
                    };
                }
            }
            Err(e) => {
                result = ImportResult {
                    success: false,
                    bundle_name: None,
                    error_type: Some(ImportErrorType::IoError),
                    error_params: Some(serde_json::json!({ "error": e.to_string() })),
                };
            }
        }

        // 发送结果事件
        let _ = on_event.send(BundleImportEvent::Result {
            success: result.success,
            bundle_name: result.bundle_name,
            error_type: result.error_type,
            error_params: result.error_params,
        });
    });

    Ok(())
}

#[tauri::command]
pub async fn enable_bundle(
    server_id: String,
    bundle_state: tauri::State<'_, AppBundleState>,
    config_state: tauri::State<'_, crate::config::AppConfigState>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    // Emit start event
    if let Err(e) = app_handle.emit(
        "bundle-change-start",
        &BundleChangeStartPayload {
            server_id: server_id.clone(),
        },
    ) {
        log::error!("Failed to emit bundle-change-start event: {e:?}");
    }

    let result = {
        let mut bundle_state = bundle_state.lock().await;

        bundle_state
            .activate_bundle(&server_id)
            .await
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
    };

    // Emit finished event
    if let Err(e) = app_handle.emit("bundle-change-finished", ()) {
        log::error!("Failed to emit bundle-change-finished event: {e:?}");
    }

    result
}

#[tauri::command]
pub async fn get_bundles(
    bundle_state: tauri::State<'_, AppBundleState>,
) -> Result<Vec<BundleMetadata>, String> {
    let bundle_state = bundle_state.lock().await;
    let bundles: Vec<BundleMetadata> = bundle_state
        .bundles
        .values()
        .map(|descriptor| descriptor.metadata.clone())
        .collect();
    Ok(bundles)
}

#[tauri::command]
pub async fn get_enabled_bundle_id(
    bundle_state: tauri::State<'_, AppBundleState>,
) -> Result<Option<String>, String> {
    let bundle_state = bundle_state.lock().await;

    Ok(bundle_state
        .activated_bundle
        .as_ref()
        .map(|bundle| bundle.descriptor.metadata.server_id.clone()))
}

#[tauri::command]
pub async fn remove_bundle(
    server_id: String,
    bundle_state: tauri::State<'_, AppBundleState>,
    config_state: tauri::State<'_, crate::config::AppConfigState>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let mut bundle_state = bundle_state.lock().await;

    // Check if we're removing the currently enabled bundle
    let is_enabled = bundle_state
        .activated_bundle
        .as_ref()
        .is_some_and(|b| b.descriptor.metadata.server_id == server_id);

    bundle_state
        .remove_bundle(&server_id)
        .map_err(|e| format!("Failed to remove bundle: {e}"))?;

    // 如果删除的是已启用的数据包，清空启用状态
    if is_enabled {
        bundle_state.activated_bundle = None;
        let mut config = config_state
            .config
            .lock()
            .map_err(|e| format!("Failed to lock config: {e}"))?;
        config.global_settings.enabled_bundle_id = None;
        config
            .save_to_file()
            .map_err(|e| format!("Failed to save config: {e}"))?;
    }

    // Emit bundles-changed event
    if let Err(e) = app_handle.emit("bundles-changed", ()) {
        log::error!("Failed to emit bundles-changed event: {e:?}");
    }

    Ok(())
}
