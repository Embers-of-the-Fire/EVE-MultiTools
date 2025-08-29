from __future__ import annotations

import sqlite3

from enum import IntEnum
from enum import unique
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


if TYPE_CHECKING:
    from pathlib import Path

    from data.bundle_generate.resources import ResourceTree


class _WormholeClassID(IntEnum):
    C1 = 1
    C2 = 2
    C3 = 3
    C4 = 4
    C5 = 5
    C6 = 6
    HIGH_SEC = 7
    LOW_SEC = 8
    NULL_SEC = 9
    THERA = 12
    SMALL_SHIP = 13
    VOID = 19
    ABYSSAL1 = 19
    ABYSSAL2 = 20
    ABYSSAL3 = 21
    ABYSSAL4 = 22
    ABYSSAL5 = 23
    POCHVEN = 25

    def get_region_type(self, region_id) -> _RegionType:
        if self == _WormholeClassID.HIGH_SEC:
            return _RegionType.HIGH_SEC
        elif self == _WormholeClassID.LOW_SEC:
            return _RegionType.LOW_SEC
        elif self == _WormholeClassID.NULL_SEC:
            return _RegionType.NULL_SEC
        elif (
            self == _RegionType.VOID and 14_000_000 <= region_id < 15_000_000
        ):  # a little hack for abyssal regions
            return _RegionType.VOID
        elif self in {
            _WormholeClassID.ABYSSAL1,
            _WormholeClassID.ABYSSAL2,
            _WormholeClassID.ABYSSAL3,
            _WormholeClassID.ABYSSAL4,
            _WormholeClassID.ABYSSAL5,
        }:
            return _RegionType.ABYSSAL
        elif self == _WormholeClassID.POCHVEN:
            return _RegionType.POCHVEN
        else:
            return _RegionType.WORMHOLE


@unique
class _RegionType(IntEnum):
    HIGH_SEC = 1
    LOW_SEC = 2
    NULL_SEC = 3
    WORMHOLE = 4
    VOID = 5
    ABYSSAL = 6
    POCHVEN = 7


class _Region(BaseModel):
    regionID: int
    nameID: int
    center: UniversePoint
    descriptionID: int | None = Field(default=None)
    neighbours: list[int] = Field(default_factory=list)
    constellationIDs: list[int] = Field(default_factory=list)
    solarSystemIDs: list[int] = Field(default_factory=list)
    factionID: int | None = Field(default=None)
    wormholeClassID: _WormholeClassID | None = Field(default=None)


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


async def collect_regions(index: ResourceTree, root: Path):
    regions = await get_schema_resource(index, REGIONS_SCHEMA_RES, REGIONS_BIN_DATA_RES)

    bundle_universe_db = root / "universe.db"
    if bundle_universe_db.exists():
        LOGGER.warning(f"Overwriting existing file: {bundle_universe_db}")
        bundle_universe_db.unlink()

    with sqlite3.connect(bundle_universe_db) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS regions (
                region_id INTEGER PRIMARY KEY,
                region_data BLOB NOT NULL
            );
        """)

        for region_id, region_def in regions.items():
            try:
                validated = _Region(**region_def)
            except ValidationError as e:
                LOGGER.error(f"Failed to validate region {region_id}: {e}")

            region_data = _pydantic_to_protobuf_region(validated).SerializeToString()
            cursor.execute(
                "INSERT INTO regions (region_id, region_data) VALUES (?, ?);",
                (region_id, region_data),
            )

        conn.commit()

    LOGGER.info(f"Regions data written to {bundle_universe_db}")
