from __future__ import annotations

from typing import TYPE_CHECKING

from data.bundle_generate.localization import fsd
from data.bundle_generate.localization import meta_ui
from data.bundle_generate.log import LOGGER


if TYPE_CHECKING:
    from pathlib import Path

    from data.bundle_generate import Metadata
    from data.bundle_generate.resources import Fsd
    from data.bundle_generate.resources import ResourceTree


class LocalizationGenerator:
    __root: Path
    __fsd: Fsd
    __index: ResourceTree
    __metadata: Metadata

    def __init__(
        self, bundle_root: Path, fsd: Fsd, index: ResourceTree, metadata: Metadata
    ) -> None:
        self.__root = bundle_root / "localizations"
        self.__fsd = fsd
        self.__index = index
        self.__metadata = metadata

        self.__root.mkdir(parents=True, exist_ok=True)

    async def load(self):
        LOGGER.info("Generating localization files...")

        await fsd.load_localization(self.__index, self.__root)
        await meta_ui.load_localization(self.__index, self.__root)

        LOGGER.info("Generated localization.")
