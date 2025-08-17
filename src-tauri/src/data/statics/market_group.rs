use std::path::{Path, PathBuf};

use nohash_hasher::IntMap;
use prost::Message;
use serde::{Deserialize, Serialize};
use tauri::ipc::Response;
use tokio::{fs::File, io::AsyncReadExt};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketGroup {
    pub name_id: i32,
    pub description_id: Option<i32>,
    pub icon_id: Option<i32>,
    pub parent_group_id: Option<i32>,
    pub types: Vec<i32>,
    pub groups: Vec<i32>,
}

#[derive(Debug)]
pub struct MarketGroupService {
    market_groups: IntMap<i32, MarketGroup>,
    market_group_path: PathBuf,
}

impl MarketGroupService {
    pub async fn init(static_path: &Path) -> anyhow::Result<Self> {
        let static_market_groups_path = static_path.join("market_groups.pb");
        let mut file = File::open(&static_market_groups_path).await?;
        let mut buf = Vec::new();
        file.read_to_end(&mut buf).await?;
        let proto = crate::data::proto::schema::MarketGroupCollection::decode(&buf[..])?;

        Ok(Self {
            market_group_path: static_market_groups_path,
            market_groups: proto
                .market_groups
                .into_iter()
                .map(|def| {
                    (
                        def.market_group_id,
                        MarketGroup {
                            name_id: def.market_group_data.name_id,
                            description_id: def.market_group_data.description_id,
                            icon_id: def.market_group_data.icon_id,
                            parent_group_id: def.market_group_data.parent_group_id,
                            types: def.market_group_data.types,
                            groups: def.market_group_data.groups,
                        },
                    )
                })
                .collect(),
        })
    }

    pub fn get_market_group(&self, market_group_id: i32) -> Option<&MarketGroup> {
        self.market_groups.get(&market_group_id)
    }

    pub async fn get_market_group_raw(&self) -> anyhow::Result<Vec<u8>> {
        Ok(tokio::fs::read(&self.market_group_path).await?)
    }
}

#[tauri::command]
pub async fn get_market_group(
    market_group_id: i32,
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
) -> Result<Option<MarketGroup>, String> {
    Ok(app_bundle
        .lock()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .statics
        .market_groups
        .get_market_group(market_group_id)
        .cloned())
}

/// This is designed to get the top-level market group tree structure.
/// DO NOT use this without caching the result, as it will be slow and inefficient.
#[tauri::command]
pub async fn get_market_group_raw(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
) -> Result<Response, String> {
    Ok(Response::new(
        app_bundle
            .lock()
            .await
            .activated_bundle
            .as_ref()
            .ok_or("No activated bundle found".to_string())?
            .statics
            .market_groups
            .get_market_group_raw()
            .await
            .map_err(|e| e.to_string())?,
    ))
}
