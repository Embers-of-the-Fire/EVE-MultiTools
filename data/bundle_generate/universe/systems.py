from __future__ import annotations

import sqlite3

from enum import IntEnum
from enum import unique
from typing import TYPE_CHECKING

from pydantic import BaseModel
from pydantic import Field

from data import schema_pb2
from data.bundle_generate.consts import SYSTEMS_BIN_DATA_RES
from data.bundle_generate.consts import SYSTEMS_SCHEMA_RES
from data.bundle_generate.log import LOGGER
from data.bundle_generate.schema_resource import get_schema_resource
from data.bundle_generate.universe._type import UniversePoint  # noqa: TC001
from data.bundle_generate.universe._type import WormholeClassID  # noqa: TC001


if TYPE_CHECKING:
    from pathlib import Path

    from data.bundle_generate.resources import ResourceTree


@unique
class _JumpType(IntEnum):
    SOLAR_SYSTEM = 0
    CONSTELLATION = 1
    REGION = 2


class _Neighbour(BaseModel):
    solarSystemID: int
    stargateID: int
    jumpType: _JumpType


class _System(BaseModel):
    solarSystemID: int
    securityStatus: float
    constellationID: int
    regionID: int
    nameID: int
    center: UniversePoint
    pseudoSecurity: float
    securityClass: str = Field(default="")
    factionID: int | None = Field(default=None)
    sunTypeID: int | None = Field(default=None)
    sunFlareGraphicID: int | None = Field(default=None)
    wormholeClassID: WormholeClassID | None = Field(default=None)
    warpTunnelOverwrite: int | None = Field(default=None)
    systemWideCloud: int | None = Field(default=None)
    neighbours: list[_Neighbour] = Field(default_factory=list)
    planetCountByType: dict[int, int] = Field(default_factory=dict)
    planetItemIDs: list[int] = Field(default_factory=list)


async def collect_systems(index: ResourceTree, root: Path, loc_root: Path):
    systems = await get_schema_resource(index, SYSTEMS_SCHEMA_RES, SYSTEMS_BIN_DATA_RES)

    bundle_universe_db = root / "universe.db"
    system_lookup = schema_pb2.SystemLocalizationLookup()

    with sqlite3.connect(bundle_universe_db) as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='systems';")
        if cursor.fetchone():
            LOGGER.warning(f"Table 'systems' already exists in {bundle_universe_db}. Overwriting.")
            cursor.execute("DROP TABLE systems;")

        cursor.executescript("""
            CREATE TABLE IF NOT EXISTS systems (
                solar_system_id INTEGER PRIMARY KEY,
                name_id INTEGER NOT NULL,
                region_id INTEGER NOT NULL,
                constellation_id INTEGER NOT NULL,
                faction_id INTEGER,
                security_status REAL NOT NULL,
                wormhole_class_id INTEGER
            );
            CREATE INDEX IF NOT EXISTS idx_systems_region_id ON systems (region_id);
            CREATE INDEX IF NOT EXISTS idx_systems_constellation_id ON systems (constellation_id);
            CREATE INDEX IF NOT EXISTS idx_systems_faction_id ON systems (faction_id);
            CREATE INDEX IF NOT EXISTS idx_systems_security_status ON systems (security_status);
            CREATE INDEX IF NOT EXISTS idx_systems_wormhole_class_id ON systems (wormhole_class_id);
        """)

        for system_id, system_def in systems.items():
            try:
                validated = _System(**system_def)
            except Exception as e:
                LOGGER.error(f"Failed to parse system {system_id}: {e}")
                continue

            cursor.execute(
                """
                INSERT INTO systems (
                    solar_system_id,
                    name_id,
                    region_id,
                    constellation_id,
                    faction_id,
                    security_status,
                    wormhole_class_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?);
                """,
                (
                    system_id,
                    validated.nameID,
                    validated.regionID,
                    validated.constellationID,
                    validated.factionID,
                    validated.securityStatus,
                    validated.wormholeClassID.value if validated.wormholeClassID else None,
                ),
            )

            loc_entry = system_lookup.system_entries.add()
            loc_entry.system_id = system_id
            loc_entry.name_id = validated.nameID

        conn.commit()

    LOGGER.info(f"Collected {len(systems)} systems into {bundle_universe_db}")

    bundle_system_loc_lookup = loc_root / "system_localization_lookup.pb"
    if bundle_system_loc_lookup.exists():
        LOGGER.warning(
            f"System localization lookup file '{bundle_system_loc_lookup}' already exists. Overwriting."
        )
        bundle_system_loc_lookup.unlink()
    with open(bundle_system_loc_lookup, "wb+") as f:
        f.write(system_lookup.SerializeToString())
    LOGGER.info(
        f"Wrote {len(system_lookup.system_entries)} system localization entries to '{bundle_system_loc_lookup}'"
    )
