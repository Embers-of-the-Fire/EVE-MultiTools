use std::path::Path;

pub mod categories;
pub mod groups;
pub mod meta_groups;
pub mod types;

pub struct StaticsService {
    pub types: types::TypesService,
    pub categories: categories::CategoriesService,
    pub groups: groups::GroupsService,
    pub meta_groups: meta_groups::MetaGroupsService,
}

impl StaticsService {
    pub async fn init(bundle_path: &Path) -> anyhow::Result<Self> {
        let static_path = bundle_path.join("static");
        let types = types::TypesService::init(&static_path).await?;
        let categories = categories::CategoriesService::init(&static_path).await?;
        let groups = groups::GroupsService::init(&static_path).await?;
        let meta_groups = meta_groups::MetaGroupsService::init(&static_path).await?;

        Ok(Self {
            types,
            categories,
            groups,
            meta_groups,
        })
    }
}
