use std::path::Path;

use serde::{Deserialize, Serialize};
use sqlx::FromRow;

use crate::utils::database::SqliteConnection;

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Skin {
    pub skin_id: i64,
    pub internal_name: String,
    pub allow_ccp_devs: bool,
    pub skin_material_id: i64,
    pub visible_serenity: bool,
    pub visible_tranquility: bool,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct SkinMaterial {
    pub skin_material_id: i64,
    pub display_name_id: i64,
    pub material_set_id: i64,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct SkinLicense {
    pub license_id: i64,
    pub skin_id: i64,
    pub duration: i64,
}

pub struct SkinService {
    db: SqliteConnection,
}

#[tauri::command]
pub async fn get_skin(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    skin_id: i32,
) -> Result<Option<Skin>, String> {
    app_bundle
        .read()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .statics
        .skins
        .get_skin(skin_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_skin_material(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    skin_material_id: i32,
) -> Result<Option<SkinMaterial>, String> {
    app_bundle
        .read()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .statics
        .skins
        .get_skin_material(skin_material_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_skin_license(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    license_id: i32,
) -> Result<Option<SkinLicense>, String> {
    app_bundle
        .read()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .statics
        .skins
        .get_skin_license(license_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_skin_material_id_by_license(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    license_id: i32,
) -> Result<Option<i64>, String> {
    app_bundle
        .read()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .statics
        .skins
        .get_skin_material_id_by_license(license_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_licenses_by_skin(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    skin_id: i32,
) -> Result<Vec<SkinLicense>, String> {
    app_bundle
        .read()
        .await
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?
        .statics
        .skins
        .get_licenses_by_skin(skin_id)
        .await
        .map_err(|e| e.to_string())
}

impl SkinService {
    pub async fn init(root_path: &Path) -> anyhow::Result<Self> {
        let db_path = root_path.join("skins.db");
        let db = SqliteConnection::connect(db_path).await?;
        Ok(Self { db })
    }

    pub async fn get_skin(&self, skin_id: i32) -> anyhow::Result<Option<Skin>> {
        let out = sqlx::query_as!(Skin, "SELECT * FROM skins WHERE skin_id = ?", skin_id)
            .fetch_optional(self.db.pool())
            .await?;
        Ok(out)
    }

    pub async fn get_skin_material(
        &self,
        skin_material_id: i32,
    ) -> anyhow::Result<Option<SkinMaterial>> {
        let out = sqlx::query_as!(
            SkinMaterial,
            "SELECT * FROM skin_materials WHERE skin_material_id = ?",
            skin_material_id
        )
        .fetch_optional(self.db.pool())
        .await?;
        Ok(out)
    }

    pub async fn get_skin_license(&self, license_id: i32) -> anyhow::Result<Option<SkinLicense>> {
        let out = sqlx::query_as!(
            SkinLicense,
            "SELECT * FROM skin_licenses WHERE license_id = ?",
            license_id
        )
        .fetch_optional(self.db.pool())
        .await?;
        Ok(out)
    }

    pub async fn get_skin_material_id_by_license(
        &self,
        license_id: i32,
    ) -> anyhow::Result<Option<i64>> {
        let row = sqlx::query!(
            "SELECT s.skin_material_id FROM skin_licenses l JOIN skins s ON l.skin_id = s.skin_id WHERE l.license_id = ?",
            license_id
        )
        .fetch_optional(self.db.pool())
        .await?;
        Ok(row.map(|r| r.skin_material_id))
    }

    pub async fn get_licenses_by_skin(&self, skin_id: i32) -> anyhow::Result<Vec<SkinLicense>> {
        let out = sqlx::query_as!(
            SkinLicense,
            "SELECT * FROM skin_licenses WHERE skin_id = ?",
            skin_id
        )
        .fetch_all(self.db.pool())
        .await?;
        Ok(out)
    }
}
