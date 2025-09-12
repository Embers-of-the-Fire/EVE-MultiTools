-- Init market table for mock database
-- For market data caching,
-- go to `src-tauri/src/data/market.rs` for more details.
CREATE TABLE IF NOT EXISTS market (
    type_id INTEGER PRIMARY KEY,
    sell_min REAL NOT NULL,
    buy_max REAL NOT NULL,
    updated_at INTEGER NOT NULL
);
