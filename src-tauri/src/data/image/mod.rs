use std::path::Path;

use crate::data::image::{graphic::GraphicService, icon::IconService};

pub mod graphic;
pub mod icon;

#[derive(Debug)]
pub struct ImageService {
    pub graphic: GraphicService,
    pub icon: IconService,
}

impl ImageService {
    pub fn init(bundle_root: &Path) -> anyhow::Result<Self> {
        let image_path = bundle_root.join("images");
        Ok(Self {
            graphic: GraphicService::init(&image_path)?,
            icon: IconService::init(&image_path)?,
        })
    }
}
