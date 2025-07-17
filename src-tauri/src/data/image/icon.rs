use std::path::{Path, PathBuf};

use anyhow::anyhow;

use crate::bundle::AppBundleState;

#[derive(Debug)]
pub struct IconService {
    icon_path: PathBuf,
}

impl IconService {
    pub fn init(image_root: &Path) -> anyhow::Result<Self> {
        let path = image_root.join("icons");
        if !path.exists() {
            return Err(anyhow!(
                "Icons folder not found, expected {}.",
                path.display()
            ));
        }
        Ok(Self { icon_path: path })
    }

    pub fn get_path(&self, icon_id: u32) -> PathBuf {
        self.icon_path.join(format!("{icon_id}.png"))
    }
}

#[tauri::command]
pub fn get_icon_path(
    bundle_state: tauri::State<'_, AppBundleState>,
    icon_id: u32,
) -> Result<PathBuf, String> {
    bundle_state
        .lock()
        .map_err(|e| e.to_string())?
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())
        .map(|bundle| bundle.images.icon.get_path(icon_id))
}
