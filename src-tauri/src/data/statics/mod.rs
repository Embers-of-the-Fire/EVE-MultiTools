use std::path::Path;

pub mod types;

pub struct StaticsService {
    pub types: types::TypesService,
}

impl StaticsService {
    pub async fn init(bundle_path: &Path) -> anyhow::Result<Self> {
        let static_path = bundle_path.join("static");
        let types = types::TypesService::init(&static_path).await?;
        Ok(Self { types })
    }
}
