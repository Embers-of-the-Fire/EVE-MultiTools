from __future__ import annotations

import asyncio

from typing import TYPE_CHECKING

from data.bundle_generate.consts import SKIN_ICONS_RES
from data.bundle_generate.image.utils import download_and_copy_icon
from data.bundle_generate.log import LOGGER


if TYPE_CHECKING:
    from pathlib import Path

    from data.bundle_generate.resources import Fsd
    from data.bundle_generate.resources import ResourceTree


async def collect_skin_material_icons(bundle_image_path: Path, fsd: Fsd, index: ResourceTree):
    """Collect skin material icon resources into the bundle image directory."""

    LOGGER.info("Collecting skin material icon resources...")

    bundle_skin_materials = bundle_image_path / "skins" / "materials"
    bundle_skin_materials.mkdir(parents=True, exist_ok=True)

    skin_materials = index.get_resources(SKIN_ICONS_RES)
    if not skin_materials:
        LOGGER.error("No skin material icons found.")
        return

    download_tasks = []

    for skin_material in skin_materials:
        if not skin_material.file_name.endswith(".png"):
            continue
        target_path = bundle_skin_materials / skin_material.file_name
        download_tasks.append(
            download_and_copy_icon(
                index, skin_material.res_id, target_path, f"Skin Material {skin_material.file_name}"
            )
        )

    if download_tasks:
        await asyncio.gather(*download_tasks)
