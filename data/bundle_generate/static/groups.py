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


class _Group(BaseModel):
    """Group definition.

    This mirrors the structure of groups.json in the FSD."""

    anchorable: BoolInt = Field(default=False)
    fittableNonSingleton: BoolInt = Field(default=False)
    iconID: int | None = None
    groupNameID: int
    groupID: int
    anchored: BoolInt = Field(default=False)
    published: BoolInt = Field(default=False)
    useBasePrice: BoolInt = Field(default=False)
    categoryID: int


def _pydantic_to_protobuf_group(pydantic_obj: _Group) -> schema_pb2.Group:
    pb_obj = schema_pb2.Group()
    pb_obj.group_id = pydantic_obj.groupID
    pb_obj.group_name_id = pydantic_obj.groupNameID
    if pydantic_obj.iconID is not None:
        pb_obj.icon_id = pydantic_obj.iconID
    pb_obj.category_id = pydantic_obj.categoryID
    pb_obj.anchorable = pydantic_obj.anchorable
    pb_obj.fittable_non_singleton = pydantic_obj.fittableNonSingleton
    pb_obj.anchored = pydantic_obj.anchored
    pb_obj.published = pydantic_obj.published
    pb_obj.use_base_price = pydantic_obj.useBasePrice
    return pb_obj


def collect_groups(fsd: Fsd, bundle_static: Path):
    groups = fsd.get_fsd("groups")
    if groups is None:
        return

    group_collection = schema_pb2.GroupCollection()
    for group_id, group_def in groups.items():
        try:
            validated = _Group(**group_def)
        except ValidationError:
            LOGGER.error(f"Invalid group definition for ID {group_id}: {group_def}")
            continue

        group_entry = group_collection.groups.add()
        group_entry.group_id = int(group_id)
        group_entry.group_data.CopyFrom(_pydantic_to_protobuf_group(validated))

    bundle_static_groups = bundle_static / "groups.pb"
    if bundle_static_groups.exists():
        LOGGER.warning(f"Groups file '{bundle_static_groups}' already exists. Overwriting.")
        bundle_static_groups.unlink()

    with open(bundle_static_groups, "wb") as f:
        f.write(group_collection.SerializeToString())

    LOGGER.info(f"Collected {len(group_collection.groups)} groups into '{bundle_static_groups}'.")
