use std::path::Path;

use nohash_hasher::IntMap;
use prost::Message;
use serde::{Deserialize, Serialize};
use tokio::{fs::File, io::AsyncReadExt};

use crate::bundle::AppBundleState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetaGroup {
    pub name_id: i32,
    pub icon_id: Option<i32>,
}

#[derive(Debug)]
pub struct MetaGroupsService {
    pub meta_groups: IntMap<i32, MetaGroup>,
}

impl MetaGroupsService {
    pub async fn init(static_path: &Path) -> anyhow::Result<Self> {
        let static_meta_groups_path = static_path.join("meta_groups.pb");
        let mut file = File::open(&static_meta_groups_path).await?;
        let mut buf = Vec::new();
        file.read_to_end(&mut buf).await?;
        let proto = crate::data::proto::schema::MetaGroupCollection::decode(&buf[..])?;

        Ok(Self {
            meta_groups: proto
                .meta_groups
                .into_iter()
                .map(|def| {
                    (
                        def.meta_group_id,
                        MetaGroup {
                            name_id: def.meta_group_data.name_id,
                            icon_id: def.meta_group_data.icon_id,
                        },
                    )
                })
                .collect(),
        })
    }

    pub fn get_meta_group(&self, meta_group_id: i32) -> Option<&MetaGroup> {
        self.meta_groups.get(&meta_group_id)
    }
}

#[tauri::command]
pub async fn get_meta_group(
    meta_group_id: i32,
    app_bundle: tauri::State<'_, AppBundleState>,
) -> Result<Option<MetaGroup>, String> {
    Ok(app_bundle
        .lock()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .statics
        .meta_groups
        .get_meta_group(meta_group_id)
        .cloned())
}
