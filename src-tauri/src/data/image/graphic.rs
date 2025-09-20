use std::path::{Path, PathBuf};

use anyhow::anyhow;
use serde_repr::{Deserialize_repr, Serialize_repr};

use crate::utils::path::IfExists;

#[repr(u8)]
#[derive(Debug, Clone, Copy, Serialize_repr, Deserialize_repr)]
#[serde(untagged)]
pub enum GraphicType {
    Icon = 0,
    Blueprint = 1,
    BlueprintCopy = 2,
}

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

    pub fn get_path(&self, graphic_id: u32, graphic_type: GraphicType) -> Option<PathBuf> {
        self.graphic_path
            .join(format!(
                "{graphic_id}{}.png",
                match graphic_type {
                    GraphicType::Icon => "",
                    GraphicType::Blueprint => "_bp",
                    GraphicType::BlueprintCopy => "_bpc",
                }
            ))
            .if_exists()
    }
}

#[tauri::command]
pub async fn get_graphic_path(
    bundle_state: tauri::State<'_, crate::bundle::AppBundleState>,
    graphic_id: u32,
    graphic_type: GraphicType,
) -> Result<Option<PathBuf>, String> {
    bundle_state
        .read()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())
        .map(|bundle| bundle.images.graphic.get_path(graphic_id, graphic_type))
}
