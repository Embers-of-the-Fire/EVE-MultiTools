use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

use crate::utils::database::SqliteConnection;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, FromRow)]
pub struct SystemBrief {
    pub solar_system_id: i64,
}

pub struct SystemService {
    db: SqliteConnection,
}

impl SystemService {
    pub(super) fn new_with_db(db: &SqliteConnection) -> Self {
        Self { db: db.clone() }
    }

    pub async fn get_system_data_by_id(
        &self,
        solar_system_id: i32,
    ) -> anyhow::Result<Option<Vec<u8>>> {
        Ok(sqlx::query!(
            "SELECT data
            FROM solar_systems
            WHERE solar_system_id = ?",
            solar_system_id
        )
        .fetch_optional(self.db.pool())
        .await?
        .map(|record| record.data))
    }
}

#[tauri::command]
pub async fn get_system_data_by_id(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    solar_system_id: i32,
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
            .systems
            .get_system_data_by_id(solar_system_id)
            .await
            .map_err(|e| e.to_string())?
            .unwrap_or_else(Vec::new),
    ))
}
