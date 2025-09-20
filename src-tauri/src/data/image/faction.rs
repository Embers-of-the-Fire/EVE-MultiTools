use std::path::{Path, PathBuf};

use anyhow::anyhow;

#[derive(Debug)]
pub struct FactionService {
    faction_icon_path: PathBuf,
}

impl FactionService {
    pub fn init(image_root: &Path) -> anyhow::Result<Self> {
        let path = image_root.join("factions");
        if !path.exists() {
            return Err(anyhow!(
                "Faction folder not found, expected {}.",
                path.display()
            ));
        }
        Ok(Self {
            faction_icon_path: path,
        })
    }

    pub fn get_icon_path(&self, icon_id: i32) -> PathBuf {
        self.faction_icon_path.join(format!("icons/{icon_id}.png"))
    }

    pub fn get_logo_path(&self, logo_id: &str) -> PathBuf {
        self.faction_icon_path.join(format!("logos/{logo_id}.png"))
    }
}

#[tauri::command]
pub async fn get_faction_icon_path(
    bundle_state: tauri::State<'_, crate::bundle::AppBundleState>,
    icon_id: i32,
) -> Result<PathBuf, String> {
    bundle_state
        .read()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())
        .map(|bundle| bundle.images.faction.get_icon_path(icon_id))
}

#[tauri::command]
pub async fn get_faction_logo_path(
    bundle_state: tauri::State<'_, crate::bundle::AppBundleState>,
    logo_id: &str,
) -> Result<PathBuf, String> {
    bundle_state
        .read()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())
        .map(|bundle| bundle.images.faction.get_logo_path(logo_id))
}
