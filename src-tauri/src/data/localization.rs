use std::{collections::HashMap, path::Path, sync::Arc};

use prost::Message;
use serde::{Deserialize, Serialize};
use tokio::{fs::File, io::AsyncReadExt};

use crate::data::localization::{
    npc_corporation_lookup::NpcCorporationLookup, type_lookup::TypeLookup,
    universe_lookup::UniverseLookup,
};

pub mod npc_corporation_lookup;
pub mod type_lookup;
pub mod universe_lookup;

pub struct LocalizationService {
    localizations: Arc<HashMap<u32, LocString>>,
    ui_localizations: Arc<HashMap<String, u32>>,
    type_lookup: TypeLookup,
    universe_lookup: UniverseLookup,
    npc_corporation_lookup: NpcCorporationLookup,
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

        // Load main localization protobuf
        let ui_localization_path = root_path.join("localizations/meta_ui_localizations.pb");
        let mut file = File::open(&ui_localization_path).await?;
        let mut buf = Vec::new();
        file.read_to_end(&mut buf).await?;
        let proto = crate::data::proto::schema::MetaUiLocalizationCollection::decode(&buf[..])?;
        let ui_localizations: HashMap<String, u32> = proto
            .meta_ui_entries
            .into_iter()
            .map(|entry| (entry.key, entry.message_id))
            .collect();

        Ok(Self {
            localizations: Arc::new(localizations),
            ui_localizations: Arc::new(ui_localizations),
            type_lookup: TypeLookup::new(root_path).await?,
            universe_lookup: UniverseLookup::new(root_path).await?,
            npc_corporation_lookup: NpcCorporationLookup::new(root_path).await?,
        })
    }

    pub async fn get_localization(&self, key: u32) -> anyhow::Result<Option<LocString>> {
        Ok(self.localizations.get(&key).cloned())
    }

    pub async fn get_localization_by_language(
        &self,
        key: u32,
        language: LocLanguage,
    ) -> anyhow::Result<Option<String>> {
        Ok(self.localizations.get(&key).map(|loc| match language {
            LocLanguage::English => loc.en.clone(),
            LocLanguage::Chinese => loc.zh.clone(),
        }))
    }

    pub async fn get_ui_localization_by_language(
        &self,
        key: &str,
        language: LocLanguage,
    ) -> anyhow::Result<Option<String>> {
        if let Some(&msg_id) = self.ui_localizations.get(key) {
            self.get_localization_by_language(msg_id, language).await
        } else {
            Ok(None)
        }
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
pub async fn get_localization_by_language(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    key: u32,
    language: LocLanguage,
) -> Result<Option<String>, String> {
    app_bundle
        .lock()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .localization
        .get_localization_by_language(key, language)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_ui_localization_by_language(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    key: String,
    language: LocLanguage,
) -> Result<Option<String>, String> {
    app_bundle
        .lock()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .localization
        .get_ui_localization_by_language(&key, language)
        .await
        .map_err(|e| e.to_string())
}
