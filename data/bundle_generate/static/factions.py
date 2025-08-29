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


class _Faction(BaseModel):
    nameID: int
    descriptionID: int
    shortDescriptionID: int | None = Field(default=None)
    corporationID: int | None = Field(default=None)
    iconID: int
    memberRaces: list[int] = Field(default_factory=list)
    uniqueName: BoolInt = Field(default=False)
    flatLogo: str | None = Field(default=None)
    flatLogoWithName: str | None = Field(default=None)
    solarSystemID: int
    militiaCorporationID: int | None = Field(default=None)
    sizeFactor: float


def _pydantic_to_protobuf_faction(pydantic_obj: _Faction) -> schema_pb2.Faction:
    pb_obj = schema_pb2.Faction()
    pb_obj.name_id = pydantic_obj.nameID
    pb_obj.description_id = pydantic_obj.descriptionID
    if pydantic_obj.shortDescriptionID is not None:
        pb_obj.short_description_id = pydantic_obj.shortDescriptionID
    if pydantic_obj.corporationID is not None:
        pb_obj.corporation_id = pydantic_obj.corporationID
    pb_obj.icon_id = pydantic_obj.iconID
    pb_obj.unique_name = pydantic_obj.uniqueName
    if pydantic_obj.flatLogo is not None:
        pb_obj.flat_logo = pydantic_obj.flatLogo
    if pydantic_obj.flatLogoWithName is not None:
        pb_obj.flat_logo_with_name = pydantic_obj.flatLogoWithName
    pb_obj.solar_system_id = pydantic_obj.solarSystemID
    if pydantic_obj.militiaCorporationID is not None:
        pb_obj.militia_corporation_id = pydantic_obj.militiaCorporationID
    pb_obj.size_factor = pydantic_obj.sizeFactor
    pb_obj.member_races.extend(pydantic_obj.memberRaces)
    return pb_obj


def collect_factions(fsd: Fsd, bundle_static: Path):
    factions = fsd.get_fsd("factions")
    if factions is None:
        return

    faction_collection = schema_pb2.FactionCollection()
    for faction_id, faction_def in factions.items():
        try:
            validated = _Faction(**faction_def)
        except ValidationError:
            LOGGER.error(f"Invalid faction definition for ID {faction_id}: {faction_def}")
            continue

        faction_entry = faction_collection.factions.add()
        faction_entry.faction_id = int(faction_id)
        faction_entry.faction_data.CopyFrom(_pydantic_to_protobuf_faction(validated))

    bundle_static_factions = bundle_static / "factions.pb"
    if bundle_static_factions.exists():
        LOGGER.warning(f"Factions file '{bundle_static_factions}' already exists. Overwriting.")
        bundle_static_factions.unlink()

    with open(bundle_static_factions, "wb") as f:
        f.write(faction_collection.SerializeToString())
