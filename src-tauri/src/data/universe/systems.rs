use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

use crate::utils::database::SqliteConnection;

#[derive(Debug, Clone, Copy, PartialEq, FromRow, Serialize, Deserialize)]
pub struct SystemBrief {
    pub solar_system_id: i64,
    pub name_id: i64,
    pub region_id: i64,
    pub constellation_id: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub faction_id: Option<i64>,
    pub security_status: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub wormhole_class_id: Option<i64>,
}

pub struct SystemService {
    db: SqliteConnection,
}

impl SystemService {
    pub(super) fn new_with_db(db: &SqliteConnection) -> Self {
        Self { db: db.clone() }
    }

    pub async fn get_by_id(&self, solar_system_id: i32) -> anyhow::Result<Option<SystemBrief>> {
        Ok(sqlx::query_as!(
            SystemBrief,
            "SELECT solar_system_id, name_id, region_id, constellation_id, faction_id, security_status, wormhole_class_id
            FROM systems
            WHERE solar_system_id = ?",
            solar_system_id
        )
        .fetch_optional(self.db.pool())
        .await?)
    }

    pub async fn get_by_region_id(&self, region_id: i32) -> anyhow::Result<Vec<SystemBrief>> {
        Ok(sqlx::query_as!(
            SystemBrief,
            "SELECT solar_system_id, name_id, region_id, constellation_id, faction_id, security_status, wormhole_class_id
            FROM systems
            WHERE region_id = ?",
            region_id
        )
        .fetch_all(self.db.pool())
        .await?)
    }

    pub async fn get_by_constellation_id(
        &self,
        constellation_id: i32,
    ) -> anyhow::Result<Vec<SystemBrief>> {
        Ok(sqlx::query_as!(
            SystemBrief,
            "SELECT solar_system_id, name_id, region_id, constellation_id, faction_id, security_status, wormhole_class_id
            FROM systems
            WHERE constellation_id = ?",
            constellation_id
        )
        .fetch_all(self.db.pool())
        .await?)
    }

    pub async fn get_by_faction_id(
        &self,
        faction_id: Option<i32>,
    ) -> anyhow::Result<Vec<SystemBrief>> {
        Ok(sqlx::query_as!(
            SystemBrief,
            "SELECT solar_system_id, name_id, region_id, constellation_id, faction_id, security_status, wormhole_class_id
            FROM systems
            WHERE faction_id = ?",
            faction_id
        )
        .fetch_all(self.db.pool())
        .await?)
    }

    pub async fn get_by_wormhole_class_id(
        &self,
        class_id: Option<u8>,
    ) -> anyhow::Result<Vec<SystemBrief>> {
        Ok(sqlx::query_as!(
            SystemBrief,
            "SELECT solar_system_id, name_id, region_id, constellation_id, faction_id, security_status, wormhole_class_id
            FROM systems
            WHERE wormhole_class_id = ?",
            class_id
        )
        .fetch_all(self.db.pool())
        .await?)
    }

    pub async fn get_by_security_range(
        &self,
        min: f32,
        max: f32,
    ) -> anyhow::Result<Vec<SystemBrief>> {
        Ok(sqlx::query_as!(
            SystemBrief,
            "SELECT solar_system_id, name_id, region_id, constellation_id, faction_id, security_status, wormhole_class_id
            FROM systems
            WHERE security_status >= ? AND security_status <= ?",
            min,
            max
        )
        .fetch_all(self.db.pool())
        .await?)
    }
}

#[tauri::command]
pub async fn get_system_by_id(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    solar_system_id: i32,
) -> Result<Option<SystemBrief>, String> {
    app_bundle
        .lock()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .universe
        .systems
        .get_by_id(solar_system_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_systems_by_region_id(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    region_id: i32,
) -> Result<Vec<SystemBrief>, String> {
    app_bundle
        .lock()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .universe
        .systems
        .get_by_region_id(region_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_systems_by_constellation_id(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    constellation_id: i32,
) -> Result<Vec<SystemBrief>, String> {
    app_bundle
        .lock()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .universe
        .systems
        .get_by_constellation_id(constellation_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_systems_by_faction_id(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    faction_id: Option<i32>,
) -> Result<Vec<SystemBrief>, String> {
    app_bundle
        .lock()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .universe
        .systems
        .get_by_faction_id(faction_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_systems_by_wormhole_class_id(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    class_id: Option<u8>,
) -> Result<Vec<SystemBrief>, String> {
    app_bundle
        .lock()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .universe
        .systems
        .get_by_wormhole_class_id(class_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_systems_by_security_range(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    min: f32,
    max: f32,
) -> Result<Vec<SystemBrief>, String> {
    app_bundle
        .lock()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .universe
        .systems
        .get_by_security_range(min, max)
        .await
        .map_err(|e| e.to_string())
}
