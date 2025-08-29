from __future__ import annotations

import pickle

from typing import TYPE_CHECKING

from data import schema_pb2
from data.bundle_generate.consts import LOC_EN_RES
from data.bundle_generate.consts import LOC_ZH_RES
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

        en = await self.__index.download_resource(LOC_EN_RES)
        if not en:
            LOGGER.warning(f"Localization resource '{LOC_EN_RES}' not found.")
            return

        zh = await self.__index.download_resource(LOC_ZH_RES)
        if not zh:
            LOGGER.warning(f"Localization resource '{LOC_ZH_RES}' not found.")
            return

        try:
            with open(en.file_path, "rb") as f:
                _, en_data = pickle.load(f)
        except Exception as e:
            LOGGER.error(f"Failed to load English localization data: {e}")
            return

        try:
            with open(zh.file_path, "rb") as f:
                _, zh_data = pickle.load(f)
        except Exception as e:
            LOGGER.error(f"Failed to load Chinese localization data: {e}")
            return

        localization_collection = schema_pb2.LocalizationCollection()
        for key in en_data:
            en_text = en_data[key][0]
            zh_text = zh_data.get(key, [""])[0]

            loc_entry = localization_collection.localizations.add()
            loc_entry.key = key
            loc_entry.localization_data.en = en_text
            loc_entry.localization_data.zh = zh_text

        bundle_loc_pb = self.__root / "localizations.pb"
        if bundle_loc_pb.exists():
            LOGGER.warning(f"Localization pb file '{bundle_loc_pb}' already exists, overwriting.")
            bundle_loc_pb.unlink()

        with open(bundle_loc_pb, "wb+") as f:
            f.write(localization_collection.SerializeToString())

        LOGGER.info("Created localization protobuf file.")
