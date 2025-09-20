use std::path::Path;

use nohash_hasher::IntMap;
use prost::Message;
use serde::{Deserialize, Serialize};
use tokio::{fs::File, io::AsyncReadExt};

use crate::bundle::AppBundleState;

#[derive(Debug)]
pub struct FactionsService {
    factions: IntMap<i32, Faction>,
}

impl FactionsService {
    pub async fn init(static_path: &Path) -> anyhow::Result<Self> {
        let static_factions_path = static_path.join("factions.pb");
        let mut file = File::open(&static_factions_path).await?;
        let mut buf = Vec::new();
        file.read_to_end(&mut buf).await?;
        let proto = crate::data::proto::schema::FactionCollection::decode(&buf[..])?;

        Ok(Self {
            factions: proto
                .factions
                .into_iter()
                .map(|def| {
                    (
                        def.faction_id,
                        Faction {
                            faction_id: def.faction_id,
                            name_id: def.faction_data.name_id,
                            description_id: def.faction_data.description_id,
                            short_description_id: def.faction_data.short_description_id,
                            corporation_id: def.faction_data.corporation_id,
                            icon_id: def.faction_data.icon_id,
                            member_races: def.faction_data.member_races,
                            unique_name: def.faction_data.unique_name,
                            flat_logo: def.faction_data.flat_logo,
                            flat_logo_with_name: def.faction_data.flat_logo_with_name,
                            solar_system_id: def.faction_data.solar_system_id,
                            militia_corporation_id: def.faction_data.militia_corporation_id,
                            size_factor: def.faction_data.size_factor,
                        },
                    )
                })
                .collect(),
        })
    }

    pub fn get_faction_ids(&self) -> Vec<i32> {
        let mut ids: Vec<_> = self.factions.keys().copied().collect();
        ids.sort();
        ids
    }

    pub fn get_faction(&self, faction_id: i32) -> Option<&Faction> {
        self.factions.get(&faction_id)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Faction {
    pub faction_id: i32,
    pub name_id: i32,
    pub description_id: i32,
    pub short_description_id: Option<i32>,
    pub corporation_id: Option<i32>,
    pub icon_id: i32,
    pub member_races: Vec<i32>,
    pub unique_name: bool,
    pub flat_logo: Option<String>,
    pub flat_logo_with_name: Option<String>,
    pub solar_system_id: i32,
    pub militia_corporation_id: Option<i32>,
    pub size_factor: f64,
}

#[tauri::command]
pub async fn get_faction(
    faction_id: i32,
    app_bundle: tauri::State<'_, AppBundleState>,
) -> Result<Option<Faction>, String> {
    Ok(app_bundle
        .read()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .statics
        .factions
        .get_faction(faction_id)
        .cloned())
}

#[tauri::command]
pub async fn get_faction_ids(
    app_bundle: tauri::State<'_, AppBundleState>,
) -> Result<Vec<i32>, String> {
    Ok(app_bundle
        .read()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .statics
        .factions
        .get_faction_ids())
}
