use crate::{
    bundle::BundleDescriptor,
    data::{image::ImageService, localization::LocalizationService},
};

pub struct Bundle {
    pub descriptor: BundleDescriptor,
    pub images: ImageService,
    pub localization: LocalizationService,
}

impl Bundle {
    pub async fn load(descriptor: BundleDescriptor) -> anyhow::Result<Self> {
        Ok(Bundle {
            images: ImageService::init(&descriptor.root)?,
            localization: LocalizationService::init(&descriptor.root).await?,
            descriptor,
        })
    }
}
