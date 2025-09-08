use std::path::Path;

pub mod moons;
pub mod planets;
pub mod systems;

pub struct SystemContentService {
    pub systems: systems::SystemService,
    pub planets: planets::PlanetService,
    pub moons: moons::MoonService,
}

impl SystemContentService {
    pub async fn init(root_path: &Path) -> anyhow::Result<Self> {
        let db_path = root_path.join("universe/solar_system.db");
        let db = crate::utils::database::SqliteConnection::connect(&db_path).await?;

        Ok(Self {
            systems: systems::SystemService::new_with_db(&db),
            planets: planets::PlanetService::new_with_db(&db),
            moons: moons::MoonService::new_with_db(&db),
        })
    }
}
