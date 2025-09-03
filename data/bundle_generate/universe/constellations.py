from __future__ import annotations

import sqlite3

from typing import TYPE_CHECKING

from pydantic import BaseModel
from pydantic import Field
from pydantic import ValidationError

from data import schema_pb2
from data.bundle_generate.consts import CONSTELLATIONS_BIN_DATA_RES
from data.bundle_generate.consts import CONSTELLATIONS_SCHEMA_RES
from data.bundle_generate.log import LOGGER
from data.bundle_generate.schema_resource import get_schema_resource
from data.bundle_generate.universe._type import UniversePoint  # noqa: TC001
from data.bundle_generate.universe._type import WormholeClassID  # noqa: TC001


if TYPE_CHECKING:
    from pathlib import Path

    from data.bundle_generate.resources import ResourceTree


class _Constellation(BaseModel):
    constellationID: int
    nameID: int
    regionID: int
    center: UniversePoint
    neighbours: list[int] = Field(default_factory=list)
    solarSystemIDs: list[int] = Field(default_factory=list)
    factionID: int | None = Field(default=None)
    wormholeClassID: WormholeClassID | None = Field(default=None)


def _pydantic_to_protobuf_constellation(pydantic_obj: _Constellation) -> schema_pb2.Constellation:
    pb_obj = schema_pb2.Constellation()
    pb_obj.constellation_id = pydantic_obj.constellationID
    pb_obj.name_id = pydantic_obj.nameID
    pb_obj.region_id = pydantic_obj.regionID
    pb_obj.center.x = pydantic_obj.center.x
    pb_obj.center.y = pydantic_obj.center.y
    pb_obj.center.z = pydantic_obj.center.z
    pb_obj.neighbours.extend(pydantic_obj.neighbours)
    pb_obj.solar_system_ids.extend(pydantic_obj.solarSystemIDs)
    if pydantic_obj.factionID is not None:
        pb_obj.faction_id = pydantic_obj.factionID
    if pydantic_obj.wormholeClassID is not None:
        pb_obj.wormhole_class_id = pydantic_obj.wormholeClassID.value
    return pb_obj


async def collect_constellations(index: ResourceTree, root: Path, loc_root: Path):
    constellations = await get_schema_resource(
        index, CONSTELLATIONS_SCHEMA_RES, CONSTELLATIONS_BIN_DATA_RES
    )

    bundle_universe_db = root / "universe.db"
    constellation_lookup = schema_pb2.ConstellationLocalizationLookup()

    with sqlite3.connect(bundle_universe_db) as conn:
        cursor = conn.cursor()

        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='constellations'"
        )
        if cursor.fetchone():
            LOGGER.warning(
                f"Table 'constellations' already exists in {bundle_universe_db}. Overwriting."
            )
            cursor.execute("DROP TABLE constellations")

        cursor.executescript("""
            CREATE TABLE IF NOT EXISTS constellations (
                constellation_id INTEGER PRIMARY KEY,
                name_id INTEGER NOT NULL,
                region_id INTEGER NOT NULL,
                faction_id INTEGER,
                wormhole_class_id INTEGER,
                constellation_data BLOB NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_constellations_region_id ON constellations (region_id);
            CREATE INDEX IF NOT EXISTS idx_constellations_faction_id ON constellations (faction_id);
            CREATE INDEX IF NOT EXISTS idx_constellations_wormhole_class_id ON constellations (wormhole_class_id);
        """)

        for constellation_id, constellation_def in constellations.items():
            try:
                pydantic_obj = _Constellation(**constellation_def)
            except ValidationError as e:
                LOGGER.error(f"Validation error for constellation ID {constellation_id}: {e}")
                continue

            pb_obj = _pydantic_to_protobuf_constellation(pydantic_obj)
            blob = pb_obj.SerializeToString()
            cursor.execute(
                """
                INSERT INTO constellations (
                    constellation_id,
                    name_id,
                    region_id,
                    faction_id,
                    wormhole_class_id,
                    constellation_data
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    constellation_id,
                    pydantic_obj.nameID,
                    pydantic_obj.regionID,
                    pydantic_obj.factionID,
                    pydantic_obj.wormholeClassID.value if pydantic_obj.wormholeClassID else None,
                    blob,
                ),
            )

            loc_entry = constellation_lookup.constellation_entries.add()
            loc_entry.constellation_id = constellation_id
            loc_entry.name_id = pydantic_obj.nameID

        conn.commit()

    LOGGER.info(f"Constellations data has been written to {bundle_universe_db}")

    bundle_constellation_loc_lookup = loc_root / "constellation_localization_lookup.pb"
    if bundle_constellation_loc_lookup.exists():
        LOGGER.warning(
            f"Constellation localization lookup file '{bundle_constellation_loc_lookup}' already exists. Overwriting."
        )
        bundle_constellation_loc_lookup.unlink()
    with open(bundle_constellation_loc_lookup, "wb+") as f:
        f.write(constellation_lookup.SerializeToString())
    LOGGER.info(
        f"Wrote {len(constellation_lookup.constellation_entries)} constellation localization entries to '{bundle_constellation_loc_lookup}'."
    )
