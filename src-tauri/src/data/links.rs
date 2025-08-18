use std::{collections::HashMap, fs, io, path::Path, sync::Arc};

use num_enum::{FromPrimitive, IntoPrimitive};
use string_enum::StringEnum;

#[derive(Clone, PartialEq, Eq, Hash, StringEnum, IntoPrimitive, FromPrimitive)]
#[repr(u8)]
pub enum LinkKey {
    /// `MARKET-EVE-C3Q-CC`
    MarketEveC3qCc = 0,
    /// `MARKET-EVE-C3Q-CC-EN`
    MarketEveC3qCcEn = 1,
    /// `MARKET-EVE-TYCOON`
    MarketEveTycoon = 2,
    /// `UNKNOWN`
    #[default]
    Unknown = 255,
}

#[derive(Debug, Clone)]
pub struct LinkService {
    links: Arc<HashMap<LinkKey, Option<String>>>,
}

impl LinkService {
    pub async fn init(root_path: &Path) -> anyhow::Result<Self> {
        let links_cfg = root_path.join("links.json");
        let file = fs::File::open(links_cfg)?;
        let mut buf = io::BufReader::new(file);
        let links: HashMap<LinkKey, Option<String>> = serde_json::from_reader(&mut buf)?;
        Ok(Self {
            links: Arc::new(links),
        })
    }

    pub fn get_link(&self, key: LinkKey, params: &HashMap<String, String>) -> Option<String> {
        self.links.get(&key).and_then(Option::as_ref).map(|url| {
            params.iter().fold(url.clone(), |acc, (k, v)| {
                acc.replace(&format!("{{{k}}}"), v)
            })
        })
    }
}

#[tauri::command]
pub async fn get_link_url(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    key: u8,
    params: HashMap<String, String>,
) -> Result<Option<String>, String> {
    let bundle = app_bundle.lock().await;
    let activated_bundle = bundle
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?;

    let key = LinkKey::from(key);
    Ok(activated_bundle.links.get_link(key, &params))
}
