from __future__ import annotations

import asyncio

from typing import TYPE_CHECKING

from data.bundle_generate.image.utils import download_and_copy_icon
from data.bundle_generate.log import LOGGER


if TYPE_CHECKING:
    from pathlib import Path

    from data.bundle_generate.resources import Fsd
    from data.bundle_generate.resources import ResourceTree


async def collect_icons(bundle_image_path: Path, fsd: Fsd, index: ResourceTree):
    """Collect icon resources into the bundle image directory."""

    LOGGER.info("Collecting icon resources...")

    bundle_icons = bundle_image_path / "icons"
    bundle_icons.mkdir(parents=True, exist_ok=True)

    icon_ids = fsd.get_fsd("iconids")
    if not icon_ids:
        return

    download_tasks = []

    for icon_id, icon_data in icon_ids.items():
        icon_id = int(icon_id)
        if not isinstance(icon_data, dict):
            LOGGER.warning(f"Invalid icon data for ID {icon_id}: {icon_data}")
            continue
        icon_file = icon_data.get("iconFile", "").lower()
        if not icon_file:
            LOGGER.warning(f"No icon file for icon ID {icon_id}")
            continue
        icon = index.get_resource(icon_file)
        if icon is None:
            LOGGER.warning(f"Icon file '{icon_file}' not found for icon ID {icon_id}")
            continue
        target_path = bundle_icons / f"{icon_id}.png"
        download_tasks.append(download_and_copy_icon(index, icon.res_id, target_path, f"Icon {icon_id}"))

    if download_tasks:
        await asyncio.gather(*download_tasks)
