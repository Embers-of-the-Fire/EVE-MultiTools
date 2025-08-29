from __future__ import annotations

import shutil

from typing import TYPE_CHECKING

import aiohttp

from data.bundle_generate.async_config import SEMAPHORE
from data.bundle_generate.log import LOGGER


if TYPE_CHECKING:
    from pathlib import Path

    from data.bundle_generate.resources import ResourcePath
    from data.bundle_generate.resources import ResourceTree


async def download_and_copy_icon(
    index: ResourceTree, res_id: ResourcePath, target_path: Path, description: str
):
    if target_path.exists():
        LOGGER.debug(f"Icon already exists: {target_path}")
        return

    downloaded_file = await index.download_resource(res_id)
    shutil.copyfile(downloaded_file.file_path, target_path)
    LOGGER.info(f"Copied {description} icon to: {target_path}")


async def download_and_copy_image(image_url: str, target_path: Path, description: str):
    if target_path.exists():
        LOGGER.debug(f"Image already exists: {target_path}")
        return

    async with SEMAPHORE, aiohttp.ClientSession() as session, session.get(image_url) as response:
        if response.status != 200:
            LOGGER.error(
                f"Failed to download {description} from {image_url}: HTTP {response.status}"
            )
            return

        with open(target_path, "wb") as f:
            async for chunk in response.content.iter_chunked(8192):
                f.write(chunk)
