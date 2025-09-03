use std::{collections::HashMap, path::Path, sync::Arc};

use prost::Message;
use serde::{Deserialize, Serialize};
use tokio::{fs::File, io::AsyncReadExt};

use crate::data::localization::{type_lookup::TypeLookup, universe_lookup::UniverseLookup};

pub mod type_lookup;
pub mod universe_lookup;

pub struct LocalizationService {
    localizations: Arc<HashMap<u32, LocString>>,
    type_lookup: TypeLookup,
    universe_lookup: UniverseLookup,
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

        Ok(Self {
            localizations: Arc::new(localizations),
            type_lookup: TypeLookup::new(root_path).await?,
            universe_lookup: UniverseLookup::new(root_path).await?,
        })
    }

    pub async fn get_localization(&self, key: u32) -> anyhow::Result<Option<LocString>> {
        Ok(self.localizations.get(&key).cloned())
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
