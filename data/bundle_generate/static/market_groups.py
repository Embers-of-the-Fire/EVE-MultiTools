from __future__ import annotations

import typing

from collections import defaultdict

from pydantic import BaseModel
from pydantic import Field
from pydantic import ValidationError

from data import schema_pb2
from data.bundle_generate.log import LOGGER
from data.bundle_generate.types import BoolInt  # noqa: TC001


if typing.TYPE_CHECKING:
    from pathlib import Path

    from data.bundle_generate.resources import Fsd


class _MarketGroup(BaseModel):
    nameID: int
    descriptionID: int | None = Field(default=None)
    iconID: int | None = Field(default=None)
    parentGroupID: int | None = Field(default=None)
    hasTypes: BoolInt


def collect_market_groups(fsd: Fsd, bundle_static: Path):
    market_groups = fsd.get_fsd("marketgroups")
    if market_groups is None:
        return

    market_group_collection = schema_pb2.MarketGroupCollection()
    to_export: defaultdict[
        int, dict[typing.Literal["model", "types", "groups"], _MarketGroup | list[int]]
    ] = defaultdict(dict)

    for market_group_id, market_group_def in market_groups.items():
        try:
            validated = _MarketGroup(**market_group_def)
        except ValidationError:
            LOGGER.error(f"Invalid market group definition for ID {market_group_id}")
            continue

        to_export[int(market_group_id)]["model"] = validated
        if validated.parentGroupID is not None:
            to_export[validated.parentGroupID].setdefault("groups", []).append(int(market_group_id))

    for type_id, type_def in fsd.get_fsd("types").items():
        if "marketGroupID" in type_def and type_def["marketGroupID"] is not None:
            to_export[type_def["marketGroupID"]].setdefault("types", []).append(int(type_id))

    for market_group_id, data in to_export.items():
        if "model" not in data:
            LOGGER.warning(f"Market group ID {market_group_id} referenced but not defined.")
            continue

        market_group_entry = market_group_collection.market_groups.add()
        market_group_entry.market_group_id = market_group_id
        market_group_entry.market_group_data.name_id = data["model"].nameID
        if data["model"].descriptionID is not None:
            market_group_entry.market_group_data.description_id = data["model"].descriptionID
        if data["model"].iconID is not None:
            market_group_entry.market_group_data.icon_id = data["model"].iconID
        if data["model"].parentGroupID is not None:
            market_group_entry.market_group_data.parent_group_id = data["model"].parentGroupID

        market_group_entry.market_group_data.types.extend(data.get("types", []))
        market_group_entry.market_group_data.groups.extend(data.get("groups", []))

    bundle_static_market_groups = bundle_static / "market_groups.pb"
    if bundle_static_market_groups.exists():
        LOGGER.warning(f"Overwriting existing file: {bundle_static_market_groups}")
        bundle_static_market_groups.unlink()

    with open(bundle_static_market_groups, "wb") as f:
        f.write(market_group_collection.SerializeToString())

    LOGGER.info(f"Exported {len(market_group_collection.market_groups)} market groups.")
