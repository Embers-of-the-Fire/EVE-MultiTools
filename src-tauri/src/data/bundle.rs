use crate::{bundle::BundleDescriptor, data::image::ImageService};

#[derive(Debug)]
pub struct Bundle {
    pub descriptor: BundleDescriptor,
    pub images: ImageService,
}

impl Bundle {
    pub fn load(descriptor: BundleDescriptor) -> anyhow::Result<Self> {
        Ok(Bundle {
            images: ImageService::init(&descriptor.root)?,
            descriptor,
        })
    }
}
