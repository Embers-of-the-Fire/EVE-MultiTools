use std::path::{Path, PathBuf};

use anyhow::anyhow;

#[derive(Debug)]
pub struct SkinService {
    skin_path: PathBuf,
}

impl SkinService {
    pub fn init(image_root: &Path) -> anyhow::Result<Self> {
        let path = image_root.join("skins");
        if !path.exists() {
            return Err(anyhow!(
                "Skins folder not found, expected {}.",
                path.display()
            ));
        }
        Ok(Self { skin_path: path })
    }

    pub fn get_material_path(&self, skin_material_id: i64) -> PathBuf {
        self.skin_path
            .join(format!("materials/{skin_material_id}.png"))
    }
}

#[tauri::command]
pub async fn get_skin_material_path(
    bundle_state: tauri::State<'_, crate::bundle::AppBundleState>,
    skin_material_id: i64,
) -> Result<PathBuf, String> {
    bundle_state
        .read()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())
        .map(|bundle| bundle.images.skin.get_material_path(skin_material_id))
}
