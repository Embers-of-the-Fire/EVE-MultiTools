from __future__ import annotations

from typing import TYPE_CHECKING

from data.bundle_generate.universe import constellations
from data.bundle_generate.universe import regions
from data.bundle_generate.universe import system_contents
from data.bundle_generate.universe import systems


if TYPE_CHECKING:
    from pathlib import Path

    from data.bundle_generate import Metadata
    from data.bundle_generate.resources import Fsd
    from data.bundle_generate.resources import ResourceTree


class UniverseGenerator:
    __root: Path
    __loc_root: Path
    __fsd: Fsd
    __index: ResourceTree
    __metadata: Metadata

    def __init__(self, bundle_root: Path, fsd: Fsd, index: ResourceTree, metadata: Metadata):
        self.__root = bundle_root / "universe"
        self.__loc_root = bundle_root / "localizations"
        self.__fsd = fsd
        self.__index = index
        self.__metadata = metadata

        self.__root.mkdir(parents=True, exist_ok=True)

    async def load(self):
        await regions.collect_regions(self.__index, self.__root, self.__loc_root)
        await constellations.collect_constellations(self.__index, self.__root, self.__loc_root)
        await systems.collect_systems(self.__index, self.__root, self.__loc_root)
        await system_contents.collect_system_contents(self.__index, self.__root, self.__loc_root)
