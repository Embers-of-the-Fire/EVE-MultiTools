use std::path::Path;

use crate::{
    data::universe::{
        constellations::ConstellationService, regions::RegionService, systems::SystemService,
    },
    utils::database::SqliteConnection,
};

pub mod constellations;
pub mod regions;
pub mod system_content;
pub mod systems;

pub struct UniverseService {
    pub regions: RegionService,
    pub constellations: ConstellationService,
    pub systems: SystemService,
    pub system_content: system_content::SystemContentService,
}

impl UniverseService {
    pub async fn init(root_path: &Path) -> anyhow::Result<Self> {
        let db_path = root_path.join("universe/universe.db");
        let db = SqliteConnection::connect(&db_path).await?;

        Ok(Self {
            regions: RegionService::new_with_db(&db),
            constellations: ConstellationService::new_with_db(&db),
            systems: SystemService::new_with_db(&db),
            system_content: system_content::SystemContentService::init(root_path).await?,
        })
    }
}
