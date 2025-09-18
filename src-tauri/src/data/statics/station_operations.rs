use std::path::Path;

use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, FromRow)]
pub struct StationOperationBrief {
    pub operation_id: i64,
    pub name_id: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description_id: Option<i64>,
}

pub struct StationOperationService {
    db: crate::utils::database::SqliteConnection,
}

impl StationOperationService {
    pub async fn init(root_path: &Path) -> anyhow::Result<Self> {
        let db_path = root_path.join("station_operations.db");
        let db = crate::utils::database::SqliteConnection::connect(&db_path).await?;
        Ok(Self { db })
    }

    pub async fn get_station_operation_by_id(
        &self,
        operation_id: i32,
    ) -> anyhow::Result<Option<StationOperationBrief>> {
        Ok(sqlx::query_as!(
            StationOperationBrief,
            "SELECT operation_id, name_id, description_id
            FROM station_operations
            WHERE operation_id = ?",
            operation_id
        )
        .fetch_optional(self.db.pool())
        .await?)
    }

    pub async fn get_station_operation_data_by_id(
        &self,
        operation_id: i32,
    ) -> anyhow::Result<Option<Vec<u8>>> {
        Ok(sqlx::query!(
            "SELECT data
            FROM station_operations
            WHERE operation_id = ?",
            operation_id
        )
        .fetch_optional(self.db.pool())
        .await?
        .map(|r| r.data))
    }
}

#[tauri::command]
pub async fn get_station_operation_by_id(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    operation_id: i32,
) -> Result<Option<StationOperationBrief>, String> {
    app_bundle
        .lock()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .statics
        .station_operations
        .get_station_operation_by_id(operation_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_station_operation_data_by_id(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    operation_id: i32,
) -> Result<tauri::ipc::Response, String> {
    Ok(tauri::ipc::Response::new(
        app_bundle
            .lock()
            .await
            .activated_bundle
            .as_ref()
            .ok_or("No activated bundle found".to_string())?
            .statics
            .station_operations
            .get_station_operation_data_by_id(operation_id)
            .await
            .map_err(|e| e.to_string())?
            .unwrap_or_else(Vec::new),
    ))
}
