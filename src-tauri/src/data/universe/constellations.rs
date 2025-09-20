use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

use crate::utils::database::SqliteConnection;

#[derive(Debug, Clone, Copy, PartialEq, Eq, FromRow, Serialize, Deserialize)]
pub struct ConstellationBrief {
    pub constellation_id: i64,
    pub name_id: i64,
    pub region_id: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub faction_id: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub wormhole_class_id: Option<i64>,
}

pub struct ConstellationService {
    db: SqliteConnection,
}

impl ConstellationService {
    pub(super) fn new_with_db(db: &SqliteConnection) -> Self {
        Self { db: db.clone() }
    }

    pub async fn get_by_id(
        &self,
        constellation_id: i32,
    ) -> anyhow::Result<Option<ConstellationBrief>> {
        Ok(sqlx::query_as!(
            ConstellationBrief,
            "SELECT constellation_id, name_id, region_id, faction_id, wormhole_class_id
            FROM constellations
            WHERE constellation_id = ?",
            constellation_id
        )
        .fetch_optional(self.db.pool())
        .await?)
    }

    pub async fn get_by_region_id(
        &self,
        region_id: i32,
    ) -> anyhow::Result<Vec<ConstellationBrief>> {
        Ok(sqlx::query_as!(
            ConstellationBrief,
            "SELECT constellation_id, name_id, region_id, faction_id, wormhole_class_id
            FROM constellations
            WHERE region_id = ?",
            region_id
        )
        .fetch_all(self.db.pool())
        .await?)
    }

    pub async fn get_by_faction_id(
        &self,
        faction_id: Option<i32>,
    ) -> anyhow::Result<Vec<ConstellationBrief>> {
        Ok(sqlx::query_as!(
            ConstellationBrief,
            "SELECT constellation_id, name_id, region_id, faction_id, wormhole_class_id
            FROM constellations
            WHERE faction_id = ?",
            faction_id
        )
        .fetch_all(self.db.pool())
        .await?)
    }

    pub async fn get_by_wormhole_class_id(
        &self,
        class_id: Option<u8>,
    ) -> anyhow::Result<Vec<ConstellationBrief>> {
        Ok(sqlx::query_as!(
            ConstellationBrief,
            "SELECT constellation_id, name_id, region_id, faction_id, wormhole_class_id
            FROM constellations
            WHERE wormhole_class_id = ?",
            class_id
        )
        .fetch_all(self.db.pool())
        .await?)
    }

    pub async fn get_detail_by_id(&self, constellation_id: i32) -> anyhow::Result<Vec<u8>> {
        let out = sqlx::query!(
            "SELECT constellation_data FROM constellations WHERE constellation_id = ?",
            constellation_id
        )
        .fetch_one(self.db.pool())
        .await?;
        Ok(out.constellation_data)
    }
}

#[tauri::command]
pub async fn get_constellation_by_id(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    constellation_id: i32,
) -> Result<Option<ConstellationBrief>, String> {
    app_bundle
        .read()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .universe
        .constellations
        .get_by_id(constellation_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_constellations_by_region_id(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    region_id: i32,
) -> Result<Vec<ConstellationBrief>, String> {
    app_bundle
        .read()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .universe
        .constellations
        .get_by_region_id(region_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_constellations_by_faction_id(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    faction_id: Option<i32>,
) -> Result<Vec<ConstellationBrief>, String> {
    app_bundle
        .read()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .universe
        .constellations
        .get_by_faction_id(faction_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_constellations_by_wormhole_class_id(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    class_id: Option<u8>,
) -> Result<Vec<ConstellationBrief>, String> {
    app_bundle
        .read()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .universe
        .constellations
        .get_by_wormhole_class_id(class_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_constellation_detail_by_id(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    constellation_id: i32,
) -> Result<Vec<u8>, String> {
    app_bundle
        .read()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .universe
        .constellations
        .get_detail_by_id(constellation_id)
        .await
        .map_err(|e| e.to_string())
}
