use std::path::Path;

pub mod categories;
pub mod factions;
pub mod groups;
pub mod market_group;
pub mod meta_groups;
pub mod skins;
pub mod types;

pub struct StaticsService {
    pub types: types::TypesService,
    pub categories: categories::CategoriesService,
    pub groups: groups::GroupsService,
    pub market_groups: market_group::MarketGroupService,
    pub meta_groups: meta_groups::MetaGroupsService,
    pub skins: skins::SkinService,
    pub factions: factions::FactionsService,
}

impl StaticsService {
    pub async fn init(bundle_path: &Path) -> anyhow::Result<Self> {
        let static_path = bundle_path.join("static");
        let types = types::TypesService::init(&static_path).await?;
        let categories = categories::CategoriesService::init(&static_path).await?;
        let groups = groups::GroupsService::init(&static_path).await?;
        let market_groups = market_group::MarketGroupService::init(&static_path).await?;
        let meta_groups = meta_groups::MetaGroupsService::init(&static_path).await?;
        let skins = skins::SkinService::init(&static_path).await?;
        let factions = factions::FactionsService::init(&static_path).await?;

        Ok(Self {
            types,
            categories,
            groups,
            market_groups,
            meta_groups,
            skins,
            factions,
        })
    }
}
