from __future__ import annotations

from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

DATA_ROOT = PROJECT_ROOT / "data"

BUNDLE_WS_ROOT = DATA_ROOT / "bundle-ws"
BUNDLE_CACHE_ROOT = DATA_ROOT / "bundle-cache"
BUNDLE_OUTPUT_ROOT = DATA_ROOT / "bundle"

BUNDLE_LOG_FILE = DATA_ROOT / "bundle.log"

BUNDLE_ESI_KEY_LIST = DATA_ROOT / "esi_keys.list.json"
BUNDLE_LINKS_LIST = DATA_ROOT / "links.list.json"

BUNDLE_MOCK_DB = DATA_ROOT / "eve-multitools-sqlite-mock.db"

BUNDLE_EXTERNAL_SQL = DATA_ROOT / "external-sql"
