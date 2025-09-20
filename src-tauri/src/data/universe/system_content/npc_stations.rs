use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

#[derive(Debug, Clone, Copy, PartialEq, Eq, FromRow, Serialize, Deserialize)]
pub struct NpcStationBrief {
    pub station_id: i64,
    pub operation_id: i64,
    pub owner_id: i64,
    pub type_id: i64,
    pub system_id: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub moon_id: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub planet_id: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub star_id: Option<i64>,
}

pub struct NpcStationService {
    db: crate::utils::database::SqliteConnection,
}

impl NpcStationService {
    pub(super) fn new_with_db(db: &crate::utils::database::SqliteConnection) -> Self {
        Self { db: db.clone() }
    }

    pub async fn get_station_by_id(
        &self,
        station_id: i32,
    ) -> anyhow::Result<Option<NpcStationBrief>> {
        Ok(sqlx::query_as!(
            NpcStationBrief,
            "SELECT station_id, operation_id, owner_id, type_id, system_id, moon_id, planet_id, star_id
            FROM npc_stations
            WHERE station_id = ?",
            station_id
        )
        .fetch_optional(self.db.pool())
        .await?)
    }

    pub async fn get_station_data_by_id(&self, station_id: i32) -> anyhow::Result<Option<Vec<u8>>> {
        Ok(sqlx::query!(
            "SELECT data
            FROM npc_stations
            WHERE station_id = ?",
            station_id
        )
        .fetch_optional(self.db.pool())
        .await?
        .map(|record| record.data))
    }
}

#[tauri::command]
pub async fn get_npc_station_by_id(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    station_id: i32,
) -> Result<Option<NpcStationBrief>, String> {
    app_bundle
        .read()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .universe
        .system_content
        .npc_stations
        .get_station_by_id(station_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_npc_station_data_by_id(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    station_id: i32,
) -> Result<tauri::ipc::Response, String> {
    let data = app_bundle
        .read()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .universe
        .system_content
        .npc_stations
        .get_station_data_by_id(station_id)
        .await
        .map_err(|e| e.to_string())?;

    Ok(tauri::ipc::Response::new(data.unwrap_or_else(Vec::new)))
}
