use std::collections::HashMap;

use anyhow::anyhow;
use serde::{de::DeserializeOwned, Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum RequestMethod {
    Get,
    Post,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParamRequest {
    url: String,
    method: RequestMethod,
    #[serde(default, skip_serializing_if = "HashMap::is_empty")]
    query: HashMap<String, String>,
    #[serde(default, skip_serializing_if = "HashMap::is_empty")]
    header: HashMap<String, String>,
    /// This field should be a json-encoded string,
    /// but to support parameterization, we use plain string here.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    body: Option<String>,
}

impl ParamRequest {
    fn render(template: &str, params: &HashMap<String, String>) -> anyhow::Result<String> {
        let mut result = template.to_string();
        for (key, value) in params {
            let placeholder = format!("{{{key}}}");
            if !result.contains(&placeholder) {
                continue;
            }
            result = result.replace(&placeholder, value);
        }

        if result.contains('{') {
            return Err(anyhow!(
                "Unresolved placeholders in template, failed to render"
            ));
        }

        Ok(result)
    }

    pub async fn query<T: DeserializeOwned>(
        &self,
        client: &reqwest::Client,
        params: &HashMap<String, String>,
    ) -> anyhow::Result<T> {
        let url = Self::render(&self.url, params)?;

        let mut req_builder = match self.method {
            RequestMethod::Get => client.get(&url),
            RequestMethod::Post => client.post(&url),
        };

        for (key, value) in &self.header {
            let header_value = Self::render(value, params)?;
            req_builder = req_builder.header(key, header_value);
        }
        for (key, value) in &self.query {
            let query_value = Self::render(value, params)?;
            req_builder = req_builder.query(&[(key, query_value)]);
        }

        if let Some(body) = &self.body {
            let body_value = Self::render(body, params)?;
            req_builder = req_builder.body(body_value);
        }

        let resp = req_builder.send().await?;
        if !resp.status().is_success() {
            return Err(anyhow!("Request failed with status: {}", resp.status()));
        }
        let resp_json = resp.json::<T>().await?;
        Ok(resp_json)
    }

    pub async fn query_with_header<T: DeserializeOwned>(
        &self,
        client: &reqwest::Client,
        params: &HashMap<String, String>,
    ) -> anyhow::Result<(T, reqwest::header::HeaderMap)> {
        let url = Self::render(&self.url, params)?;

        let mut req_builder = match self.method {
            RequestMethod::Get => client.get(&url),
            RequestMethod::Post => client.post(&url),
        };

        for (key, value) in &self.header {
            let header_value = Self::render(value, params)?;
            req_builder = req_builder.header(key, header_value);
        }
        for (key, value) in &self.query {
            let query_value = Self::render(value, params)?;
            req_builder = req_builder.query(&[(key, query_value)]);
        }

        if let Some(body) = &self.body {
            let body_value = Self::render(body, params)?;
            req_builder = req_builder.body(body_value);
        }

        let resp = req_builder.send().await?;
        if !resp.status().is_success() {
            return Err(anyhow!("Request failed with status: {}", resp.status()));
        }
        let h = resp.headers().clone();
        let resp_json = resp.json::<T>().await?;
        Ok((resp_json, h))
    }
}
