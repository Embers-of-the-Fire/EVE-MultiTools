use std::path::{Path, PathBuf};

use anyhow::anyhow;

#[derive(Debug)]
pub struct FactionIconService {
    faction_icon_path: PathBuf,
}

impl FactionIconService {
    pub fn init(image_root: &Path) -> anyhow::Result<Self> {
        let path = image_root.join("factions");
        if !path.exists() {
            return Err(anyhow!(
                "Faction icons folder not found, expected {}.",
                path.display()
            ));
        }
        Ok(Self {
            faction_icon_path: path,
        })
    }

    pub fn get_path(&self, icon_id: &str) -> PathBuf {
        self.faction_icon_path.join(format!("{icon_id}.png"))
    }
}

#[tauri::command]
pub async fn get_faction_icon_path(
    bundle_state: tauri::State<'_, crate::bundle::AppBundleState>,
    icon_id: &str,
) -> Result<PathBuf, String> {
    bundle_state
        .lock()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())
        .map(|bundle| bundle.images.faction.get_path(icon_id))
}
