use std::{collections::HashMap, path::Path, sync::Arc};

use prost::Message;
use tokio::{fs::File, io::AsyncReadExt};

use crate::data::localization::{LocLanguage, LocalizationService};

pub struct TypeLookup {
    type_lookup: Arc<HashMap<i32, TypeLocEntry>>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct TypeLocEntry {
    pub type_name_id: u32,
    pub type_description_id: Option<u32>,
}

impl TypeLookup {
    pub async fn new(root_path: &Path) -> anyhow::Result<Self> {
        // Load type localization lookup protobuf
        let type_lookup_path = root_path.join("localizations/type_localization_lookup.pb");
        let mut lookup_file = File::open(&type_lookup_path).await?;
        let mut lookup_buf = Vec::new();
        lookup_file.read_to_end(&mut lookup_buf).await?;
        let lookup_proto =
            crate::data::proto::schema::TypeLocalizationLookup::decode(&lookup_buf[..])?;

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
            type_lookup: Arc::new(type_lookup),
        })
    }
}

impl LocalizationService {
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
        // let finder = memchr::memmem::Finder::new(&name_lower);

        let mut filtered: Vec<(i32, usize)> = Vec::new();

        // Search through all type entries
        for (type_id, type_entry) in self.type_lookup.type_lookup.iter() {
            if let Some(loc_string) = self.localizations.get(&type_entry.type_name_id) {
                let text = match language {
                    LocLanguage::English => &loc_string.en,
                    LocLanguage::Chinese => &loc_string.zh,
                };

                let text_lower = text.to_lowercase();
                if text_lower.contains(&name_lower) {
                    // if finder.find(text_lower.as_bytes()).is_some() {
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
        for (type_id, type_entry) in self.type_lookup.type_lookup.iter() {
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
pub async fn search_type_by_name(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    name: &str,
    language: LocLanguage,
    limit: u32,
) -> Result<Vec<i32>, String> {
    app_bundle
        .read()
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
        .read()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .localization
        .search_type_by_description(desc, language, limit)
        .await
        .map_err(|e| e.to_string())
}
