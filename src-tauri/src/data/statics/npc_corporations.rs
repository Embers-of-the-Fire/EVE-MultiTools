use std::path::Path;

use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, FromRow)]
pub struct NpcCorporationBrief {
    pub npc_corporation_id: i64,
    pub name_id: i64,
    pub ticker_name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description_id: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub icon_id: Option<i64>,
}

pub struct NpcCorporationsService {
    db: crate::utils::database::SqliteConnection,
}

impl NpcCorporationsService {
    pub async fn init(root_path: &Path) -> anyhow::Result<Self> {
        let db_path = root_path.join("npc_corporations.db");
        let db = crate::utils::database::SqliteConnection::connect(&db_path).await?;
        Ok(Self { db })
    }

    pub async fn get_npc_corporation_by_id(
        &self,
        npc_corporation_id: i32,
    ) -> anyhow::Result<Option<NpcCorporationBrief>> {
        Ok(sqlx::query_as!(
            NpcCorporationBrief,
            "SELECT npc_corporation_id, name_id, ticker_name, description_id, icon_id
            FROM npc_corporations
            WHERE npc_corporation_id = ?",
            npc_corporation_id
        )
        .fetch_optional(self.db.pool())
        .await?)
    }

    pub async fn get_npc_corporation_data_by_id(
        &self,
        npc_corporation_id: i32,
    ) -> anyhow::Result<Option<Vec<u8>>> {
        Ok(sqlx::query!(
            "SELECT data
            FROM npc_corporations
            WHERE npc_corporation_id = ?",
            npc_corporation_id
        )
        .fetch_optional(self.db.pool())
        .await?
        .map(|r| r.data))
    }
}

#[tauri::command]
pub async fn get_npc_corporation_by_id(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    npc_corporation_id: i32,
) -> Result<Option<NpcCorporationBrief>, String> {
    app_bundle
        .read()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .statics
        .npc_corporations
        .get_npc_corporation_by_id(npc_corporation_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_npc_corporation_data_by_id(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    npc_corporation_id: i32,
) -> Result<tauri::ipc::Response, String> {
    Ok(tauri::ipc::Response::new(
        app_bundle
            .read()
            .await
            .activated_bundle
            .as_ref()
            .ok_or("No activated bundle found".to_string())?
            .statics
            .npc_corporations
            .get_npc_corporation_data_by_id(npc_corporation_id)
            .await
            .map_err(|e| e.to_string())?
            .unwrap_or_else(Vec::new),
    ))
}
