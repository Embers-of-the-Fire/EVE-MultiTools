use std::{collections::HashMap, sync::Arc};

use prost::Message;
use tokio::io::AsyncReadExt;

use crate::data::localization::{LocLanguage, LocalizationService};

pub struct NpcCorporationLookup {
    npc_corporation_lookup: Arc<HashMap<i32, NpcCorporationLocEntry>>,
}

#[derive(Debug, Clone, Copy)]
struct NpcCorporationLocEntry {
    pub corporation_name_id: u32,
    #[allow(dead_code)]
    pub corporation_description_id: Option<u32>,
}

impl NpcCorporationLookup {
    pub async fn new(root_path: &std::path::Path) -> anyhow::Result<Self> {
        // Load NPC corporation localization lookup protobuf
        let npc_corporation_lookup_path =
            root_path.join("localizations/npc_corporation_localization_lookup.pb");
        let mut lookup_file = tokio::fs::File::open(&npc_corporation_lookup_path).await?;
        let mut lookup_buf = Vec::new();
        lookup_file.read_to_end(&mut lookup_buf).await?;
        let lookup_proto =
            crate::data::proto::schema::NpcCorporationLocalizationLookup::decode(&lookup_buf[..])?;

        // Convert to HashMap for fast lookup
        let npc_corporation_lookup: HashMap<i32, NpcCorporationLocEntry> = lookup_proto
            .npc_corporation_entries
            .into_iter()
            .map(|entry| {
                (
                    entry.npc_corporation_id,
                    NpcCorporationLocEntry {
                        corporation_name_id: entry.name_id,
                        corporation_description_id: entry.description_id,
                    },
                )
            })
            .collect();

        Ok(Self {
            npc_corporation_lookup: Arc::new(npc_corporation_lookup),
        })
    }
}

impl LocalizationService {
    pub async fn search_npc_corporation_by_name(
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

        let mut results = Vec::new();
        for (&npc_corporation_id, loc_entry) in
            self.npc_corporation_lookup.npc_corporation_lookup.iter()
        {
            if let Some(loc_string) = self.localizations.get(&loc_entry.corporation_name_id) {
                let loc_name = match language {
                    LocLanguage::English => &loc_string.en,
                    LocLanguage::Chinese => &loc_string.zh,
                };

                let text_lower = loc_name.to_lowercase();
                if text_lower.contains(&name_lower) {
                    let score = levenshtein::levenshtein(&text_lower, &name_lower);
                    results.push((npc_corporation_id, score));
                }
            }
        }

        results.sort_by_key(|&(_, score)| score);
        results.truncate(limit as usize);

        Ok(results.into_iter().map(|(id, _)| id).collect())
    }
}

#[tauri::command]
pub async fn search_npc_corporation_by_name(
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
        .search_npc_corporation_by_name(name, language, limit)
        .await
        .map_err(|e| e.to_string())
}
