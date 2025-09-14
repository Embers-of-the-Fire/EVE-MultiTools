from __future__ import annotations

import pickle

from typing import TYPE_CHECKING

from data import schema_pb2
from data.bundle_generate.consts import LOC_MAIN_RES
from data.bundle_generate.log import LOGGER


if TYPE_CHECKING:
    from pathlib import Path

    from data.bundle_generate.resources import ResourceTree


async def load_localization(index: ResourceTree, localization_root: Path):
    LOGGER.info("Loading main localization files...")

    main = await index.download_resource(LOC_MAIN_RES)
    if not main:
        LOGGER.warning(f"Localization resource '{LOC_MAIN_RES}' not found.")
        return

    try:
        with open(main.file_path, "rb") as f:
            main_data = pickle.load(f)
    except Exception as e:
        LOGGER.error(f"Failed to load main localization data: {e}")
        return

    meta_loc = schema_pb2.MetaUiLocalizationCollection()
    for definition in main_data["labels"].values():
        entry = meta_loc.meta_ui_entries.add()
        entry.key = definition["FullPath"] + "/" + definition["label"]
        entry.message_id = definition["messageID"]

    bundle_meta_loc_pb = localization_root / "meta_ui_localizations.pb"
    if bundle_meta_loc_pb.exists():
        LOGGER.warning(
            f"Meta UI localization pb file '{bundle_meta_loc_pb}' already exists, overwriting."
        )
        bundle_meta_loc_pb.unlink()

    with open(bundle_meta_loc_pb, "wb+") as f:
        f.write(meta_loc.SerializeToString())

    LOGGER.info("Main localization files loaded.")
