from __future__ import annotations

import sqlite3

from typing import TYPE_CHECKING

from pydantic import BaseModel
from pydantic import Field
from pydantic import ValidationError

from data import schema_pb2
from data.bundle_generate.log import LOGGER


if TYPE_CHECKING:
    from pathlib import Path

    from data.bundle_generate.resources import Fsd


class _StationOperation(BaseModel):
    activityID: int
    border: float
    corridor: float
    descriptionID: int | None = Field(default=None)
    fringe: float
    hub: float
    manufacturingFactor: float
    operationNameID: int
    ratio: float
    researchFactor: float
    services: list[int] = Field(default_factory=list)
    stationTypes: dict[str, int] = Field(default_factory=dict)


def _pydantic_to_protobuf_station_operation(
    pydantic_obj: _StationOperation, station_operation_id: int
) -> schema_pb2.StationOperation:
    pb_obj = schema_pb2.StationOperation()
    pb_obj.operation_id = station_operation_id
    pb_obj.activity_id = pydantic_obj.activityID
    pb_obj.border = pydantic_obj.border
    pb_obj.corridor = pydantic_obj.corridor
    if pydantic_obj.descriptionID is not None:
        pb_obj.description_id = pydantic_obj.descriptionID
    pb_obj.fringe = pydantic_obj.fringe
    pb_obj.hub = pydantic_obj.hub
    pb_obj.manufacturing_factor = pydantic_obj.manufacturingFactor
    pb_obj.operation_name_id = pydantic_obj.operationNameID
    pb_obj.ratio = pydantic_obj.ratio
    pb_obj.research_factor = pydantic_obj.researchFactor
    pb_obj.services.extend(pydantic_obj.services)
    pb_obj.station_types.extend(
        v for _, v in sorted(pydantic_obj.stationTypes.items(), key=lambda t: int(t[1]))
    )
    return pb_obj


def collect_station_operation(
    fsd: Fsd,
    bundle_static: Path,
    loc_root: Path,
):
    station_operations = fsd.get_fsd("stationoperations")
    if station_operations is None:
        return

    station_operations_db = bundle_static / "station_operations.db"
    station_op_lookup = schema_pb2.StationOperationLocalizationLookup()

    if station_operations_db.exists():
        LOGGER.warning(
            f"Station operations database '{station_operations_db}' already exists. Overwriting."
        )
        station_operations_db.unlink()

    with sqlite3.connect(station_operations_db) as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE station_operations (
                operation_id INTEGER PRIMARY KEY,
                name_id INTEGER NOT NULL,
                description_id INTEGER,
                data BLOB NOT NULL
            )
            """
        )

        for operation_id, operation_def in station_operations.items():
            operation_id = int(operation_id)
            try:
                validated = _StationOperation(**operation_def)
            except ValidationError:
                LOGGER.error(
                    f"Invalid station operation definition for ID {operation_id}: {operation_def}"
                )
                continue

            blob = _pydantic_to_protobuf_station_operation(
                validated, operation_id
            ).SerializeToString()

            cursor.execute(
                """
                INSERT INTO station_operations (operation_id, name_id, description_id, data)
                VALUES (?, ?, ?, ?)
                """,
                (
                    operation_id,
                    validated.operationNameID,
                    validated.descriptionID,
                    blob,
                ),
            )

            loc_entry = station_op_lookup.station_operation_entries.add()
            loc_entry.operation_id = operation_id
            loc_entry.name_id = validated.operationNameID
            if validated.descriptionID is not None:
                loc_entry.description_id = validated.descriptionID

        conn.commit()

    bundle_station_op_lookup = loc_root / "station_operation_localization_lookup.pb"
    if bundle_station_op_lookup.exists():
        LOGGER.warning(
            f"Station operation localization lookup file '{bundle_station_op_lookup}' already exists. Overwriting."
        )
        bundle_station_op_lookup.unlink()

    with open(bundle_station_op_lookup, "wb") as f:
        f.write(station_op_lookup.SerializeToString())
