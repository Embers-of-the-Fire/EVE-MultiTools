use std::{collections::HashMap, path::Path, sync::Arc};

use serde::{Deserialize, Serialize};
use tokio::{fs::File, io::AsyncReadExt};
use prost::Message;

pub struct LocalizationService {
    localizations: Arc<HashMap<u32, LocString>>,
    type_lookup: Arc<HashMap<i32, TypeLocEntry>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
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

#[derive(Debug, Clone)]
struct TypeLocEntry {
    pub type_name_id: u32,
    pub type_description_id: Option<u32>,
}

impl LocalizationService {
    pub async fn init(root_path: &Path) -> anyhow::Result<Self> {
        // Load localization protobuf
        let localization_path = root_path.join("localizations/localizations.pb");
        let mut file = File::open(&localization_path).await?;
        let mut buf = Vec::new();
        file.read_to_end(&mut buf).await?;
        let proto = crate::data::proto::schema::LocalizationCollection::decode(&buf[..])?;

        // Convert to HashMap for fast lookup
        let localizations: HashMap<u32, LocString> = proto
            .localizations
            .into_iter()
            .map(|entry| {
                (
                    entry.key,
                    LocString {
                        en: entry.localization_data.en,
                        zh: entry.localization_data.zh,
                    },
                )
            })
            .collect();

        // Load type localization lookup protobuf
        let type_lookup_path = root_path.join("localizations/type_localization_lookup.pb");
        let mut lookup_file = File::open(&type_lookup_path).await?;
        let mut lookup_buf = Vec::new();
        lookup_file.read_to_end(&mut lookup_buf).await?;
        let lookup_proto = crate::data::proto::schema::TypeLocalizationLookup::decode(&lookup_buf[..])?;

        // Convert to HashMap for fast lookup
        let type_lookup: HashMap<i32, TypeLocEntry> = lookup_proto
            .type_entries
            .into_iter()
            .map(|entry| {
                (
                    entry.type_id,
                    TypeLocEntry {
                        type_name_id: entry.type_name_id,
                        type_description_id: entry.type_description_id,
                    },
                )
            })
            .collect();

        Ok(Self {
            localizations: Arc::new(localizations),
            type_lookup: Arc::new(type_lookup),
        })
    }

    pub async fn get_localization(&self, key: u32) -> anyhow::Result<Option<LocString>> {
        Ok(self.localizations.get(&key).cloned())
    }

    /* Reversed Search */
    pub async fn search_type_by_name(
        &self,
        name: &str,
        language: LocLanguage,
        limit: u32,
    ) -> anyhow::Result<Vec<i32>> {
        let name = name.trim();
        if name.is_empty() {
            return Ok(vec![]);
        }
        let name_lower = name.to_lowercase();
        
        let mut filtered: Vec<(i32, usize)> = Vec::new();
        
        // Search through all type entries
        for (type_id, type_entry) in self.type_lookup.iter() {
            if let Some(loc_string) = self.localizations.get(&type_entry.type_name_id) {
                let text = match language {
                    LocLanguage::English => &loc_string.en,
                    LocLanguage::Chinese => &loc_string.zh,
                };
                
                let text_lower = text.to_lowercase();
                if text_lower.contains(&name_lower) {
                    let score = levenshtein::levenshtein(&text_lower, &name_lower);
                    filtered.push((*type_id, score));
                }
            }
        }
        
        // Sort by relevance (lower score = better match)
        filtered.sort_by_key(|(_, score)| *score);
        filtered.truncate(limit as usize);
        
        Ok(filtered.into_iter().map(|(id, _)| id).collect())
    }

    pub async fn search_type_by_description(
        &self,
        desc: &str,
        language: LocLanguage,
        limit: u32,
    ) -> anyhow::Result<Vec<i32>> {
        let desc = desc.trim();
        if desc.is_empty() {
            return Ok(vec![]);
        }
        let desc_lower = desc.to_lowercase();
        
        let mut filtered: Vec<(i32, usize)> = Vec::new();
        
        // Search through all type entries that have description
        for (type_id, type_entry) in self.type_lookup.iter() {
            if let Some(desc_id) = type_entry.type_description_id {
                if let Some(loc_string) = self.localizations.get(&desc_id) {
                    let text = match language {
                        LocLanguage::English => &loc_string.en,
                        LocLanguage::Chinese => &loc_string.zh,
                    };
                    
                    let text_lower = text.to_lowercase();
                    if text_lower.contains(&desc_lower) {
                        let score = levenshtein::levenshtein(&text_lower, &desc_lower);
                        filtered.push((*type_id, score));
                    }
                }
            }
        }
        
        // Sort by relevance (lower score = better match)
        filtered.sort_by_key(|(_, score)| *score);
        filtered.truncate(limit as usize);
        
        Ok(filtered.into_iter().map(|(id, _)| id).collect())
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
