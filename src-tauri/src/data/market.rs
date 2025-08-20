use std::f64;

use futures::{stream, StreamExt, TryStreamExt};
use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

use crate::{
    __map,
    bundle::BundleDescriptor,
    data::esi::{EsiKey, EsiService},
    utils::database::SqliteConnection,
};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, FromRow)]
pub struct Price {
    pub type_id: i64,
    pub sell_min: Option<f64>,
    pub buy_max: Option<f64>,
}

impl Price {
    pub fn init(type_id: i64) -> Self {
        Self {
            type_id,
            sell_min: None,
            buy_max: None,
        }
    }

    fn from_orders<'a>(type_id: i64, orders: impl Iterator<Item = &'a Order>) -> Self {
        let mut p = Self::init(type_id);
        for order in orders {
            if order.is_buy_order {
                if p.buy_max.is_none_or(|t| t < order.price) {
                    p.buy_max = Some(order.price);
                }
            } else if p.sell_min.is_none_or(|t| t > order.price) {
                p.sell_min = Some(order.price);
            }
        }
        p
    }

    pub fn merge(&self, rhs: &Self) -> Self {
        Self {
            type_id: self.type_id,
            sell_min: match (self.sell_min, rhs.sell_min) {
                (Some(a), Some(b)) => Some(a.min(b)),
                (Some(a), None) => Some(a),
                (None, Some(b)) => Some(b),
                (None, None) => None,
            },
            buy_max: match (self.buy_max, rhs.buy_max) {
                (Some(a), Some(b)) => Some(a.max(b)),
                (Some(a), None) => Some(a),
                (None, Some(b)) => Some(b),
                (None, None) => None,
            },
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, FromRow)]
pub struct PriceRecord {
    pub type_id: i64,
    pub sell_min: Option<f64>,
    pub buy_max: Option<f64>,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Order {
    pub duration: i64,
    pub is_buy_order: bool,
    pub issued: String,
    pub location_id: i64,
    pub min_volume: i64,
    pub order_id: i64,
    pub price: f64,
    pub range: String,
    pub system_id: i64,
    pub type_id: i64,
    pub volume_remain: i64,
}

#[derive(Clone)]
pub struct MarketService {
    db: SqliteConnection,
}

impl MarketService {
    pub async fn init(descriptor: &BundleDescriptor) -> anyhow::Result<Self> {
        let db_path = descriptor.root.join("market.db");
        let db = SqliteConnection::connect(db_path).await?;

        sqlx::query!(
            "
            CREATE TABLE IF NOT EXISTS market (
                type_id INTEGER PRIMARY KEY,
                sell_min REAL,
                buy_max REAL,
                updated_at INTEGER NOT NULL
            )
            "
        )
        .execute(db.pool())
        .await?;

        Ok(Self { db })
    }

    pub async fn fetch_market_price(
        &self,
        esi: &EsiService,
        type_id: i64,
    ) -> anyhow::Result<PriceRecord> {
        let now = chrono::Utc::now().timestamp();

        let (price, pages) = Self::fetch_esi_market_first(esi, type_id).await?;
        if pages > 1 {
            for page in 2..=pages {
                let p = Self::fetch_esi_market(esi, type_id, page).await?;
                price.merge(&p);
            }
        }

        let price = PriceRecord {
            type_id: price.type_id,
            sell_min: price.sell_min,
            buy_max: price.buy_max,
            updated_at: now,
        };

        sqlx::query!(
            "INSERT OR REPLACE INTO market (type_id, sell_min, buy_max, updated_at) VALUES (?, ?, ?, ?)",
            price.type_id,
            price.sell_min,
            price.buy_max,
            price.updated_at
        ).execute(self.db.pool()).await?;

        Ok(price)
    }

    async fn fetch_esi_market_first(
        esi: &EsiService,
        type_id: i64,
    ) -> anyhow::Result<(Price, i32)> {
        let params = __map! {
            "regionId".to_string() => format!("10000002"),
            "typeId".to_string() => format!("{type_id}"),
            "page".to_string() => format!("1"),
        };

        let (m, h): (Vec<Order>, _) = esi.query_with_header(EsiKey::MarketOrders, &params).await?;
        let pages = h
            .get("X-Pages")
            .and_then(|p| p.to_str().ok())
            .and_then(|p| p.parse().ok())
            .unwrap_or(1);
        Ok((Price::from_orders(type_id, m.iter()), pages))
    }

    async fn fetch_esi_market(esi: &EsiService, type_id: i64, page: i32) -> anyhow::Result<Price> {
        let params = __map! {
            "regionId".to_string() => format!("10000002"),
            "typeId".to_string() => format!("{type_id}"),
            "page".to_string() => format!("{page}"),
        };

        let m: Vec<Order> = esi.query(EsiKey::MarketOrders, &params).await?;
        Ok(Price::from_orders(type_id, m.iter()))
    }
}

#[tauri::command]
pub async fn get_market_price(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    type_id: i64,
) -> Result<PriceRecord, String> {
    let bundle = app_bundle.lock().await;
    let activated_bundle = bundle
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?;

    activated_bundle
        .market
        .fetch_market_price(&activated_bundle.esi, type_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_market_prices(
    app_bundle: tauri::State<'_, crate::bundle::AppBundleState>,
    type_ids: Vec<i64>,
) -> Result<Vec<PriceRecord>, String> {
    let bundle = app_bundle.lock().await;
    let activated_bundle = bundle
        .activated_bundle
        .as_ref()
        .ok_or("No activated bundle found".to_string())?;

    // We use unordered future to fetch prices concurrently
    let futures = stream::iter(type_ids)
        .map(|type_id| {
            let esi = activated_bundle.esi.clone();
            let market = activated_bundle.market.clone();
            async move { market.fetch_market_price(&esi, type_id).await }
        })
        .buffered(4);

    let out = futures
        .try_collect::<Vec<_>>()
        .await
        .map_err(|e| format!("Unable to fetch all market prices: {e:?}"))?;
    Ok(out)
}
