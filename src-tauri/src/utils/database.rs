use sqlx::{
    sqlite::{SqliteConnectOptions, SqlitePoolOptions},
    SqlitePool,
};
use std::path::Path;
use std::str::FromStr;

#[derive(Clone)]
pub struct SqliteConnection {
    pool: SqlitePool,
}

impl SqliteConnection {
    pub async fn connect<P: AsRef<Path>>(db_path: P) -> Result<Self, sqlx::Error> {
        let options = SqliteConnectOptions::from_str(db_path.as_ref().to_str().unwrap())?
            .create_if_missing(true)
            .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal)
            .busy_timeout(std::time::Duration::from_secs(5))
            .to_owned();

        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .min_connections(1)
            .connect_with(options)
            .await?;

        Ok(SqliteConnection { pool })
    }

    pub fn pool(&self) -> &SqlitePool {
        &self.pool
    }
}
