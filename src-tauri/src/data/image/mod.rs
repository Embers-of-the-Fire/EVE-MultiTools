use std::path::Path;

use crate::data::image::{graphic::GraphicService, icon::IconService, skin::SkinService};

pub mod graphic;
pub mod icon;
pub mod skin;

#[derive(Debug)]
pub struct ImageService {
    pub graphic: GraphicService,
    pub icon: IconService,
    pub skin: SkinService,
}

impl ImageService {
    pub fn init(bundle_root: &Path) -> anyhow::Result<Self> {
        let image_path = bundle_root.join("images");
        Ok(Self {
            graphic: GraphicService::init(&image_path)?,
            icon: IconService::init(&image_path)?,
            skin: SkinService::init(&image_path)?,
        })
    }
}
