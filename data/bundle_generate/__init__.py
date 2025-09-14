from __future__ import annotations

import configparser
import csv
import datetime
import json
import shutil
import typing
import zipfile

from dataclasses import dataclass
from enum import StrEnum
from enum import unique
from typing import TYPE_CHECKING
from typing import Literal


if TYPE_CHECKING:
    from pathlib import Path

    from data.bundle_generate.resources import FormatterFunc


type GeneratorType = Literal["image", "localization", "static", "universe"]


@dataclass
class Metadata:
    server: str
    resource_service: str
    image_service: dict[str, str]
    server_name: dict[Literal["en", "zh"], str]

    @unique
    class ImageServiceType(StrEnum):
        NPC_FACTION = "npc-faction"

    def get_image_service(self, service_type: ImageServiceType) -> str | None:
        return self.image_service.get(service_type.value)


class MetadataConfig:
    __metadata_path: Path
    metadata: Metadata

    def __init__(self, workspace_root: Path):
        self.__metadata_path = workspace_root / "metadata.json"
        if not self.__metadata_path.exists():
            LOGGER.critical(f"Metadata file '{self.__metadata_path}' does not exist.")
            raise FileNotFoundError(f"Metadata file '{self.__metadata_path}' does not exist.")

        try:
            with open(self.__metadata_path, "r", encoding="utf-8") as f:
                metadata_dict = json.load(f)
                self.metadata = Metadata(
                    server=metadata_dict["server"],
                    resource_service=metadata_dict["resource-service"],
                    image_service=metadata_dict["image-service"],
                    server_name=metadata_dict["server-name"],
                )
        except Exception as e:
            LOGGER.critical(f"Failed to load metadata file '{self.__metadata_path}': {e}")
            raise

        LOGGER.info(f"Loaded metadata from '{self.__metadata_path}'.")


@dataclass
class StartCfg:
    version: str
    build: int


class StartConfig:
    __config_path: Path
    config: StartCfg

    def __init__(self, workspace_root: Path):
        self.__config_path = workspace_root / "start.ini"
        if not self.__config_path.exists():
            LOGGER.critical(f"Start config file '{self.__config_path}' does not exist.")
            raise FileNotFoundError(f"Start config file '{self.__config_path}' does not exist.")

        try:
            start_cfg = configparser.ConfigParser()
            start_cfg.read(self.__config_path, encoding="utf-8")
        except Exception as e:
            LOGGER.critical(f"Failed to load start config file '{self.__config_path}': {e}")
            raise

        self.config = StartCfg(
            version=start_cfg.get("main", "version"),
            build=start_cfg.getint("main", "build"),
        )

        LOGGER.info(f"Loaded start config from '{self.__config_path}'.")


class EsiConfig:
    __config_path: Path
    config: dict[str, dict]

    def __init__(self, workspace_root: Path):
        self.__config_path = workspace_root / "esi.json"
        if not self.__config_path.exists():
            self.config = {}
            LOGGER.critical(f"ESI config file '{self.__config_path}' does not exist.")
            return

        try:
            with open(self.__config_path, "r", encoding="utf-8") as f:
                self.config = json.load(f)
        except Exception as e:
            LOGGER.critical(f"Failed to load ESI config file '{self.__config_path}': {e}")
            self.config = {}

        if BUNDLE_ESI_KEY_LIST.exists():
            try:
                with open(BUNDLE_ESI_KEY_LIST, "r", encoding="utf-8") as f:
                    key_list = json.load(f)
            except Exception as e:
                LOGGER.critical(f"Failed to load ESI key list file '{BUNDLE_ESI_KEY_LIST}': {e}")
            for key in key_list:
                if key not in self.config:
                    LOGGER.error(
                        f"ESI key '{key}' not found in config. Please check the config file."
                    )
                    return
            LOGGER.info("ESI key list validated successfully.")
        else:
            LOGGER.warning(f"ESI key list file '{BUNDLE_ESI_KEY_LIST}' does not exist.")


