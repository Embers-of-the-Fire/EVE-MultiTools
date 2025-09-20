use std::path::Path;

use nohash_hasher::IntMap;
use prost::Message;
use serde::{Deserialize, Serialize};
use tokio::{fs::File, io::AsyncReadExt};

use crate::bundle::AppBundleState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Group {
    pub group_id: i32,
    pub group_name_id: i32,
    pub icon_id: Option<i32>,
    pub category_id: i32,
    pub anchorable: bool,
    pub fittable_non_singleton: bool,
    pub anchored: bool,
    pub published: bool,
    pub use_base_price: bool,
}

#[derive(Debug)]
pub struct GroupsService {
    pub groups: IntMap<i32, Group>,
}

impl GroupsService {
    pub async fn init(static_path: &Path) -> anyhow::Result<Self> {
        let static_groups_path = static_path.join("groups.pb");
        let mut file = File::open(&static_groups_path).await?;
        let mut buf = Vec::new();
        file.read_to_end(&mut buf).await?;
        let proto = crate::data::proto::schema::GroupCollection::decode(&buf[..])?;

        Ok(Self {
            groups: proto
                .groups
                .into_iter()
                .map(|def| {
                    (
                        def.group_id,
                        Group {
                            group_id: def.group_data.group_id,
                            group_name_id: def.group_data.group_name_id,
                            icon_id: def.group_data.icon_id,
                            category_id: def.group_data.category_id,
                            anchorable: def.group_data.anchorable,
                            fittable_non_singleton: def.group_data.fittable_non_singleton,
                            anchored: def.group_data.anchored,
                            published: def.group_data.published,
                            use_base_price: def.group_data.use_base_price,
                        },
                    )
                })
                .collect(),
        })
    }

    pub fn get_group(&self, group_id: i32) -> Option<&Group> {
        self.groups.get(&group_id)
    }
}

#[tauri::command]
pub async fn get_group(
    group_id: i32,
    app_bundle: tauri::State<'_, AppBundleState>,
) -> Result<Option<Group>, String> {
    Ok(app_bundle
        .read()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .statics
        .groups
        .get_group(group_id)
        .cloned())
}
