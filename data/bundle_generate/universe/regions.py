from __future__ import annotations

import sqlite3

from typing import TYPE_CHECKING

from pydantic import BaseModel
from pydantic import Field
from pydantic import ValidationError

from data import schema_pb2
from data.bundle_generate.consts import REGIONS_BIN_DATA_RES
from data.bundle_generate.consts import REGIONS_SCHEMA_RES
from data.bundle_generate.log import LOGGER
from data.bundle_generate.schema_resource import get_schema_resource
from data.bundle_generate.universe._type import UniversePoint  # noqa: TC001
from data.bundle_generate.universe._type import WormholeClassID  # noqa: TC001


if TYPE_CHECKING:
    from pathlib import Path

    from data.bundle_generate.resources import ResourceTree


class _Region(BaseModel):
    regionID: int
    nameID: int
    center: UniversePoint
    descriptionID: int | None = Field(default=None)
    neighbours: list[int] = Field(default_factory=list)
    constellationIDs: list[int] = Field(default_factory=list)
    solarSystemIDs: list[int] = Field(default_factory=list)
    factionID: int | None = Field(default=None)
    wormholeClassID: WormholeClassID | None = Field(default=None)


def _pydantic_to_protobuf_region(pydantic_obj: _Region) -> schema_pb2.Region:
    pb_obj = schema_pb2.Region()
    pb_obj.region_id = pydantic_obj.regionID
    pb_obj.name_id = pydantic_obj.nameID
    if pydantic_obj.descriptionID is not None:
        pb_obj.description_id = pydantic_obj.descriptionID
    pb_obj.center.x = pydantic_obj.center.x
    pb_obj.center.y = pydantic_obj.center.y
    pb_obj.center.z = pydantic_obj.center.z
    pb_obj.neighbours.extend(pydantic_obj.neighbours)
    pb_obj.constellation_ids.extend(pydantic_obj.constellationIDs)
    pb_obj.solar_system_ids.extend(pydantic_obj.solarSystemIDs)
    if pydantic_obj.factionID is not None:
        pb_obj.faction_id = pydantic_obj.factionID
    if pydantic_obj.wormholeClassID is not None:
        pb_obj.wormhole_class_id = pydantic_obj.wormholeClassID.value
        pb_obj.region_type = pydantic_obj.wormholeClassID.get_region_type(
            pydantic_obj.regionID
        ).value
    return pb_obj


async def collect_regions(index: ResourceTree, root: Path, loc_root: Path):
    regions = await get_schema_resource(index, REGIONS_SCHEMA_RES, REGIONS_BIN_DATA_RES)

    bundle_universe_db = root / "universe.db"
    region_lookup = schema_pb2.RegionLocalizationLookup()

    with sqlite3.connect(bundle_universe_db) as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='regions'")
        if cursor.fetchone():
            LOGGER.warning(f"Table 'regions' already exists in {bundle_universe_db}. Overwriting.")
            cursor.execute("DROP TABLE regions")

        cursor.executescript("""
            CREATE TABLE IF NOT EXISTS regions (
                region_id INTEGER PRIMARY KEY,
                name_id INTEGER NOT NULL,
                region_type INTEGER,
                wormhole_class_id INTEGER,
                faction_id INTEGER,
                region_data BLOB NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_regions_region_type ON regions (region_type);
            CREATE INDEX IF NOT EXISTS idx_regions_wormhole_class_id ON regions (wormhole_class_id);
            CREATE INDEX IF NOT EXISTS idx_regions_faction_id ON regions (faction_id);
        """)

        for region_id, region_def in regions.items():
            try:
                validated = _Region(**region_def)
            except ValidationError as e:
                LOGGER.error(f"Failed to validate region {region_id}: {e}")

            region_data = _pydantic_to_protobuf_region(validated).SerializeToString()
            if validated.wormholeClassID is not None:
                wmid = validated.wormholeClassID.value
                reg_ty = validated.wormholeClassID.get_region_type(region_id).value
            else:
                wmid = None
                reg_ty = None
            cursor.execute(
                "INSERT INTO regions (region_id, name_id, region_type, wormhole_class_id, faction_id, region_data) VALUES (?, ?, ?, ?, ?, ?);",
                (
                    region_id,
                    validated.nameID,
                    reg_ty,
                    wmid,
                    validated.factionID,
                    region_data,
                ),
            )

            loc_entry = region_lookup.region_entries.add()
            loc_entry.region_id = region_id
            loc_entry.name_id = validated.nameID
            if validated.descriptionID is not None:
                loc_entry.description_id = validated.descriptionID

        conn.commit()

    LOGGER.info(f"Regions data written to {bundle_universe_db}")

    bundle_region_loc_lookup = loc_root / "region_localization_lookup.pb"
    if bundle_region_loc_lookup.exists():
        LOGGER.warning(
            f"Region localization lookup file '{bundle_region_loc_lookup}' already exists. Overwriting."
        )
        bundle_region_loc_lookup.unlink()
    with open(bundle_region_loc_lookup, "wb+") as f:
        f.write(region_lookup.SerializeToString())
    LOGGER.info(
        f"Wrote {len(region_lookup.region_entries)} region localization entries to '{bundle_region_loc_lookup}'"
    )
