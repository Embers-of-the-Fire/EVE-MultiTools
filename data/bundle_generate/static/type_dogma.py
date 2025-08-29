from __future__ import annotations

import sqlite3

from typing import TYPE_CHECKING

from pydantic import BaseModel
from pydantic import Field
from pydantic import ValidationError

from data import schema_pb2
from data.bundle_generate.log import LOGGER
from data.bundle_generate.types import BoolInt  # noqa: TC001


if TYPE_CHECKING:
    from pathlib import Path

    from data.bundle_generate.resources import Fsd


class _TypeDogma(BaseModel):
    """Type dogma definition.

    This mirrors the structure of typeDogma.json in the FSD."""

    class _DogmaAttribute(BaseModel):
        """Dogma attribute definition."""

        attributeID: int
        value: float

    class _DogmaEffect(BaseModel):
        """Dogma effect definition."""

        effectID: int
        isDefault: BoolInt

    dogmaAttributes: list[_DogmaAttribute] = Field(default_factory=list)
    dogmaEffects: list[_DogmaEffect] = Field(default_factory=list)


def _pydantic_to_protobuf_type_dogma(pydantic_obj: _TypeDogma) -> schema_pb2.TypeDogma:
    """Convert Pydantic TypeDogma to protobuf TypeDogma."""
    pb_obj = schema_pb2.TypeDogma()

    # Convert dogma attributes
    for attr in pydantic_obj.dogmaAttributes:
        pb_attr = pb_obj.dogma_attributes.add()
        pb_attr.attribute_id = attr.attributeID
        pb_attr.value = attr.value

    # Convert dogma effects
    for effect in pydantic_obj.dogmaEffects:
        pb_effect = pb_obj.dogma_effects.add()
        pb_effect.effect_id = effect.effectID
        pb_effect.is_default = effect.isDefault

    return pb_obj


def collect_type_dogma(fsd: Fsd, bundle_static: Path):
    type_dogmas = fsd.get_fsd("typeDogma")
    if type_dogmas is None:
        return

    bundle_dogma_db = bundle_static / "type_dogma.db"
    if bundle_dogma_db.exists():
        LOGGER.warning(f"Type dogma file '{bundle_dogma_db}' already exists. Overwriting.")
        bundle_dogma_db.unlink()

    with sqlite3.connect(bundle_dogma_db) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS type_dogma (
                type_id INTEGER NOT NULL UNIQUE PRIMARY KEY,
                dogma_data BLOB NOT NULL
            ) 
        """)

        for type_id, dogma_def in type_dogmas.items():
            try:
                validated = _TypeDogma(**dogma_def)
            except ValidationError as e:
                LOGGER.error(f"Validation error for type ID {type_id}: {e}")
                continue

            pb_obj = _pydantic_to_protobuf_type_dogma(validated)
            dogma_blob = pb_obj.SerializeToString()

            cursor.execute(
                "INSERT INTO type_dogma (type_id, dogma_data) VALUES (?, ?)",
                (int(type_id), dogma_blob),
            )

        conn.commit()

    LOGGER.info("Type dogma data collected successfully.")
