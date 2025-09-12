use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, FromRow)]
pub struct MoonBrief {
    pub moon_id: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub moon_name_id: Option<i64>,
    pub type_id: i64,
    pub planet_id: i64,
    pub celestial_index: i64,
}

pub struct MoonService {
    db: crate::utils::database::SqliteConnection,
}

impl MoonService {
    pub(super) fn new_with_db(db: &crate::utils::database::SqliteConnection) -> Self {
        Self { db: db.clone() }
    }

    pub async fn get_moon_by_id(&self, moon_id: i32) -> anyhow::Result<Option<MoonBrief>> {
        Ok(sqlx::query_as!(
            MoonBrief,
            "SELECT moon_id, moon_name_id, type_id, planet_id, celestial_index
            FROM moons
            WHERE moon_id = ?",
            moon_id
        )
        .fetch_optional(self.db.pool())
        .await?)
    }

    pub async fn get_moon_data_by_id(&self, moon_id: i32) -> anyhow::Result<Option<Vec<u8>>> {
        Ok(sqlx::query!(
            "SELECT data
            FROM moons
            WHERE moon_id = ?",
            moon_id
        )
        .fetch_optional(self.db.pool())
        .await?
        .map(|record| record.data))
    }
}

#[tauri::command]
pub async fn get_moon_by_id(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    moon_id: i32,
) -> Result<Option<MoonBrief>, String> {
    app_bundle
        .lock()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .universe
        .system_content
        .moons
        .get_moon_by_id(moon_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_moon_data_by_id(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    moon_id: i32,
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
            .moons
            .get_moon_data_by_id(moon_id)
            .await
            .map_err(|e| e.to_string())?
            .unwrap_or_else(Vec::new),
    ))
}