class LinkConfig:
    __config_path: Path
    config: dict[str, str]

    def __init__(self, workspace_root: Path):
        self.__config_path = workspace_root / "links.json"
        if not self.__config_path.exists():
            self.config = {}
            LOGGER.critical(f"Links config file '{self.__config_path}' does not exist.")
            return

        try:
            with open(self.__config_path, "r", encoding="utf-8") as f:
                self.config = json.load(f)
        except Exception as e:
            LOGGER.critical(f"Failed to load links config file '{self.__config_path}': {e}")
            self.config = {}

        if BUNDLE_LINKS_LIST.exists():
            try:
                with open(BUNDLE_LINKS_LIST, "r", encoding="utf-8") as f:
                    link_list = json.load(f)
            except Exception as e:
                LOGGER.critical(f"Failed to load links list file '{BUNDLE_LINKS_LIST}': {e}")
            for link in link_list:
                if link not in self.config:
                    LOGGER.error(
                        f"Link '{link}' not found in config. Please check the config file."
                    )
                    return
            LOGGER.info("Links list validated successfully.")
        else:
            LOGGER.warning(f"Links list file '{BUNDLE_LINKS_LIST}' does not exist.")


class BundleGenerator:
    workspace_root: Path
    bundle_root: Path

    __metadata: MetadataConfig
    __start_config: StartConfig
    __esi_config: EsiConfig
    __link_config: LinkConfig

    __bundle_cache: Path

    __fsd: Fsd
    __res_file_index: ResourceTree

    __app_url_formatter: FormatterFunc
    __resource_url_formatter: FormatterFunc

    __bundle_root: Path

    def __init__(self, workspace_root: Path):
        self.workspace_root = workspace_root

        self.__metadata = MetadataConfig(workspace_root)
        self.__start_config = StartConfig(workspace_root)
        self.__esi_config = EsiConfig(workspace_root)
        self.__link_config = LinkConfig(workspace_root)

        resource_url = self.__metadata.metadata.resource_service

        def _gen_url(ty: typing.Literal["resources", "binaries"]) -> FormatterFunc:
            def _formatter(path: str) -> str:
                return resource_url.format(type=ty, url=path)

            return _formatter

        self.__app_url_formatter = _gen_url("binaries")
        self.__resource_url_formatter = _gen_url("resources")

        self.__bundle_cache = BUNDLE_CACHE_ROOT / self.server_id
        self.__bundle_cache.mkdir(parents=True, exist_ok=True)

        self._load_resources()

        self.bundle_root = self.__bundle_cache / "bundle"
        self.bundle_root.mkdir(parents=True, exist_ok=True)

    @property
    def server_id(self) -> str:
        return self.__metadata.metadata.server

    def clean_bundles(self):
        bundle_file = BUNDLE_OUTPUT_ROOT / f"{self.server_id}.bundle"
        if bundle_file.exists():
            bundle_file.unlink()
            LOGGER.info(f"Removed existing bundle file '{bundle_file}'.")
        else:
            LOGGER.info(f"No existing bundle file '{bundle_file}' to remove.")

    def clean_all_cache(self):
        if self.__bundle_cache.exists():
            shutil.rmtree(self.__bundle_cache)
            LOGGER.info(f"Removed existing bundle full cache directory '{self.__bundle_cache}'.")
        else:
            LOGGER.info(
                f"No existing bundle full cache directory '{self.__bundle_cache}' to remove."
            )

    def clean_bundle_cache(self):
        if self.bundle_root.exists():
            shutil.rmtree(self.bundle_root)
            LOGGER.info(f"Removed existing bundle cache directory '{self.bundle_root}'.")
        else:
            LOGGER.info(f"No existing bundle cache directory '{self.bundle_root}' to remove.")

    async def generate(self, skip: set[GeneratorType] | None = None) -> Path:
        if skip is None:
            skip = set()

        self._create_metadata_descriptor()
        self._create_esi_config()
        self._create_links_config()

        dataset = (self.bundle_root, self.__fsd, self.__res_file_index, self.__metadata.metadata)

        if "image" not in skip:
            await ImageGenerator(*dataset).load()
        else:
            LOGGER.info("Skipping image generation as per configuration.")

        if "localization" not in skip:
            await LocalizationGenerator(*dataset).load()
        else:
            LOGGER.info("Skipping localization generation as per configuration.")

        if "static" not in skip:
            await StaticDataGenerator(*dataset).load()
        else:
            LOGGER.info("Skipping static data generation as per configuration.")

        if "universe" not in skip:
            await UniverseGenerator(*dataset).load()
        else:
            LOGGER.info("Skipping universe data generation as per configuration.")

        return self._package_bundle()

    def _load_resources(self):
        self.__fsd = Fsd(self.workspace_root / "fsd")
        with open(self.workspace_root / "resfileindex.txt", "r", encoding="utf-8") as f:
            rdr = csv.reader(f)
            raw_res_file_index = list(rdr)
            self.__res_file_index = ResourceTree(
                url_formatter=self.__resource_url_formatter,
                cache_dir=self.__bundle_cache / "index-cache" / "resources",
                index=raw_res_file_index,
            )

    def _create_metadata_descriptor(self):
        with open(self.bundle_root / "bundle.descriptor", "w+", encoding="utf-8") as f:
            try:
                json.dump(
                    {
                        "server": self.__metadata.metadata.server,
                        "server-name": self.__metadata.metadata.server_name,
                        "created": datetime.datetime.now(datetime.UTC).isoformat(),
                        "game": {
                            "version": self.__start_config.config.version,
                            "build": str(self.__start_config.config.build),
                        },
                    },
                    f,
                    indent=4,
                    ensure_ascii=False,
                )
            except Exception as e:
                LOGGER.critical(f"Failed to write bundle descriptor: {e}")
                raise

        LOGGER.info("Created bundle descriptor.")

    def _create_esi_config(self):
        esi_config_path = self.bundle_root / "esi.json"
        if self.__esi_config.config:
            if esi_config_path.exists():
                LOGGER.warning(
                    f"ESI config file '{esi_config_path}' already exists and will be overwritten."
                )
            try:
                with open(esi_config_path, "w+", encoding="utf-8") as f:
                    json.dump(self.__esi_config.config, f, indent=4, ensure_ascii=False)
                LOGGER.info(f"Created ESI config at '{esi_config_path}'.")
            except Exception as e:
                LOGGER.critical(f"Failed to write ESI config: {e}")
                raise
        else:
            LOGGER.error("ESI config is empty! Cannot create ESI config file.")

    def _create_links_config(self):
        links_config_path = self.bundle_root / "links.json"
        if self.__link_config.config:
            if links_config_path.exists():
                LOGGER.warning(
                    f"Links config file '{links_config_path}' already exists and will be overwritten."
                )
            try:
                with open(links_config_path, "w+", encoding="utf-8") as f:
                    json.dump(self.__link_config.config, f, indent=4, ensure_ascii=False)
                LOGGER.info(f"Created links config at '{links_config_path}'.")
            except Exception as e:
                LOGGER.critical(f"Failed to write links config: {e}")
                raise
        else:
            LOGGER.error("Links config is empty! Cannot create links config file.")

    def _package_bundle(self) -> Path:
        LOGGER.info("Packaging bundle...")

        bundle_dir = BUNDLE_OUTPUT_ROOT
        bundle_dir.mkdir(parents=True, exist_ok=True)

        bundle_zip_path = bundle_dir / f"{self.server_id}.bundle"
        if bundle_zip_path.exists():
            LOGGER.warning(f"Existing bundle file '{bundle_zip_path}' will be removed.")
            bundle_zip_path.unlink()

        try:
            with zipfile.ZipFile(bundle_zip_path, "w", zipfile.ZIP_DEFLATED) as f:
                for file_path in self.bundle_root.rglob("*"):
                    if file_path.is_file():
                        arcname = file_path.relative_to(self.bundle_root)
                        f.write(file_path, arcname)

                total_files = sum(1 for file in self.bundle_root.rglob("*") if file.is_file())
                LOGGER.info(f"Packaged {total_files} files into bundle '{bundle_zip_path}'.")
        except Exception as e:
            LOGGER.critical(f"Failed to create bundle file '{bundle_zip_path}': {e}")
            raise

        return bundle_zip_path


from data.bundle_generate.image import ImageGenerator  # noqa: E402
from data.bundle_generate.localization import LocalizationGenerator  # noqa: E402
from data.bundle_generate.log import LOGGER  # noqa: E402
from data.bundle_generate.paths import BUNDLE_CACHE_ROOT  # noqa: E402
from data.bundle_generate.paths import BUNDLE_ESI_KEY_LIST  # noqa: E402
from data.bundle_generate.paths import BUNDLE_LINKS_LIST  # noqa: E402
from data.bundle_generate.paths import BUNDLE_OUTPUT_ROOT  # noqa: E402
from data.bundle_generate.resources import Fsd  # noqa: E402
from data.bundle_generate.resources import ResourceTree  # noqa: E402
from data.bundle_generate.static import StaticDataGenerator  # noqa: E402
from data.bundle_generate.universe import UniverseGenerator  # noqa: E402
