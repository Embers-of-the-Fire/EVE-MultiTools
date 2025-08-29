from __future__ import annotations

import asyncio

from typing import TYPE_CHECKING

from data.bundle_generate.image.utils import download_and_copy_icon
from data.bundle_generate.log import LOGGER


if TYPE_CHECKING:
    from pathlib import Path

    from data.bundle_generate.resources import Fsd
    from data.bundle_generate.resources import ResourceTree


async def collect_graphics(bundle_image_path: Path, fsd: Fsd, index: ResourceTree):
    """Collect graphics resources into the bundle image directory."""

    LOGGER.info("Collecting graphics resources...")

    bundle_graphics = bundle_image_path / "graphics"
    bundle_graphics.mkdir(parents=True, exist_ok=True)

    graphic_ids = fsd.get_fsd("graphicids")
    if not graphic_ids:
        return

    download_tasks = []

    for graphic_id, graphic_data in graphic_ids.items():
        graphic_id = int(graphic_id)

        if not isinstance(graphic_data, dict):
            LOGGER.warning(f"Invalid graphic data for ID {graphic_id}: {graphic_data}")
            continue

        icon_folder = graphic_data.get("iconInfo", {}).get("folder")
        if not icon_folder:
            LOGGER.warning(f"No icon folder for graphic ID {graphic_id}")
            continue

        icons = index.get_resources(icon_folder)
        if icons is None:
            LOGGER.warning(f"No icons found for graphic ID {graphic_id} in folder '{icon_folder}'")
            continue
        found = False
        for icon in icons:
            if f"{graphic_id}_" not in icon.file_name:
                continue
            if "_64" not in icon.file_name:
                continue
            if "t2" in icon.file_name or "t3" in icon.file_name or "faction" in icon.file_name:
                continue

            found = True

            if "bpc" in icon.file_name:
                task = download_and_copy_icon(
                    index,
                    icon.res_id,
                    bundle_graphics / f"{graphic_id}_bpc.png",
                    f"Graphic {graphic_id} BPC",
                )
            elif "bp" in icon.file_name:
                task = download_and_copy_icon(
                    index,
                    icon.res_id,
                    bundle_graphics / f"{graphic_id}_bp.png",
                    f"Graphic {graphic_id} BP",
                )
            else:
                task = download_and_copy_icon(
                    index,
                    icon.res_id,
                    bundle_graphics / f"{graphic_id}.png",
                    f"Graphic {graphic_id}",
                )
            download_tasks.append(task)

        if not found:
            LOGGER.warning(
                f"No suitable icon found for graphic ID {graphic_id} in folder '{icon_folder}'"
            )

    if download_tasks:
        await asyncio.gather(*download_tasks)
