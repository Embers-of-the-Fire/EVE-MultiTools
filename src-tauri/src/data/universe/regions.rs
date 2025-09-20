use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

use crate::utils::database::SqliteConnection;

#[derive(Debug, Clone, Copy, PartialEq, Eq, FromRow, Serialize, Deserialize)]
pub struct RegionBrief {
    pub region_id: i64,
    pub name_id: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub region_type: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub wormhole_class_id: Option<i64>,
    pub faction_id: Option<i64>,
}

pub struct RegionService {
    db: SqliteConnection,
}

impl RegionService {
    pub(super) fn new_with_db(db: &SqliteConnection) -> Self {
        Self { db: db.clone() }
    }

    pub async fn get_by_id(&self, region_id: i32) -> anyhow::Result<Option<RegionBrief>> {
        Ok(sqlx::query_as!(
            RegionBrief,
            "SELECT region_id, name_id, region_type, wormhole_class_id, faction_id
            FROM regions
            WHERE region_id = ?",
            region_id
        )
        .fetch_optional(self.db.pool())
        .await?)
    }

    pub async fn get_by_faction_id(
        &self,
        faction_id: Option<i32>,
    ) -> anyhow::Result<Vec<RegionBrief>> {
        Ok(sqlx::query_as!(
            RegionBrief,
            "SELECT region_id, name_id, region_type, wormhole_class_id, faction_id
            FROM regions
            WHERE faction_id = ?",
            faction_id
        )
        .fetch_all(self.db.pool())
        .await?)
    }

    pub async fn get_by_wormhole_class_id(
        &self,
        class_id: Option<u8>,
    ) -> anyhow::Result<Vec<RegionBrief>> {
        Ok(sqlx::query_as!(
            RegionBrief,
            "SELECT region_id, name_id, region_type, wormhole_class_id, faction_id
            FROM regions
            WHERE wormhole_class_id = ?",
            class_id
        )
        .fetch_all(self.db.pool())
        .await?)
    }

    pub async fn get_detail_by_id(&self, region_id: i32) -> anyhow::Result<Vec<u8>> {
        let out = sqlx::query!(
            "SELECT region_data FROM regions WHERE region_id = ?",
            region_id
        )
        .fetch_one(self.db.pool())
        .await?;
        Ok(out.region_data)
    }
}

#[tauri::command]
pub async fn get_region_by_id(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    region_id: i32,
) -> Result<Option<RegionBrief>, String> {
    app_bundle
        .read()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .universe
        .regions
        .get_by_id(region_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_regions_by_faction_id(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    faction_id: Option<i32>,
) -> Result<Vec<RegionBrief>, String> {
    app_bundle
        .read()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .universe
        .regions
        .get_by_faction_id(faction_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_regions_by_wormhole_class_id(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    class_id: Option<u8>,
) -> Result<Vec<RegionBrief>, String> {
    app_bundle
        .read()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .universe
        .regions
        .get_by_wormhole_class_id(class_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_region_detail_by_id(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    region_id: i32,
) -> Result<tauri::ipc::Response, String> {
    let buf = app_bundle
        .read()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .universe
        .regions
        .get_detail_by_id(region_id)
        .await
        .map_err(|e| e.to_string())?;

    Ok(tauri::ipc::Response::new(buf))
}
