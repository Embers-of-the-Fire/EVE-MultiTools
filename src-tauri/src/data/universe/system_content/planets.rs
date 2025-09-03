use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, FromRow)]
pub struct PlanetBrief {
    pub planet_id: i64,
    pub celestial_index: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub planet_name_id: Option<i64>,
    pub type_id: i64,
}

pub struct PlanetService {
    db: crate::utils::database::SqliteConnection,
}

impl PlanetService {
    pub(super) fn new_with_db(db: &crate::utils::database::SqliteConnection) -> Self {
        Self { db: db.clone() }
    }

    pub async fn get_planet_by_id(&self, planet_id: i32) -> anyhow::Result<Option<PlanetBrief>> {
        Ok(sqlx::query_as!(
            PlanetBrief,
            "SELECT planet_id, celestial_index, planet_name_id, type_id
            FROM planets
            WHERE planet_id = ?",
            planet_id
        )
        .fetch_optional(self.db.pool())
        .await?)
    }

    pub async fn get_planet_data_by_id(&self, planet_id: i32) -> anyhow::Result<Option<Vec<u8>>> {
        Ok(sqlx::query!(
            "SELECT data
            FROM planets
            WHERE planet_id = ?",
            planet_id
        )
        .fetch_optional(self.db.pool())
        .await?
        .map(|record| record.data))
    }
}

#[tauri::command]
pub async fn get_planet_by_id(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    planet_id: i32,
) -> Result<Option<PlanetBrief>, String> {
    app_bundle
        .lock()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .universe
        .system_content
        .planets
        .get_planet_by_id(planet_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_planet_data_by_id(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    planet_id: i32,
) -> Result<tauri::ipc::Response, String> {
    Ok(tauri::ipc::Response::new(
        app_bundle
            .lock()
            .await
            .activated_bundle
            .as_ref()
            .ok_or("No activated bundle found".to_string())?
            .universe
            .system_content
            .planets
            .get_planet_data_by_id(planet_id)
            .await
            .map_err(|e| e.to_string())?
            .unwrap_or(vec![]),
    ))
}
