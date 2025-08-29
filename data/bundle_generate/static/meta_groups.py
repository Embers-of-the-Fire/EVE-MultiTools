from __future__ import annotations

from typing import TYPE_CHECKING

from pydantic import BaseModel
from pydantic import Field
from pydantic import ValidationError

from data import schema_pb2
from data.bundle_generate.log import LOGGER


if TYPE_CHECKING:
    from pathlib import Path

    from data.bundle_generate.resources import Fsd


class _MetaGroup(BaseModel):
    nameID: int
    iconID: int | None = Field(default=None)


def _pydantic_to_protobuf_meta_group(pydantic_obj: _MetaGroup) -> schema_pb2.MetaGroup:
    pb_obj = schema_pb2.MetaGroup()
    pb_obj.name_id = pydantic_obj.nameID
    if pydantic_obj.iconID is not None:
        pb_obj.icon_id = pydantic_obj.iconID
    return pb_obj


def collect_meta_groups(fsd: Fsd, bundle_static: Path):
    meta_groups = fsd.get_fsd("metagroups")
    if meta_groups is None:
        return

    meta_group_collection = schema_pb2.MetaGroupCollection()
    for meta_group_id, meta_group_def in meta_groups.items():
        try:
            validated = _MetaGroup(**meta_group_def)
        except ValidationError:
            LOGGER.error(f"Invalid meta group definition for ID {meta_group_id}: {meta_group_def}")
            continue

        meta_group_entry = meta_group_collection.meta_groups.add()
        meta_group_entry.meta_group_id = int(meta_group_id)
        meta_group_entry.meta_group_data.CopyFrom(_pydantic_to_protobuf_meta_group(validated))

    bundle_static_meta_groups = bundle_static / "meta_groups.pb"
    if bundle_static_meta_groups.exists():
        LOGGER.warning(
            f"Meta groups file '{bundle_static_meta_groups}' already exists. Overwriting."
        )
        bundle_static_meta_groups.unlink()

    with open(bundle_static_meta_groups, "wb") as f:
        f.write(meta_group_collection.SerializeToString())
