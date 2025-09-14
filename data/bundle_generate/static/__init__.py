from __future__ import annotations

from typing import TYPE_CHECKING

from data.bundle_generate.log import LOGGER
from data.bundle_generate.static import categories
from data.bundle_generate.static import factions
from data.bundle_generate.static import groups
from data.bundle_generate.static import market_groups
from data.bundle_generate.static import meta_groups
from data.bundle_generate.static import npc_corporations
from data.bundle_generate.static import skin_infos
from data.bundle_generate.static import type_definitions
from data.bundle_generate.static import type_dogma
from data.bundle_generate.static import type_materials


if TYPE_CHECKING:
    from pathlib import Path

    from data.bundle_generate import Metadata
    from data.bundle_generate.resources import Fsd
    from data.bundle_generate.resources import ResourceTree


class StaticDataGenerator:
    __root: Path
    __loc_root: Path
    __fsd: Fsd
    __index: ResourceTree
    __metadata: Metadata

    def __init__(self, bundle_root: Path, fsd: Fsd, index: ResourceTree, metadata: Metadata):
        self.__root = bundle_root / "static"
        self.__loc_root = bundle_root / "localizations"
        self.__fsd = fsd
        self.__index = index
        self.__metadata = metadata

        self.__root.mkdir(parents=True, exist_ok=True)

    async def load(self):
        LOGGER.info("Loading static data...")

        type_definitions.collect_type_definitions(self.__fsd, self.__root, self.__loc_root)
        type_dogma.collect_type_dogma(self.__fsd, self.__root)
        type_materials.collect_type_materials(self.__fsd, self.__root)
        categories.collect_categories(self.__fsd, self.__root)
        groups.collect_groups(self.__fsd, self.__root)
        meta_groups.collect_meta_groups(self.__fsd, self.__root)
        factions.collect_factions(self.__fsd, self.__root)
        market_groups.collect_market_groups(self.__fsd, self.__root)
        npc_corporations.collect_npc_corporations(self.__fsd, self.__root, self.__loc_root)

        await skin_infos.collect_skin_infos(self.__fsd, self.__index, self.__root)

        LOGGER.info("Static data loaded successfully.")
