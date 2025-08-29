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


class _Category(BaseModel):
    """Category definition.

    This mirrors the structure of categories.json in the FSD."""

    categoryID: int
    categoryNameID: int
    iconID: int | None = Field(default=None)
    published: BoolInt = Field(default=False)


def _pydantic_to_protobuf_category(pydantic_obj: _Category) -> schema_pb2.Category:
    pb_obj = schema_pb2.Category()
    pb_obj.category_id = pydantic_obj.categoryID
    pb_obj.category_name_id = pydantic_obj.categoryNameID
    pb_obj.published = pydantic_obj.published
    if pydantic_obj.iconID is not None:
        pb_obj.icon_id = pydantic_obj.iconID
    return pb_obj


def collect_categories(fsd: Fsd, bundle_static: Path):
    categories = fsd.get_fsd("categories")
    if categories is None:
        return

    category_collection = schema_pb2.CategoryCollection()
    for category_id, category_def in categories.items():
        try:
            validated = _Category(**category_def)
        except ValidationError:
            LOGGER.error(f"Invalid category definition for ID {category_id}: {category_def}")
            continue

        category_entry = category_collection.categories.add()
        category_entry.category_id = int(category_id)
        category_entry.category_data.CopyFrom(_pydantic_to_protobuf_category(validated))

    bundle_static_categories = bundle_static / "categories.pb"
    if bundle_static_categories.exists():
        LOGGER.warning(f"Categories file '{bundle_static_categories}' already exists. Overwriting.")
        bundle_static_categories.unlink()

    with open(bundle_static_categories, "wb") as f:
        f.write(category_collection.SerializeToString())

    LOGGER.info(
        f"Wrote {len(category_collection.categories)} categories to '{bundle_static_categories}'"
    )
