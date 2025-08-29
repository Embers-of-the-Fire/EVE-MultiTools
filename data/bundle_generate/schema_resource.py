from __future__ import annotations

from typing import TYPE_CHECKING

import yaml

from data import schema_loader
from data.bundle_generate.log import LOGGER


if TYPE_CHECKING:
    from data.bundle_generate.resources import ResourcePath
    from data.bundle_generate.resources import ResourceTree


async def get_schema_resource[T = dict](
    index: ResourceTree, schema_res: ResourcePath, bin_res: ResourcePath
) -> T | None:
    schema = index.get_resource(schema_res)
    if schema is None:
        LOGGER.error(f"Schema resource '{schema_res}' not found in index.")
        return None

    bin_data = index.get_resource(bin_res)
    if bin_data is None:
        LOGGER.error(f"Binary resource '{bin_res}' not found in index.")
        return None

    await index.download_resource(schema_res)
    await index.download_resource(bin_res)

    with open(schema.file_path, "r", encoding="utf-8") as f:
        schema_dict = yaml.load(f, yaml.CFullLoader)

    with open(bin_data.file_path, "rb") as f:
        bin_bytes = f.read()

    out_loader = schema_loader.binaryLoader.LoadFromString(bin_bytes, schema_dict)
    result: T = schema_loader.convert.convert_to_serializable(out_loader)

    return result
