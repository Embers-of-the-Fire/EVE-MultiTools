use std::path::Path;

use nohash_hasher::IntMap;
use prost::Message;
use serde::{Deserialize, Serialize};
use tokio::{fs::File, io::AsyncReadExt};

use crate::bundle::AppBundleState;

#[derive(Debug)]
pub struct TypesService {
    types: IntMap<i32, Type>,
}

impl TypesService {
    pub async fn init(static_path: &Path) -> anyhow::Result<Self> {
        let static_types_path = static_path.join("types.pb");
        let mut file = File::open(&static_types_path).await?;
        let mut buf = Vec::new();
        file.read_to_end(&mut buf).await?;
        let proto = crate::data::proto::schema::TypeCollection::decode(&buf[..])?;

        Ok(Self {
            types: proto
                .types
                .into_iter()
                .map(|def| {
                    (
                        def.type_id,
                        Type {
                            base_price: def.type_data.base_price,
                            capacity: def.type_data.capacity,
                            certificate_template: def.type_data.certificate_template,
                            description_id: def.type_data.description_id,
                            designer_ids: def.type_data.designer_ids,
                            faction_id: def.type_data.faction_id,
                            graphic_id: def.type_data.graphic_id,
                            group_id: def.type_data.group_id,
                            icon_id: def.type_data.icon_id,
                            is_dynamic_type: def.type_data.is_dynamic_type,
                            isis_group_id: def.type_data.isis_group_id,
                            market_group_id: def.type_data.market_group_id,
                            meta_group_id: def.type_data.meta_group_id,
                            meta_level: def.type_data.meta_level,
                            portion_size: def.type_data.portion_size,
                            published: def.type_data.published,
                            quote_author_id: def.type_data.quote_author_id,
                            quote_id: def.type_data.quote_id,
                            race_id: def.type_data.race_id,
                            radius: def.type_data.radius,
                            sound_id: def.type_data.sound_id,
                            tech_level: def.type_data.tech_level,
                            type_id: def.type_data.type_id,
                            type_name_id: def.type_data.type_name_id,
                            variation_parent_type_id: def.type_data.variation_parent_type_id,
                            volume: def.type_data.volume,
                            wreck_type_id: def.type_data.wreck_type_id,
                        },
                    )
                })
                .collect(),
        })
    }

    pub fn get_type(&self, type_id: i32) -> Option<&Type> {
        self.types.get(&type_id)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Type {
    pub base_price: f64,
    pub capacity: f64,
    pub certificate_template: Option<i32>,
    pub description_id: Option<i32>,
    pub designer_ids: Vec<i32>,
    pub faction_id: Option<i32>,
    pub graphic_id: Option<i32>,
    pub group_id: i32,
    pub icon_id: Option<i32>,
    pub is_dynamic_type: bool,
    pub isis_group_id: Option<i32>,
    pub market_group_id: Option<i32>,
    pub meta_group_id: Option<i32>,
    pub meta_level: Option<i32>,
    pub portion_size: i32,
    pub published: bool,
    pub quote_author_id: Option<i32>,
    pub quote_id: Option<i32>,
    pub race_id: Option<i32>,
    pub radius: f64,
    pub sound_id: Option<i32>,
    pub tech_level: Option<i32>,
    pub type_id: i32,
    pub type_name_id: i32,
    pub variation_parent_type_id: Option<i32>,
    pub volume: f64,
    pub wreck_type_id: Option<i32>,
}

#[tauri::command]
pub async fn get_type(
    type_id: i32,
    app_bundle: tauri::State<'_, AppBundleState>,
) -> Result<Option<Type>, String> {
    Ok(app_bundle
        .lock()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .statics
        .types
        .get_type(type_id)
        .cloned())
}
