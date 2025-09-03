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


class _TypeMaterial(BaseModel):
    """Type material definition.

    This mirrors the structure of typeMaterials.json in the FSD."""

    class _Material(BaseModel):
        """Material definition."""

        materialTypeID: int
        quantity: int

    materials: list[_Material] = Field(default_factory=list)


def _pydantic_to_protobuf_type_material(pydantic_obj: _TypeMaterial) -> schema_pb2.TypeMaterial:
    """Convert Pydantic TypeMaterial to protobuf TypeMaterial."""
    pb_obj = schema_pb2.TypeMaterial()

    # Convert materials
    for material in pydantic_obj.materials:
        pb_material = pb_obj.materials.add()
        pb_material.material_type_id = material.materialTypeID
        pb_material.quantity = material.quantity

    return pb_obj


def collect_type_materials(fsd: Fsd, bundle_static: Path) -> None:
    type_materials = fsd.get_fsd("typematerials")
    if type_materials is None:
        return

    bundle_materials_db = bundle_static / "type_materials.db"
    if bundle_materials_db.exists():
        LOGGER.warning(f"Type materials file '{bundle_materials_db}' already exists. Overwriting.")
        bundle_materials_db.unlink()

    with sqlite3.connect(bundle_materials_db) as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS type_materials (
                type_id INTEGER PRIMARY KEY NOT NULL UNIQUE,
                materials_data BLOB NOT NULL
            )
            """
        )

        for type_id, material_def in type_materials.items():
            try:
                validated = _TypeMaterial(**material_def)
            except ValidationError as e:
                LOGGER.error(f"Validation error for typeID {type_id} in typeMaterials: {e}")
                continue

            pb_material = _pydantic_to_protobuf_type_material(validated)
            material_blob = pb_material.SerializeToString()

            cursor.execute(
                "INSERT INTO type_materials (type_id, materials_data) VALUES (?, ?)",
                (int(type_id), material_blob),
            )

        conn.commit()

    LOGGER.info("Type materials data collected successfully.")
