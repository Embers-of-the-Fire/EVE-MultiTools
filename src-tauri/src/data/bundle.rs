use log::info;

use crate::{
    bundle::BundleDescriptor,
    data::{esi::EsiService, image::ImageService, localization::LocalizationService, market::MarketService, statics::StaticsService},
};

pub struct Bundle {
    pub descriptor: BundleDescriptor,
    pub images: ImageService,
    pub localization: LocalizationService,
    pub statics: StaticsService,
    pub market: MarketService,
    pub esi: EsiService,
}

impl Bundle {
    pub async fn load(descriptor: BundleDescriptor) -> anyhow::Result<Self> {
        info!("Loading bundle: {}", descriptor.metadata.server_id);
        Ok(Bundle {
            images: ImageService::init(&descriptor.root)?,
            localization: LocalizationService::init(&descriptor.root).await?,
            statics: StaticsService::init(&descriptor.root).await?,
            market: MarketService::init(&descriptor).await?,
            esi: EsiService::init(&descriptor.root).await?,
            descriptor,
        })
    }
}
