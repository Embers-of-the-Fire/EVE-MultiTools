from __future__ import annotations

import json
import sqlite3

from typing import TYPE_CHECKING

from data.bundle_generate.consts import SKIN_LICENSES_STATIC_RES
from data.bundle_generate.consts import SKIN_MATERIALS_STATIC_RES
from data.bundle_generate.consts import SKINS_STATIC_RES
from data.bundle_generate.log import LOGGER


if TYPE_CHECKING:
    from pathlib import Path

    from data.bundle_generate.resources import Fsd
    from data.bundle_generate.resources import ResourceTree


CREATE_SKINS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS skins (
    skin_id INTEGER PRIMARY KEY,
    internal_name TEXT NOT NULL,
    allow_ccp_devs BOOLEAN NOT NULL,
    skin_material_id INTEGER NOT NULL,
    visible_serenity BOOLEAN NOT NULL,
    visible_tranquility BOOLEAN NOT NULL
);
"""
CREATE_SKIN_MATERIALS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS skin_materials (
    skin_material_id INTEGER PRIMARY KEY,
    display_name_id INTEGER NOT NULL,
    material_set_id INTEGER NOT NULL
);
"""
CREATE_SKIN_LICENSES_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS skin_licenses (
    license_id INTEGER PRIMARY KEY,
    skin_id INTEGER NOT NULL,
    duration INTEGER NOT NULL,
    FOREIGN KEY (skin_id) REFERENCES skins(skin_id)
);
"""
CREATE_SKIN_TYPES_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS skin_types (
    skin_id INTEGER NOT NULL,
    type_id INTEGER NOT NULL,
    PRIMARY KEY (skin_id, type_id),
    FOREIGN KEY (skin_id) REFERENCES skins(skin_id)
);
"""
CREATE_INDEXES_SQL = """
CREATE INDEX IF NOT EXISTS idx_skin_licenses_skin_id ON skin_licenses(skin_id);
CREATE INDEX IF NOT EXISTS idx_skin_types_type_id ON skin_types(type_id);
"""


async def collect_skin_infos(fsd: Fsd, index: ResourceTree, bundle_static: Path):
    bundle_skins_db = bundle_static / "skins.db"
    if bundle_skins_db.exists():
        LOGGER.warning(f"Skins database '{bundle_skins_db}' already exists. Overwriting.")
        bundle_skins_db.unlink()

    with sqlite3.connect(bundle_skins_db) as conn:
        cursor = conn.cursor()
        cursor.execute(CREATE_SKINS_TABLE_SQL)
        cursor.execute(CREATE_SKIN_MATERIALS_TABLE_SQL)
        cursor.execute(CREATE_SKIN_LICENSES_TABLE_SQL)
        cursor.execute(CREATE_SKIN_TYPES_TABLE_SQL)
        cursor.executescript(CREATE_INDEXES_SQL)
        conn.commit()

        with (
            sqlite3.connect(
                (await index.download_resource(SKINS_STATIC_RES)).file_path
            ) as skins_static_db,
            sqlite3.connect(
                (await index.download_resource(SKIN_MATERIALS_STATIC_RES)).file_path
            ) as skin_materials_static_db,
            sqlite3.connect(
                (await index.download_resource(SKIN_LICENSES_STATIC_RES)).file_path
            ) as skin_licenses_static_db,
        ):
            skins_static_cur = skins_static_db.cursor()
            skin_materials_static_cur = skin_materials_static_db.cursor()
            skin_licenses_static_cur = skin_licenses_static_db.cursor()

            cursor.executemany(
                "INSERT INTO skins VALUES (?, ?, ?, ?, ?, ?)",
                (
                    (
                        key,
                        value["internalName"],
                        value["allowCCPDevs"],
                        value["skinMaterialID"],
                        value["visibleSerenity"],
                        value["visibleTranquility"],
                    )
                    for key, value in (
                        (t[0], json.loads(t[1]))
                        for t in skins_static_cur.execute("SELECT key, value FROM cache").fetchall()
                    )
                ),
            )

            cursor.executemany(
                "INSERT INTO skin_materials VALUES (?, ?, ?)",
                (
                    (
                        key,
                        value["displayNameID"],
                        value["materialSetID"],
                    )
                    for key, value in (
                        (t[0], json.loads(t[1]))
                        for t in skin_materials_static_cur.execute(
                            "SELECT key, value FROM cache"
                        ).fetchall()
                    )
                ),
            )

            cursor.executemany(
                "INSERT INTO skin_licenses (license_id, skin_id, duration) VALUES (?, ?, ?)",
                (
                    (
                        value["licenseTypeID"],
                        value["skinID"],
                        value["duration"],
                    )
                    for _, value in (
                        (t[0], json.loads(t[1]))
                        for t in skin_licenses_static_cur.execute(
                            "SELECT key, value FROM cache"
                        ).fetchall()
                    )
                ),
            )

            for key, value in (
                (t[0], json.loads(t[1]))
                for t in skins_static_cur.execute("SELECT key, value FROM cache").fetchall()
            ):
                if value.get("types"):
                    cursor.executemany(
                        "INSERT INTO skin_types (skin_id, type_id) VALUES (?, ?)",
                        ((key, type_id) for type_id in value["types"]),
                    )

            skins_static_db.commit()
            skin_materials_static_db.commit()
            skin_licenses_static_db.commit()

        conn.commit()

    LOGGER.info(f"Skin information database created at '{bundle_skins_db}'.")
