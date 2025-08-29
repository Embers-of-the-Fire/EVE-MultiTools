from __future__ import annotations

import asyncio

from typing import TYPE_CHECKING

from data.bundle_generate import Metadata
from data.bundle_generate.consts import FACTION_FLAT_LOGO_RES_PAT
from data.bundle_generate.image.utils import download_and_copy_icon
from data.bundle_generate.image.utils import download_and_copy_image
from data.bundle_generate.log import LOGGER


if TYPE_CHECKING:
    from pathlib import Path

    from data.bundle_generate.resources import Fsd
    from data.bundle_generate.resources import ResourceTree


async def collect_faction_icons(
    bundle_image_path: Path, fsd: Fsd, index: ResourceTree, metadata: Metadata
):
    """Collect faction icon resources into the bundle image directory."""

    LOGGER.info("Collecting faction icon resources...")

    bundle_faction = bundle_image_path / "factions"
    bundle_faction.mkdir(parents=True, exist_ok=True)

    bundle_faction_logos = bundle_faction / "logos"
    bundle_faction_logos.mkdir(parents=True, exist_ok=True)
    bundle_faction_icons = bundle_faction / "icons"
    bundle_faction_icons.mkdir(parents=True, exist_ok=True)

    faction_ids = fsd.get_fsd("factionids")
    if not faction_ids:
        return

    download_tasks = []

    for faction_id, faction_data in faction_ids.items():
        faction_id = int(faction_id)

        if not isinstance(faction_data, dict):
            LOGGER.warning(f"Invalid faction data for ID {faction_id}: {faction_data}")
            continue

        flat_logo = faction_data.get("flatLogo")
        if flat_logo:
            flat_logo_res = FACTION_FLAT_LOGO_RES_PAT.format(flat_logo=flat_logo)
            icon = index.get_resource(flat_logo_res)
            if icon is None:
                LOGGER.warning(
                    f"Faction flat logo resource '{flat_logo_res}' not found for faction ID {faction_id}"
                )
            else:
                target_path = bundle_faction_logos / f"{flat_logo}.png"
                task = download_and_copy_icon(index,
                    icon.res_id, target_path, f"Faction {faction_id} flat logo {flat_logo}"
                )
                download_tasks.append(task)
        else:
            LOGGER.warning(f"No flat logo for faction ID {faction_id}")

        flat_logo_with_name = faction_data.get("flatLogoWithName")
        if flat_logo_with_name:
            flat_logo_with_name_res = FACTION_FLAT_LOGO_RES_PAT.format(
                flat_logo=flat_logo_with_name
            )
            icon = index.get_resource(flat_logo_with_name_res)
            if icon is None:
                LOGGER.warning(
                    f"Faction flat logo with name resource '{flat_logo_with_name_res}' not found for faction ID {faction_id}"
                )
            else:
                target_path = bundle_faction_logos / f"{flat_logo_with_name}.png"
                task = download_and_copy_icon(
                    index,
                    icon.res_id,
                    target_path,
                    f"Faction {faction_id} flat logo with name {flat_logo_with_name}",
                )
                download_tasks.append(task)
        else:
            LOGGER.warning(f"No flat logo with name for faction ID {faction_id}")

        image_url = metadata.get_image_service(Metadata.ImageServiceType.NPC_FACTION).format(
            faction_id=faction_id
        )
        target_path = bundle_faction_icons / f"{faction_id}.png"
        task = download_and_copy_image(image_url, target_path, f"Faction {faction_id} icon")
        download_tasks.append(task)

    if download_tasks:
        await asyncio.gather(*download_tasks)
    LOGGER.info("Faction icon resources collection complete.")
