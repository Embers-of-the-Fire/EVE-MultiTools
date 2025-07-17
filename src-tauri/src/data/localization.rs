use std::path::Path;

use serde::{Deserialize, Serialize};

use crate::utils::database::SqliteConnection;

pub struct LocalizationService {
    db: SqliteConnection,
}

#[derive(Debug, Clone, sqlx::FromRow, Serialize, Deserialize)]
pub struct LocString {
    pub en: String,
    pub zh: String,
}

impl LocalizationService {
    pub async fn init(root_path: &Path) -> anyhow::Result<Self> {
        let localization_path = root_path.join("localizations/localizations.db");
        let db = SqliteConnection::connect(localization_path).await?;
        Ok(Self { db })
    }

    pub async fn get_localization(&self, key: u32) -> anyhow::Result<Option<LocString>> {
        let out: Option<LocString> = sqlx::query_as!(
            LocString,
            "SELECT en, zh FROM localization WHERE key = ?",
            key
        )
        .fetch_optional(self.db.pool())
        .await?;
        Ok(out)
    }
}

#[tauri::command]
pub async fn get_localization(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    key: u32,
) -> Result<Option<LocString>, String> {
    app_bundle
        .lock()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .localization
        .get_localization(key)
        .await
        .map_err(|e| e.to_string())
}
