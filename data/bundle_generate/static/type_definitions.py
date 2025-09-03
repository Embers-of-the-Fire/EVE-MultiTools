from __future__ import annotations

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


class TypeID(BaseModel):
    """Type ID definition.

    This mirrors the structure of typeIDs.json in the FSD."""

    basePrice: float
    capacity: float
    certificateTemplate: int | None = Field(default=None)
    descriptionID: int | None = Field(default=None)
    designerIDs: list[int] = Field(default_factory=list)
    factionID: int | None = Field(default=None)
    graphicID: int | None = Field(default=None)
    groupID: int
    iconID: int | None = Field(default=None)
    isDynamicType: BoolInt = Field(default=False)
    isisGroupID: int | None = Field(default=None)
    marketGroupID: int | None = Field(default=None)
    metaGroupID: int | None = Field(default=None)
    metaLevel: int | None = Field(default=None)
    portionSize: int
    published: BoolInt
    quoteAuthorID: int | None = Field(default=None)
    quoteID: int | None = Field(default=None)
    raceID: int | None = Field(default=None)
    radius: float
    soundID: int | None = Field(default=None)
    techLevel: int | None = Field(default=None)
    typeID: int
    typeNameID: int
    variationParentTypeID: int | None = Field(default=None)
    volume: float
    wreckTypeID: int | None = Field(default=None)


def _pydantic_to_protobuf_type_id(pydantic_obj: TypeID, type_id: int) -> schema_pb2.TypeID:
    """Convert Pydantic TypeID to protobuf TypeID."""
    pb_obj = schema_pb2.TypeID()

    # Required fields
    pb_obj.base_price = pydantic_obj.basePrice
    pb_obj.capacity = pydantic_obj.capacity
    pb_obj.group_id = pydantic_obj.groupID
    pb_obj.portion_size = pydantic_obj.portionSize
    pb_obj.published = pydantic_obj.published
    pb_obj.radius = pydantic_obj.radius
    pb_obj.type_id = type_id
    pb_obj.type_name_id = pydantic_obj.typeNameID
    pb_obj.volume = pydantic_obj.volume
    pb_obj.is_dynamic_type = pydantic_obj.isDynamicType

    # Optional fields - only set if not None
    if pydantic_obj.certificateTemplate is not None:
        pb_obj.certificate_template = pydantic_obj.certificateTemplate
    if pydantic_obj.descriptionID is not None:
        pb_obj.description_id = pydantic_obj.descriptionID
    if pydantic_obj.designerIDs:
        pb_obj.designer_ids.extend(pydantic_obj.designerIDs)
    if pydantic_obj.factionID is not None:
        pb_obj.faction_id = pydantic_obj.factionID
    if pydantic_obj.graphicID is not None:
        pb_obj.graphic_id = pydantic_obj.graphicID
    if pydantic_obj.iconID is not None:
        pb_obj.icon_id = pydantic_obj.iconID
    if pydantic_obj.isisGroupID is not None:
        pb_obj.isis_group_id = pydantic_obj.isisGroupID
    if pydantic_obj.marketGroupID is not None:
        pb_obj.market_group_id = pydantic_obj.marketGroupID
    if pydantic_obj.metaGroupID is not None:
        pb_obj.meta_group_id = pydantic_obj.metaGroupID
    if pydantic_obj.metaLevel is not None:
        pb_obj.meta_level = pydantic_obj.metaLevel
    if pydantic_obj.quoteAuthorID is not None:
        pb_obj.quote_author_id = pydantic_obj.quoteAuthorID
    if pydantic_obj.quoteID is not None:
        pb_obj.quote_id = pydantic_obj.quoteID
    if pydantic_obj.raceID is not None:
        pb_obj.race_id = pydantic_obj.raceID
    if pydantic_obj.soundID is not None:
        pb_obj.sound_id = pydantic_obj.soundID
    if pydantic_obj.techLevel is not None:
        pb_obj.tech_level = pydantic_obj.techLevel
    if pydantic_obj.variationParentTypeID is not None:
        pb_obj.variation_parent_type_id = pydantic_obj.variationParentTypeID
    if pydantic_obj.wreckTypeID is not None:
        pb_obj.wreck_type_id = pydantic_obj.wreckTypeID

    return pb_obj


def collect_type_definitions(fsd: Fsd, bundle_static: Path, loc_root: Path):
    types = fsd.get_fsd("types")
    if types is None:
        return
    type_collection = schema_pb2.TypeCollection()
    type_loc_lookup = schema_pb2.TypeLocalizationLookup()

    for type_id, type_def in types.items():
        try:
            validated = TypeID(**type_def)
        except ValidationError as e:
            LOGGER.error(f"Validation error for typeID {type_id}: {e}")

        type_entry = type_collection.types.add()
        type_entry.type_id = int(type_id)
        type_entry.type_data.CopyFrom(_pydantic_to_protobuf_type_id(validated, int(type_id)))

        loc_entry = type_loc_lookup.type_entries.add()
        loc_entry.type_id = int(type_id)
        loc_entry.type_name_id = validated.typeNameID
        if validated.descriptionID is not None:
            loc_entry.type_description_id = validated.descriptionID

    bundle_static_types = bundle_static / "types.pb"
    if bundle_static_types.exists():
        LOGGER.warning(
            f"Type definitions file '{bundle_static_types}' already exists, overwriting."
        )
        bundle_static_types.unlink()

    with open(bundle_static_types, "wb+") as f:
        f.write(type_collection.SerializeToString())
    LOGGER.info(f"Wrote {len(type_collection.types)} type definitions to '{bundle_static_types}'.")

    bundle_type_loc_lookup = loc_root / "type_localization_lookup.pb"
    if bundle_type_loc_lookup.exists():
        LOGGER.warning(
            f"Type localization lookup file '{bundle_type_loc_lookup}' already exists. Overwriting."
        )
        bundle_type_loc_lookup.unlink()
    with open(bundle_type_loc_lookup, "wb+") as f:
        f.write(type_loc_lookup.SerializeToString())
