use std::path::Path;

use nohash_hasher::IntMap;
use serde::{Deserialize, Serialize};
use tokio::{fs::File, io::AsyncReadExt};
use prost::Message;

use crate::bundle::AppBundleState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    pub category_id: i32,
    pub category_name_id: i32,
    pub icon_id: Option<i32>,
    pub published: bool,
}

#[derive(Debug)]
pub struct CategoriesService {
    pub categories: IntMap<i32, Category>,
}

impl CategoriesService {
    pub async fn init(static_path: &Path) -> anyhow::Result<Self> {
        let static_categories_path = static_path.join("categories.pb");
        let mut file = File::open(&static_categories_path).await?;
        let mut buf = Vec::new();
        file.read_to_end(&mut buf).await?;
        let proto = crate::data::proto::schema::CategoryCollection::decode(&buf[..])?;

        Ok(Self {
            categories: proto
                .categories
                .into_iter()
                .map(|def| {
                    (
                        def.category_id,
                        Category {
                            category_id: def.category_data.category_id,
                            category_name_id: def.category_data.category_name_id,
                            icon_id: def.category_data.icon_id,
                            published: def.category_data.published,
                        },
                    )
                })
                .collect(),
        })
    }

    pub fn get_category(&self, category_id: i32) -> Option<&Category> {
        self.categories.get(&category_id)
    }
}

#[tauri::command]
pub async fn get_category(
    category_id: i32,
    app_bundle: tauri::State<'_, AppBundleState>,
) -> Result<Option<Category>, String> {
    Ok(app_bundle
        .lock()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .statics
        .categories
        .get_category(category_id)
        .cloned())
}
