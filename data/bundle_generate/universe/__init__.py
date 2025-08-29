from __future__ import annotations

from typing import TYPE_CHECKING

from data.bundle_generate.universe import regions


if TYPE_CHECKING:
    from pathlib import Path

    from data.bundle_generate import Metadata
    from data.bundle_generate.resources import Fsd
    from data.bundle_generate.resources import ResourceTree




class UniverseGenerator:
    __root: Path
    __fsd: Fsd
    __index: ResourceTree
    __metadata: Metadata

    def __init__(self, bundle_root: Path, fsd: Fsd, index: ResourceTree, metadata: Metadata):
        self.__root = bundle_root / "universe"
        self.__fsd = fsd
        self.__index = index
        self.__metadata = metadata

        self.__root.mkdir(parents=True, exist_ok=True)

    async def load(self):
        await regions.collect_regions(self.__index, self.__root)
