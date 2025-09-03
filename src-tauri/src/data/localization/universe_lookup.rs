use std::{collections::HashMap, sync::Arc};

use prost::Message;
use tokio::{fs::File, io::AsyncReadExt};

use crate::data::localization::{LocLanguage, LocalizationService};

pub struct UniverseLookup {
    region_lookup: Arc<HashMap<i32, RegionLocEntry>>,
    constellation_lookup: Arc<HashMap<i32, ConstellationLocEntry>>,
    system_lookup: Arc<HashMap<i32, SystemLocEntry>>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct RegionLocEntry {
    pub region_name_id: u32,
    pub region_description_id: Option<u32>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct ConstellationLocEntry {
    pub constellation_name_id: u32,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct SystemLocEntry {
    pub system_name_id: u32,
}

impl UniverseLookup {
    pub async fn new(root_path: &std::path::Path) -> anyhow::Result<Self> {
        let region_lookup_path = root_path.join("localizations/region_localization_lookup.pb");
        let mut lookup_file = File::open(&region_lookup_path).await?;
        let mut lookup_buf = Vec::new();
        lookup_file.read_to_end(&mut lookup_buf).await?;
        let lookup_proto =
            crate::data::proto::schema::RegionLocalizationLookup::decode(&lookup_buf[..])?;

        let region_lookup: HashMap<i32, RegionLocEntry> = lookup_proto
            .region_entries
            .into_iter()
            .map(|entry| {
                (
                    entry.region_id,
                    RegionLocEntry {
                        region_name_id: entry.name_id,
                        region_description_id: entry.description_id,
                    },
                )
            })
            .collect();

        let constellation_lookup_path =
            root_path.join("localizations/constellation_localization_lookup.pb");
        let mut lookup_file = File::open(&constellation_lookup_path).await?;
        let mut lookup_buf = Vec::new();
        lookup_file.read_to_end(&mut lookup_buf).await?;
        let lookup_proto =
            crate::data::proto::schema::ConstellationLocalizationLookup::decode(&lookup_buf[..])?;
        let constellation_lookup: HashMap<i32, ConstellationLocEntry> = lookup_proto
            .constellation_entries
            .into_iter()
            .map(|entry| {
                (
                    entry.constellation_id,
                    ConstellationLocEntry {
                        constellation_name_id: entry.name_id,
                    },
                )
            })
            .collect();

        let system_lookup_path = root_path.join("localizations/system_localization_lookup.pb");
        let mut lookup_file = File::open(&system_lookup_path).await?;
        let mut lookup_buf = Vec::new();
        lookup_file.read_to_end(&mut lookup_buf).await?;
        let lookup_proto =
            crate::data::proto::schema::SystemLocalizationLookup::decode(&lookup_buf[..])?;
        let system_lookup: HashMap<i32, SystemLocEntry> = lookup_proto
            .system_entries
            .into_iter()
            .map(|entry| {
                (
                    entry.system_id,
                    SystemLocEntry {
                        system_name_id: entry.name_id,
                    },
                )
            })
            .collect();

        Ok(Self {
            region_lookup: Arc::new(region_lookup),
            constellation_lookup: Arc::new(constellation_lookup),
            system_lookup: Arc::new(system_lookup),
        })
    }
}

pub type LocSearchResult = (i32, usize); // (id, score)

impl LocalizationService {
    pub fn search_region_by_name(
        &self,
        name: &str,
        language: LocLanguage,
    ) -> anyhow::Result<Vec<LocSearchResult>> {
        let name = name.trim();
        if name.is_empty() {
            return Ok(vec![]);
        }
        let name_lower = name.to_lowercase();

        let mut filtered: Vec<LocSearchResult> = Vec::new();

        for (region_id, region_entry) in self.universe_lookup.region_lookup.iter() {
            if let Some(loc_string) = self.localizations.get(&region_entry.region_name_id) {
                let text = match language {
                    LocLanguage::English => &loc_string.en,
                    LocLanguage::Chinese => &loc_string.zh,
                };
                let text_lower = text.to_lowercase();
                if let Some(pos) = text_lower.find(&name_lower) {
                    filtered.push((*region_id, pos));
                }
            }
        }

        Ok(filtered)
    }

    pub fn search_constellation_by_name(
        &self,
        name: &str,
        language: LocLanguage,
    ) -> anyhow::Result<Vec<LocSearchResult>> {
        let name = name.trim();
        if name.is_empty() {
            return Ok(vec![]);
        }
        let name_lower = name.to_lowercase();
        let mut filtered: Vec<(i32, usize)> = Vec::new();

        for (constellation_id, constellation_entry) in
            self.universe_lookup.constellation_lookup.iter()
        {
            if let Some(loc_string) = self
                .localizations
                .get(&constellation_entry.constellation_name_id)
            {
                let text = match language {
                    LocLanguage::English => &loc_string.en,
                    LocLanguage::Chinese => &loc_string.zh,
                };
                let text_lower = text.to_lowercase();
                if let Some(pos) = text_lower.find(&name_lower) {
                    filtered.push((*constellation_id, pos));
                }
            }
        }

        Ok(filtered)
    }

    pub fn search_system_by_name(
        &self,
        name: &str,
        language: LocLanguage,
    ) -> anyhow::Result<Vec<LocSearchResult>> {
        let name = name.trim();
        if name.is_empty() {
            return Ok(vec![]);
        }
        let name_lower = name.to_lowercase();
        let mut filtered: Vec<(i32, usize)> = Vec::new();

        for (system_id, system_entry) in self.universe_lookup.system_lookup.iter() {
            if let Some(loc_string) = self.localizations.get(&system_entry.system_name_id) {
                let text = match language {
                    LocLanguage::English => &loc_string.en,
                    LocLanguage::Chinese => &loc_string.zh,
                };
                let text_lower = text.to_lowercase();
                if let Some(pos) = text_lower.find(&name_lower) {
                    filtered.push((*system_id, pos));
                }
            }
        }

        Ok(filtered)
    }
}

#[tauri::command]
pub async fn search_region_by_name(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    name: &str,
    language: LocLanguage,
) -> Result<Vec<LocSearchResult>, String> {
    app_bundle
        .lock()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .localization
        .search_region_by_name(name, language)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_constellation_by_name(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    name: &str,
    language: LocLanguage,
) -> Result<Vec<LocSearchResult>, String> {
    app_bundle
        .lock()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .localization
        .search_constellation_by_name(name, language)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_system_by_name(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    name: &str,
    language: LocLanguage,
) -> Result<Vec<LocSearchResult>, String> {
    app_bundle
        .lock()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .localization
        .search_system_by_name(name, language)
        .map_err(|e| e.to_string())
}
