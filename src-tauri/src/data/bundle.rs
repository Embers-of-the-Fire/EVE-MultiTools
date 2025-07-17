use crate::{
    bundle::BundleDescriptor,
    data::{image::ImageService, localization::LocalizationService, statics::StaticsService},
};

pub struct Bundle {
    pub descriptor: BundleDescriptor,
    pub images: ImageService,
    pub localization: LocalizationService,
    pub statics: StaticsService
}

impl Bundle {
    pub async fn load(descriptor: BundleDescriptor) -> anyhow::Result<Self> {
        Ok(Bundle {
            images: ImageService::init(&descriptor.root)?,
            localization: LocalizationService::init(&descriptor.root).await?,
            statics: StaticsService::init(&descriptor.root).await?,
            descriptor,
        })
    }
}
