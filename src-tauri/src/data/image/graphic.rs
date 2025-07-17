use std::path::{Path, PathBuf};

use anyhow::anyhow;

#[derive(Debug)]
pub struct GraphicService {
    graphic_path: PathBuf,
}

impl GraphicService {
    pub fn init(image_root: &Path) -> anyhow::Result<Self> {
        let path = image_root.join("graphics");
        if !path.exists() {
            return Err(anyhow!(
                "Graphics folder not found, expected {}.",
                path.display()
            ));
        }
        Ok(Self { graphic_path: path })
    }

    pub fn get_path(&self, graphic_id: u32) -> PathBuf {
        self.graphic_path.join(format!("{graphic_id}.png"))
    }
}

#[tauri::command]
pub fn get_graphic_path(
    bundle_state: tauri::State<'_, crate::bundle::AppBundleState>,
    graphic_id: u32,
) -> Result<PathBuf, String> {
    bundle_state
        .lock()
        .map_err(|e| e.to_string())?
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())
        .map(|bundle| bundle.images.graphic.get_path(graphic_id))
}
