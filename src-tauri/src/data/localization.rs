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

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum LocLanguage {
    #[serde(rename = "en")]
    English,
    #[serde(rename = "zh")]
    Chinese,
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

    /* Reversed Search */
    pub async fn search_type_by_name(
        &self,
        name: &str,
        language: LocLanguage,
        limit: u32,
    ) -> anyhow::Result<Vec<i32>> {
        let name = format!("%{name}%");
        let mut filtered: Vec<_> = match language {
            LocLanguage::English => {
                let rows = sqlx::query!(
                    "SELECT loc.en, lt.type_id \
                     FROM loc_type lt \
                     JOIN localization loc ON lt.type_name_id = loc.key \
                     WHERE loc.en LIKE ?",
                    name
                )
                .fetch_all(self.db.pool())
                .await?;
                rows.into_iter()
                    .map(|t| (t.type_id, levenshtein::levenshtein(&t.en, &name)))
                    .collect()
            }
            LocLanguage::Chinese => {
                let rows = sqlx::query!(
                    "SELECT loc.zh, lt.type_id \
                     FROM loc_type lt \
                     JOIN localization loc ON lt.type_name_id = loc.key \
                     WHERE loc.zh LIKE ?",
                    name
                )
                .fetch_all(self.db.pool())
                .await?;
                rows.into_iter()
                    .map(|t| (t.type_id, levenshtein::levenshtein(&t.zh, &name)))
                    .collect()
            }
        };
        filtered.sort_by_key(|(_, score)| *score);
        filtered.truncate(limit as usize);
        Ok(filtered.into_iter().map(|(id, _)| id as i32).collect())
    }

    pub async fn search_type_by_description(
        &self,
        desc: &str,
        language: LocLanguage,
        limit: u32,
    ) -> anyhow::Result<Vec<i32>> {
        let desc = format!("%{desc}%");
        let mut filtered: Vec<_> = match language {
            LocLanguage::English => {
                let rows = sqlx::query!(
                    "SELECT loc.en, lt.type_id \
                     FROM loc_type lt \
                     JOIN localization loc ON lt.type_description_id = loc.key \
                     WHERE loc.en LIKE ?",
                    desc
                )
                .fetch_all(self.db.pool())
                .await?;
                rows.into_iter()
                    .map(|t| (t.type_id, levenshtein::levenshtein(&t.en, &desc)))
                    .collect()
            }
            LocLanguage::Chinese => {
                let rows = sqlx::query!(
                    "SELECT loc.zh, lt.type_id \
                     FROM loc_type lt \
                     JOIN localization loc ON lt.type_description_id = loc.key \
                     WHERE loc.zh LIKE ?",
                    desc,
                )
                .fetch_all(self.db.pool())
                .await?;
                rows.into_iter()
                    .map(|t| (t.type_id, levenshtein::levenshtein(&t.zh, &desc)))
                    .collect()
            }
        };
        filtered.sort_by_key(|(_, score)|*score);
        filtered.truncate(limit as usize);
        Ok(filtered.into_iter().map(|(id, _)| id as i32).collect())
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

#[tauri::command]
pub async fn search_type_by_name(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    name: &str,
    language: LocLanguage,
    limit: u32,
) -> Result<Vec<i32>, String> {
    app_bundle
        .lock()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .localization
        .search_type_by_name(name, language, limit)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_type_by_description(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    desc: &str,
    language: LocLanguage,
    limit: u32,
) -> Result<Vec<i32>, String> {
    app_bundle
        .lock()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .localization
        .search_type_by_description(desc, language, limit)
        .await
        .map_err(|e| e.to_string())
}
