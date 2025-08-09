use std::{collections::HashMap, fs, io, path::Path, sync::Arc};

use anyhow::anyhow;
use reqwest::Client;
use serde::de::DeserializeOwned;
use string_enum::StringEnum;

use crate::utils::request::ParamRequest;

#[derive(Hash, Clone, Copy, PartialEq, Eq, StringEnum)]
pub enum EsiKey {
    /// `MARKET-ORDERS`
    MarketOrders,
}

#[derive(Debug, Clone)]
pub struct EsiService {
    client: Client,
    urls: Arc<HashMap<EsiKey, ParamRequest>>,
}

impl EsiService {
    pub async fn init(root_path: &Path) -> anyhow::Result<Self> {
        let esi_cfg = root_path.join("esi.json");
        let file = fs::File::open(esi_cfg)?;
        let mut buf = io::BufReader::new(file);
        let urls = serde_json::from_reader(&mut buf)?;
        let client = Client::new();
        Ok(Self { client, urls })
    }
    pub async fn query<T: DeserializeOwned>(
        &self,
        key: EsiKey,
        params: &HashMap<String, String>,
    ) -> anyhow::Result<T> {
        self.urls
            .get(&key)
            .ok_or(anyhow!("Unknown esi key: {key}"))?
            .query(&self.client, params)
            .await
    }

    pub async fn query_with_header<T: DeserializeOwned>(
        &self,
        key: EsiKey,
        params: &HashMap<String, String>,
    ) -> anyhow::Result<(T, reqwest::header::HeaderMap)> {
        self.urls
            .get(&key)
            .ok_or(anyhow!("Unknown esi key: {key}"))?
            .query_with_header(&self.client, params)
            .await
    }
}
