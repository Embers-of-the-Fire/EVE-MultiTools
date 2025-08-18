####  EVE MultiTools Data Bundle Implementation  ####

from __future__ import annotations

import asyncio
from collections import defaultdict
import pickle
import sqlite3
import aiohttp
import collections
from dataclasses import dataclass
import datetime
import hashlib
from pathlib import Path
import json
import csv
import configparser
import shutil
import typing
import zipfile

from pydantic import BaseModel, BeforeValidator, Field, ValidationError
from termcolor import cprint

import schema_pb2


class BundleProcessor:
    """Bundle processor for a single workspace."""

    def __init__(
        self, workspace_path: Path, project_root: Path, download_semaphore: asyncio.Semaphore
    ):
        self.workspace_path = workspace_path
        self.project_root = project_root
        self.download_semaphore = download_semaphore

        # Initialize paths
        self.metadata_path = workspace_path / "metadata.json"
        self.start_cfg_path = workspace_path / "start.ini"
        self.res_file_index_path = workspace_path / "resfileindex.txt"
        self.app_index_path = workspace_path / "index_application.txt"
        self.fsd_dir_path = workspace_path / "fsd"
        self.esi_path = workspace_path / "esi.json"
        self.links_path = workspace_path / "links.json"

        # Will be set during initialization
        self.metadata = None
        self.server_id = None
        self.start_cfg = None
        self.bundle_cache = None
        self.bundle_root = None
        self.res_file_index = None
        self.app_index = None
        self.fsd = None
        self.esi = None
        self.links = None

    def _success(self, *args, **kwargs) -> None:
        """Print success message."""
        cprint("Success: ", "green", attrs=["bold"], end="")
        print(*args, **kwargs)

    def _warning(self, *args, **kwargs) -> None:
        """Print warning message."""
        cprint("Warning: ", "yellow", attrs=["bold"], end="")
        print(*args, **kwargs)

    def _error(self, *args, **kwargs) -> None:
        """Print error message and exit."""
        cprint("Error: ", "red", attrs=["bold"], end="")
        cprint(*args, **kwargs)
        raise RuntimeError(f"Bundle processing error: {args}")

    def clean_bundles(self) -> None:
        """Clean up existing bundles."""
        cprint("Cleaning up existing bundles...", "green", attrs=["bold"])

        final_bundle_dir = self.project_root / "data" / "bundle"
        final_bundle_file = final_bundle_dir / f"{self.server_id}.bundle"
        if final_bundle_file.exists():
            final_bundle_file.unlink()
            self._success(f"Removed existing bundle file: {final_bundle_file}")

    def clean_cache(self) -> None:
        """Clean up existing cache."""
        cprint("Cleaning up existing cache...", "green", attrs=["bold"])

        if self.bundle_root.exists():
            shutil.rmtree(self.bundle_root)
            self._success(f"Removed existing bundle directory: {self.bundle_root}")
        else:
            self._warning(f"Bundle directory does not exist: {self.bundle_root}")

        if self.bundle_cache.exists():
            shutil.rmtree(self.bundle_cache)
            self._success(f"Removed existing cache directory: {self.bundle_cache}")
        else:
            self._warning(f"Cache directory does not exist: {self.bundle_cache}")

    def check_workspace(self) -> bool:
        """Check workspace validity."""
        cprint(f"Checking workspace: {self.workspace_path}", "green", attrs=["bold"])

        if not self.workspace_path.exists():
            self._error(f"Workspace '{self.workspace_path}' does not exist.")
            return False

        self._success(f"Found workspace at '{self.workspace_path}'.")

        # Check required files
        required_files = [
            (self.metadata_path, "metadata file"),
            (self.start_cfg_path, "start configuration file"),
            (self.res_file_index_path, "resource file index"),
            (self.app_index_path, "application index"),
            (self.fsd_dir_path, "FSD directory"),
            (self.esi_path, "ESI configuration file"),
            (self.links_path, "external links file"),
        ]

        for file_path, description in required_files:
            if not file_path.exists():
                self._error(f"{description.capitalize()} '{file_path}' does not exist.")
                return False
            self._success(f"Found {description}: {file_path}.")

        return True

    def load_workspace_descriptor(self) -> None:
        """Load workspace descriptor."""
        cprint("Loading workspace descriptor...", "green", attrs=["bold"])

        # Load metadata
        with open(self.metadata_path, "r", encoding="utf-8") as f:
            try:
                self.metadata = json.load(f)
                self._success("Loaded metadata.")
                self.server_id = self.metadata["server"]
                self._success(f"Detected target server ID: {self.server_id}")
            except Exception as e:
                self._error(f"Unable to load metadata: {e}")

        with open(self.esi_path, "r", encoding="utf-8") as f:
            try:
                self.esi = json.load(f)
                self._success("Loaded ESI configuration.")
                ESI_KEYS = Path(__file__).parent / "esi-keys.list.json"
                if ESI_KEYS.exists():
                    with open(ESI_KEYS, "r", encoding="utf-8") as keys_file:
                        esi_keys = json.load(keys_file)
                        for key in esi_keys:
                            if key not in self.esi:
                                self._error(
                                    f"ESI key '{key}' not found in configuration. Please check the ESI keys file."
                                )
                            else:
                                self._success(f"ESI key '{key}' verified.")
                else:
                    self._warning(f"ESI keys file '{ESI_KEYS}' does not exist. No keys verified.")
            except Exception as e:
                self._error(f"Unable to load ESI configuration: {e}")

        with open(self.links_path, "r", encoding="utf-8") as f:
            try:
                self.links = json.load(f)
                self._success("Loaded external links.")
                LINKS_KEYS = Path(__file__).parent / "links.list.json"
                if LINKS_KEYS.exists():
                    with open(LINKS_KEYS, "r", encoding="utf-8") as keys_file:
                        links_keys = json.load(keys_file)
                        for key in links_keys:
                            if key not in self.links:
                                self._error(
                                    f"Link '{key}' not found in configuration. Please check the links file."
                                )
                            else:
                                self._success(f"Link '{key}' verified.")
                else:
                    self._warning(
                        f"Links keys file '{LINKS_KEYS}' does not exist. No links verified."
                    )
            except Exception as e:
                self._error(f"Unable to load external links: {e}")

        # Load start config
        try:
            self.start_cfg = configparser.ConfigParser()
            self.start_cfg.read(self.start_cfg_path)
            self._success("Loaded start config.")
        except Exception as e:
            self._error(f"Unable to load start config: {e}")

        # Setup cache directories
        bundle_cache_main = self.project_root / "data" / "bundle-cache"
        if not bundle_cache_main.exists():
            bundle_cache_main.mkdir(parents=True, exist_ok=True)
            self._success(f"Created cache directory: {bundle_cache_main}")
        else:
            self._success(f"Cache directory already exists: {bundle_cache_main}")

        self.bundle_cache = bundle_cache_main / self.server_id
        if not self.bundle_cache.exists():
            self.bundle_cache.mkdir(parents=True, exist_ok=True)
            self._success(f"Created project cache directory: {self.bundle_cache}")
        else:
            self._warning(f"Project cache directory already exists: {self.bundle_cache}")
            self._warning(
                "The cache will be inherited. Delete the directory when performing clean builds."
            )
        self.bundle_root = self.bundle_cache / "bundle"

    def load_workspace_data(self) -> None:
        """Load workspace data."""
        cprint("Loading workspace data...", "green", attrs=["bold"])
        # Setup resource URL formatter
        try:
            _resource_url = self.metadata["resource-service"]

            def resource_url(ty: typing.Literal["resources", "binaries"], url: str) -> str:
                """Format resource URL based on type and URL."""
                if ty not in ["resources", "binaries"]:
                    self._error(
                        f"Invalid resource type '{ty}'. Expected 'resources' or 'binaries'."
                    )
                return _resource_url.format(type=ty, url=url)

            self.resource_url = resource_url
        except KeyError:
            self._error(
                "Resource service URL not found in metadata. Please check the metadata file."
            )

        # Setup image service URL formatter
        try:
            _image_faction_url = self.metadata["image-service"]["npc-faction"]

            def image_faction_url(faction_id: int) -> str:
                """Format faction image URL."""
                return _image_faction_url.format(factionId=faction_id)

            self.image_faction_url = image_faction_url
        except KeyError:
            self._error(
                "Image service URL for NPC factions not found in metadata. Please check the metadata file."
            )

        # Load resource indexes
        with open(self.res_file_index_path, "r", encoding="utf-8") as f:
            try:
                rdr = csv.reader(f)
                raw_res_file_index = list(rdr)
                self.res_file_index = ResourceTree(
                    url_formatter=lambda x: self.resource_url("resources", x),
                    cache_dir=self.bundle_cache / "index-cache" / "resources",
                    index=raw_res_file_index,
                    semaphore=self.download_semaphore,
                )
                self._success("Loaded resource file index")
            except Exception as e:
                self._error(f"Unable to load res file index: {e}")

        with open(self.app_index_path, "r", encoding="utf-8") as f:
            try:
                rdr = csv.reader(f)
                raw_app_index = list(rdr)
                self.app_index = ResourceTree(
                    url_formatter=lambda x: self.resource_url("binaries", x),
                    cache_dir=self.bundle_cache / "index-cache" / "applications",
                    index=raw_app_index,
                    semaphore=self.download_semaphore,
                )
                self._success("Loaded app index")
            except Exception as e:
                self._error(f"Unable to load app index: {e}")

        # Initialize FSD handler
        self.fsd = Fsd(self.fsd_dir_path)

    def initialize_bundle_processing(self) -> None:
        """Initialize bundle processing."""
        cprint("Starting bundle processing...", "green", attrs=["bold"])
        self.bundle_root.mkdir(parents=True, exist_ok=True)

    def create_metadata_descriptor(self) -> None:
        """Create metadata descriptor."""
        with open(self.bundle_root / "bundle.descriptor", "w+", encoding="utf-8") as f:
            try:
                json.dump(
                    {
                        "server": self.metadata["server"],
                        "server-name": self.metadata["server-name"],
                        "created": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                        "game": {
                            "version": self.start_cfg["main"]["version"],
                            "build": self.start_cfg["main"]["build"],
                        },
                    },
                    f,
                    indent=4,
                    ensure_ascii=False,
                )
                self._success(
                    f"Wrote metadata descriptor: {self.bundle_root / 'bundle.descriptor'}."
                )
            except Exception as e:
                self._error(f"Unable to write metadata descriptor: {e}")

    def create_esi_config(self) -> None:
        """Create ESI configuration file."""
        esi_config_path = self.bundle_root / "esi.json"
        with open(esi_config_path, "w+", encoding="utf-8") as f:
            try:
                json.dump(self.esi, f, indent=4, ensure_ascii=False)
                self._success(f"Wrote ESI configuration: {esi_config_path}.")
            except Exception as e:
                self._error(f"Unable to write ESI configuration: {e}")
    
    def create_links_config(self) -> None:
        """Create links configuration file."""
        links_config_path = self.bundle_root / "links.json"
        with open(links_config_path, "w+", encoding="utf-8") as f:
            try:
                json.dump(self.links, f, indent=4, ensure_ascii=False)
                self._success(f"Wrote links configuration: {links_config_path}.")
            except Exception as e:
                self._error(f"Unable to write links configuration: {e}")

    async def collect_images(self) -> None:
        """Collect all images."""
        bundle_images = self.bundle_root / "images"

        await self._collect_graphics(bundle_images)
        await self._collect_icons(bundle_images)
        await self._collect_skin_material_icons(bundle_images)
        await self._collect_faction_icons(bundle_images)

    async def _collect_graphics(self, bundle_images: Path) -> None:
        """Collect graphics images."""
        cprint("Collecting graphics...", "green", attrs=["bold"])
        bundle_graphics = bundle_images / "graphics"
        bundle_graphics.mkdir(parents=True, exist_ok=True)
        graphic_ids = self.fsd.get_fsd("graphicids")
        if not graphic_ids:
            self._error("No graphic IDs found in FSD data.")

        download_tasks = []

        for graphic_id, graphic_data in graphic_ids.items():
            graphic_id = int(graphic_id)

            if not isinstance(graphic_data, dict):
                self._warning(f"Graphic ID {graphic_id} data is not a dictionary, skipping.")
                continue
            icon_folder = graphic_data.get("iconInfo", {}).get("folder")
            if not icon_folder:
                self._warning(f"Graphic ID {graphic_id} has no icon folder defined, skipping.")
                continue

            icons = await self.res_file_index.get_resources(icon_folder, download=False)
            found = False
            for icon in icons:
                if f"{graphic_id}_" not in icon.file_name:
                    continue
                if "_64" not in icon.file_name:
                    continue
                if "t2" in icon.file_name or "t3" in icon.file_name or "faction" in icon.file_name:
                    continue

                found = True

                # 创建下载任务
                if "bpc" in icon.file_name:
                    task = self._download_and_copy_icon(
                        icon.res_id,
                        bundle_graphics / f"{graphic_id}_bpc.png",
                        f"blueprint copy icon for graphic ID {graphic_id}",
                    )
                    download_tasks.append(task)
                elif "bp" in icon.file_name:
                    task = self._download_and_copy_icon(
                        icon.res_id,
                        bundle_graphics / f"{graphic_id}_bp.png",
                        f"blueprint icon for graphic ID {graphic_id}",
                    )
                    download_tasks.append(task)
                else:
                    task = self._download_and_copy_icon(
                        icon.res_id,
                        bundle_graphics / f"{graphic_id}.png",
                        f"graphic icon for graphic ID {graphic_id}",
                    )
                    download_tasks.append(task)
            if not found:
                self._warning(f"No valid icons found for graphic ID {graphic_id}, skipping.")

        if download_tasks:
            await asyncio.gather(*download_tasks)

    async def _collect_icons(self, bundle_images: Path) -> None:
        """Collect icons."""
        cprint("Collecting icons...", "green", attrs=["bold"])
        bundle_icons = bundle_images / "icons"
        bundle_icons.mkdir(parents=True, exist_ok=True)

        icon_ids = self.fsd.get_fsd("iconids")
        if not icon_ids:
            self._error("No icon IDs found in FSD data.")

        download_tasks = []
        for icon_id, icon_data in icon_ids.items():
            if not isinstance(icon_data, dict):
                continue
            icon_file = icon_data.get("iconFile", "").lower()
            if not icon_file:
                self._warning(f"Icon ID {icon_id} has no icon file defined, skipping.")
                continue
            icon = await self.res_file_index.get_resource(icon_file, download=False)
            if not icon:
                self._warning(f"Icon file '{icon_file}' for icon ID {icon_id} not found, skipping.")
                continue
            target_path = bundle_icons / f"{icon_id}.png"
            task = self._download_and_copy_icon(
                icon.res_id,
                target_path,
                f"icon for icon ID {icon_id}",
            )
            download_tasks.append(task)

        if download_tasks:
            await asyncio.gather(*download_tasks)

    async def _collect_skin_material_icons(self, bundle_images: Path) -> None:
        """Collect skin material icons."""
        cprint("Collecting skin material icons...", "green", attrs=["bold"])
        bundle_skin_materials = bundle_images / "skins" / "materials"
        bundle_skin_materials.mkdir(parents=True, exist_ok=True)
        skin_materials = await self.res_file_index.get_resources(
            "res:/ui/texture/classes/skins/icons", download=False
        )
        if not skin_materials:
            self._error("No skin material icons found in resource index.")
        download_tasks = []
        for skin_material in skin_materials:
            if not skin_material.file_name.endswith(".png"):
                continue
            target_path = bundle_skin_materials / skin_material.file_name
            task = self._download_and_copy_icon(
                skin_material.res_id,
                target_path,
                f"skin material icon {skin_material.file_name}",
            )
            download_tasks.append(task)

        if download_tasks:
            await asyncio.gather(*download_tasks)

    async def _collect_faction_icons(self, bundle_images: Path) -> None:
        """Collect faction icons."""
        cprint("Collecting faction icons...", "green", attrs=["bold"])
        bundle_factions = bundle_images / "factions"
        bundle_factions.mkdir(parents=True, exist_ok=True)

        bundle_faction_logos = bundle_factions / "logos"
        bundle_faction_logos.mkdir(parents=True, exist_ok=True)

        bundle_faction_icons = bundle_factions / "icons"
        bundle_faction_icons.mkdir(parents=True, exist_ok=True)

        faction_ids = self.fsd.get_fsd("factions")
        if not faction_ids:
            self._error("No factions found in FSD data.")

        download_tasks = []
        for faction_id, faction_data in faction_ids.items():
            if not isinstance(faction_data, dict):
                continue

            flat_logo = faction_data.get("flatLogo")
            if flat_logo:
                flat_logo_res = f"res:/ui/texture/eveicon/faction_logos/{flat_logo}_256px.png"
                icon = await self.res_file_index.get_resource(flat_logo_res, download=False)
                if icon:
                    target_path = bundle_faction_logos / f"{flat_logo}.png"
                    task = self._download_and_copy_icon(
                        icon.res_id,
                        target_path,
                        f"faction flag logo for faction ID {faction_id}",
                    )
                    download_tasks.append(task)
                else:
                    self._warning(
                        f"Flat logo '{flat_logo_res}' for faction ID {faction_id} not found, skipping."
                    )
            else:
                self._warning(f"Faction ID {faction_id} has no flat logo defined, skipping.")

            flat_logo_with_name = faction_data.get("flatLogoWithName")
            if flat_logo_with_name:
                flag_logo_res = (
                    f"res:/ui/texture/eveicon/faction_logos/{flat_logo_with_name}_256px.png"
                )
                icon = await self.res_file_index.get_resource(flag_logo_res, download=False)
                if icon:
                    target_path = bundle_faction_logos / f"{flat_logo_with_name}.png"
                    task = self._download_and_copy_icon(
                        icon.res_id,
                        target_path,
                        f"faction flat logo with name for faction ID {faction_id}",
                    )
                    download_tasks.append(task)
                else:
                    self._warning(
                        f"Flat logo '{flag_logo_res}' for faction ID {faction_id} not found, skipping."
                    )
            else:
                self._warning(
                    f"Faction ID {faction_id} has no flat logo with name defined, skipping."
                )

            image_url = self.image_faction_url(int(faction_id))
            if image_url:
                target_path = bundle_faction_icons / f"{faction_id}.png"
                task = self._download_and_copy_image(
                    image_url,
                    target_path,
                    f"faction icon for faction ID {faction_id}",
                )
                download_tasks.append(task)
            else:
                self._warning(f"No image URL for faction ID {faction_id}, skipping.")

        if download_tasks:
            await asyncio.gather(*download_tasks)

    async def _download_and_copy_icon(self, res_id: str, target_path: Path, description: str):
        """Download and copy icon."""
        if target_path.exists():
            self._warning(f"Skipped {description} (file already exists).")
            return

        downloaded_file = await self.res_file_index.get_resource(res_id, download=True)
        shutil.copyfile(downloaded_file.file_path, target_path)
        self._success(f"Copied {description}.")

    async def _download_and_copy_image(self, image_url: str, target_path: Path, description: str):
        """Download and copy image."""
        if target_path.exists():
            self._warning(f"Skipped {description} (file already exists).")
            return
        async with self.download_semaphore:
            async with aiohttp.ClientSession() as session:
                async with session.get(image_url) as response:
                    if response.status != 200:
                        self._error(f"Failed to download {description} from {image_url}.")
                    content = await response.read()
                    with open(target_path, "wb") as f:
                        f.write(content)
        self._success(f"Copied {description}.")

    async def collect_localizations(self) -> None:
        """Collect localizations."""
        cprint("Collecting localizations...", "green", attrs=["bold"])
        bundle_localizations = self.bundle_root / "localizations"
        bundle_localizations.mkdir(parents=True, exist_ok=True)

        en = await self.res_file_index.get_resource(
            "res:/localizationfsd/localization_fsd_en-us.pickle"
        )
        if not en:
            self._error("English localization file not found in resource index.")
        zh = await self.res_file_index.get_resource(
            "res:/localizationfsd/localization_fsd_zh.pickle"
        )
        if not zh:
            self._error("Chinese localization file not found in resource index.")

        with open(en.file_path, "rb") as f:
            try:
                _, en_data = pickle.load(f)
                self._success("Loaded English localization data.")
            except Exception as e:
                self._error(f"Unable to load English localization data: {e}")
        with open(zh.file_path, "rb") as f:
            try:
                _, zh_data = pickle.load(f)
                self._success("Loaded Chinese localization data.")
            except Exception as e:
                self._error(f"Unable to load Chinese localization data: {e}")

        # Create protobuf localization collection
        localization_collection = schema_pb2.LocalizationCollection()
        for key in en_data:
            en_text = en_data[key][0] if key in en_data else ""
            zh_text = zh_data.get(key, [""])[0]

            loc_entry = localization_collection.localizations.add()
            loc_entry.key = key
            loc_entry.localization_data.en = en_text
            loc_entry.localization_data.zh = zh_text

        # Save localization protobuf
        bundle_loc_pb = bundle_localizations / "localizations.pb"
        if bundle_loc_pb.exists():
            self._warning(
                f"Localization protobuf file '{bundle_loc_pb}' already exists. It will be overwritten."
            )
            bundle_loc_pb.unlink()

        with open(bundle_loc_pb, "wb+") as f:
            f.write(localization_collection.SerializeToString())
        self._success("Created localization protobuf file.")

        # Save type localization lookup
        types = self.fsd.get_fsd("types")
        type_loc_lookup = schema_pb2.TypeLocalizationLookup()

        for type_id, type_def in types.items():
            try:
                validated = TypeID(**type_def)
                # Add to type localization lookup
                loc_entry = type_loc_lookup.type_entries.add()
                loc_entry.type_id = int(type_id)
                loc_entry.type_name_id = validated.typeNameID
                if validated.descriptionID is not None:
                    loc_entry.type_description_id = validated.descriptionID
            except ValidationError:
                self._warning(
                    f"Failed to validate typeID info for type {type_id} in localization lookup"
                )
                continue

        bundle_type_loc_lookup = bundle_localizations / "type_localization_lookup.pb"
        if bundle_type_loc_lookup.exists():
            self._warning(
                f"Type localization lookup file '{bundle_type_loc_lookup}' already exists. It will be overwritten."
            )
            bundle_type_loc_lookup.unlink()
        with open(bundle_type_loc_lookup, "wb+") as f:
            f.write(type_loc_lookup.SerializeToString())
        self._success("Processed type localization lookup information.")

    async def collect_static_data(self) -> None:
        """Collect static data."""
        cprint("Collecting static data...", "green", attrs=["bold"])
        bundle_static = self.bundle_root / "static"
        bundle_static.mkdir(parents=True, exist_ok=True)

        # Collect all static data components
        self._collect_type_definitions(bundle_static)
        self._collect_type_dogma(bundle_static)
        self._collect_type_materials(bundle_static)
        self._collect_categories(bundle_static)
        self._collect_groups(bundle_static)
        self._collect_meta_groups(bundle_static)
        await self._collect_skin_infos(bundle_static)
        self._collect_factions(bundle_static)
        self._collect_market_groups(bundle_static)

    def _collect_type_definitions(self, bundle_static: Path) -> None:
        """Collect type definitions."""
        types = self.fsd.get_fsd("types")
        type_collection = schema_pb2.TypeCollection()

        for type_id, type_def in types.items():
            try:
                validated = TypeID(**type_def)
            except ValidationError:
                self._error(f"Failed to validate typeID info for type {type_id}")

            # Create protobuf TypeEntry
            type_entry = type_collection.types.add()
            type_entry.type_id = int(type_id)
            type_entry.type_data.CopyFrom(pydantic_to_protobuf_type_id(validated, int(type_id)))

        bundle_static_types = bundle_static / "types.pb"
        if bundle_static_types.exists():
            self._warning(
                f"Types protobuf file '{bundle_static_types}' already exists. It will be overwritten."
            )
            bundle_static_types.unlink()
        # Save as protobuf binary
        with open(bundle_static_types, "wb+") as f:
            f.write(type_collection.SerializeToString())
        self._success("Processed types information.")

    def _collect_type_dogma(self, bundle_static: Path) -> None:
        """Collect type dogma."""
        type_dogmas = self.fsd.get_fsd("typedogma")
        if not type_dogmas:
            self._error("No type dogma data found in FSD.")

        # Create SQLite database for type dogma
        bundle_dogma_db = bundle_static / "type_dogma.db"
        if bundle_dogma_db.exists():
            self._warning(
                f"Type dogma database '{bundle_dogma_db}' already exists. It will be overwritten."
            )
            bundle_dogma_db.unlink()

        dogma_db = sqlite3.connect(bundle_dogma_db)
        try:
            cursor = dogma_db.cursor()
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS type_dogma (
                    type_id INTEGER NOT NULL UNIQUE PRIMARY KEY,
                    dogma_data BLOB NOT NULL
                )
                """
            )

            for type_id, dogma_def in type_dogmas.items():
                try:
                    validated = TypeDogma(**dogma_def)

                    # Convert to protobuf and serialize to bytes
                    pb_dogma = pydantic_to_protobuf_type_dogma(validated)
                    dogma_blob = pb_dogma.SerializeToString()

                    # Insert into database
                    cursor.execute(
                        "INSERT OR REPLACE INTO type_dogma (type_id, dogma_data) VALUES (?, ?)",
                        (int(type_id), dogma_blob),
                    )
                except ValidationError as e:
                    self._warning(f"Failed to validate dogma info for type {type_id}: {e}")
                    continue

            dogma_db.commit()
            self._success("Processed type dogma information.")
        except sqlite3.Error as e:
            self._error(f"SQLite error while processing type dogma: {e}")
        finally:
            dogma_db.close()

    def _collect_type_materials(self, bundle_static: Path) -> None:
        """Collect type materials."""
        type_materials = self.fsd.get_fsd("typematerials")
        if not type_materials:
            self._error("No type materials data found in FSD.")

        # Create SQLite database for type materials
        bundle_materials_db = bundle_static / "type_materials.db"
        if bundle_materials_db.exists():
            self._warning(
                f"Type materials database '{bundle_materials_db}' already exists. It will be overwritten."
            )
            bundle_materials_db.unlink()

        materials_db = sqlite3.connect(bundle_materials_db)
        try:
            cursor = materials_db.cursor()
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS type_materials (
                    type_id INTEGER NOT NULL UNIQUE PRIMARY KEY,
                    materials_data BLOB NOT NULL
                )
                """
            )
            self._success("Created type materials table.")

            for type_id, material_def in type_materials.items():
                try:
                    # Convert material list to the expected format
                    materials_list = []
                    if "materials" in material_def and material_def["materials"]:
                        for material in material_def["materials"]:
                            # Handle the case where materialTypeID might be missing
                            # (some entries in the JSON might not have materialTypeID)
                            if "materialTypeID" in material and "quantity" in material:
                                materials_list.append(
                                    {
                                        "materialTypeID": material["materialTypeID"],
                                        "quantity": material["quantity"],
                                    }
                                )
                            else:
                                # Skip materials without required fields
                                self._warning(
                                    f"Skipping incomplete material in type {type_id}: {material}"
                                )
                                continue

                    # Only process if we have valid materials
                    if materials_list:
                        formatted_material = {"materials": materials_list}
                        validated = TypeMaterial(**formatted_material)

                        # Convert to protobuf and serialize to bytes
                        pb_material = pydantic_to_protobuf_type_material(validated)
                        material_blob = pb_material.SerializeToString()

                        # Insert into database
                        cursor.execute(
                            "INSERT OR REPLACE INTO type_materials (type_id, materials_data) VALUES (?, ?)",
                            (int(type_id), material_blob),
                        )

                except ValidationError as e:
                    self._warning(f"Failed to validate material info for type {type_id}: {e}")
                    continue

            materials_db.commit()
            self._success("Processed type materials information.")
        except sqlite3.Error as e:
            self._error(f"SQLite error while processing type materials: {e}")
        finally:
            materials_db.close()

    def _collect_categories(self, bundle_static: Path) -> None:
        """Collect categories."""
        categories = self.fsd.get_fsd("categories")
        category_collection = schema_pb2.CategoryCollection()
        for category_id, category_def in categories.items():
            try:
                validated = Category(**category_def)
            except ValidationError:
                self._error(f"Failed to validate category info for category {category_id}")
                continue
            category_entry = category_collection.categories.add()
            category_entry.category_id = int(category_id)
            category_entry.category_data.CopyFrom(pydantic_to_protobuf_category(validated))

        bundle_static_categories = bundle_static / "categories.pb"
        if bundle_static_categories.exists():
            self._warning(
                f"Categories protobuf file '{bundle_static_categories}' already exists. It will be overwritten."
            )
            bundle_static_categories.unlink()
        with open(bundle_static_categories, "wb+") as f:
            f.write(category_collection.SerializeToString())
        self._success("Processed categories information.")

    def _collect_groups(self, bundle_static: Path) -> None:
        """Collect groups."""
        groups = self.fsd.get_fsd("groups")
        group_collection = schema_pb2.GroupCollection()
        for group_id, group_def in groups.items():
            try:
                validated = Group(**group_def)
            except ValidationError:
                self._error(f"Failed to validate group info for group {group_id}")
                continue
            group_entry = group_collection.groups.add()
            group_entry.group_id = int(group_id)
            group_entry.group_data.CopyFrom(pydantic_to_protobuf_group(validated))

        bundle_static_groups = bundle_static / "groups.pb"
        if bundle_static_groups.exists():
            self._warning(
                f"Groups protobuf file '{bundle_static_groups}' already exists. It will be overwritten."
            )
            bundle_static_groups.unlink()
        with open(bundle_static_groups, "wb+") as f:
            f.write(group_collection.SerializeToString())
        self._success("Processed groups information.")

    def _collect_meta_groups(self, bundle_static: Path) -> None:
        """Collect meta groups."""
        meta_groups = self.fsd.get_fsd("metagroups")
        meta_group_collection = schema_pb2.MetaGroupCollection()
        for meta_group_id, meta_group_def in meta_groups.items():
            try:
                validated = MetaGroup(**meta_group_def)
            except ValidationError:
                self._error(f"Failed to validate meta group info for meta group {meta_group_id}")
                continue
            meta_group_entry = meta_group_collection.meta_groups.add()
            meta_group_entry.meta_group_id = int(meta_group_id)
            meta_group_entry.meta_group_data.CopyFrom(pydantic_to_protobuf_meta_group(validated))
        bundle_static_meta_groups = bundle_static / "meta_groups.pb"
        if bundle_static_meta_groups.exists():
            self._warning(
                f"Meta groups protobuf file '{bundle_static_meta_groups}' already exists. It will be overwritten."
            )
            bundle_static_meta_groups.unlink()
        with open(bundle_static_meta_groups, "wb+") as f:
            f.write(meta_group_collection.SerializeToString())
        self._success("Processed meta groups information.")

    async def _collect_skin_infos(self, bundle_static: Path) -> None:
        """Collect skin infos."""
        bundle_skins_db = bundle_static / "skins.db"
        if bundle_skins_db.exists():
            self._warning(
                f"Skins database '{bundle_skins_db}' already exists. It will be overwritten."
            )
            bundle_skins_db.unlink()
        # 初始化 skins.db 的表结构
        skins_db = sqlite3.connect(bundle_skins_db)
        try:
            cursor = skins_db.cursor()
            # skins 表
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS skins (
                    skin_id INTEGER PRIMARY KEY,
                    internal_name TEXT NOT NULL,
                    allow_ccp_devs BOOLEAN NOT NULL,
                    skin_material_id INTEGER NOT NULL,
                    visible_serenity BOOLEAN NOT NULL,
                    visible_tranquility BOOLEAN NOT NULL
                )
                """
            )
            # skin_materials 表
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS skin_materials (
                    skin_material_id INTEGER PRIMARY KEY,
                    display_name_id INTEGER NOT NULL,
                    material_set_id INTEGER NOT NULL
                )
                """
            )
            # skin_licenses 表
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS skin_licenses (
                    license_id INTEGER PRIMARY KEY,
                    skin_id INTEGER NOT NULL,
                    duration INTEGER NOT NULL,
                    FOREIGN KEY (skin_id) REFERENCES skins(skin_id)
                )
                """
            )
            # skin_types 表
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS skin_types (
                    skin_id INTEGER NOT NULL,
                    type_id INTEGER NOT NULL,
                    PRIMARY KEY (skin_id, type_id),
                    FOREIGN KEY (skin_id) REFERENCES skins(skin_id)
                )
                """
            )
            # 常用索引
            cursor.execute(
                "CREATE INDEX IF NOT EXISTS idx_skin_licenses_skin_id ON skin_licenses(skin_id)"
            )
            cursor.execute(
                "CREATE INDEX IF NOT EXISTS idx_skin_types_type_id ON skin_types(type_id)"
            )
            skins_db.commit()

            with (
                sqlite3.connect(
                    (
                        await self.res_file_index.get_resource("res:/staticdata/skins.static")
                    ).file_path
                ) as skins_static_db,
                sqlite3.connect(
                    (
                        await self.res_file_index.get_resource(
                            "res:/staticdata/skinmaterials.static"
                        )
                    ).file_path
                ) as skin_materials_static_db,
                sqlite3.connect(
                    (
                        await self.res_file_index.get_resource(
                            "res:/staticdata/skinlicenses.static"
                        )
                    ).file_path
                ) as skin_licenses_static_db,
            ):
                skins_static_cur = skins_static_db.cursor()
                skin_materials_static_cur = skin_materials_static_db.cursor()
                skin_licenses_static_cur = skin_licenses_static_db.cursor()

                cursor.executemany(
                    "INSERT INTO skins VALUES (?, ?, ?, ?, ?, ?)",
                    (
                        (
                            key,
                            value["internalName"],
                            value["allowCCPDevs"],
                            value["skinMaterialID"],
                            value["visibleSerenity"],
                            value["visibleTranquility"],
                        )
                        for key, value in map(
                            lambda t: (t[0], json.loads(t[1])),
                            skins_static_cur.execute("SELECT key, value FROM cache").fetchall(),
                        )
                    ),
                )
                # 插入 skin_materials
                cursor.executemany(
                    "INSERT INTO skin_materials VALUES (?, ?, ?)",
                    (
                        (
                            key,
                            value["displayNameID"],
                            value["materialSetID"],
                        )
                        for key, value in map(
                            lambda t: (t[0], json.loads(t[1])),
                            skin_materials_static_cur.execute(
                                "SELECT key, value FROM cache"
                            ).fetchall(),
                        )
                    ),
                )
                # 插入 skin_licenses
                cursor.executemany(
                    "INSERT INTO skin_licenses (license_id, skin_id, duration) VALUES (?, ?, ?)",
                    (
                        (
                            value["licenseTypeID"],
                            value["skinID"],
                            value["duration"],
                        )
                        for _, value in map(
                            lambda t: (t[0], json.loads(t[1])),
                            skin_licenses_static_cur.execute(
                                "SELECT key, value FROM cache"
                            ).fetchall(),
                        )
                    ),
                )
                # 插入 skin_types（皮肤与类型的多对多关系）
                for key, value in map(
                    lambda t: (t[0], json.loads(t[1])),
                    skins_static_cur.execute("SELECT key, value FROM cache").fetchall(),
                ):
                    if "types" in value and value["types"]:
                        cursor.executemany(
                            "INSERT INTO skin_types (skin_id, type_id) VALUES (?, ?)",
                            ((key, type_id) for type_id in value["types"]),
                        )

            skins_db.commit()
            self._success("Initialized skins.db with skins, skin materials, and skin licenses.")
            self._success("Populated skins, skin materials, and skin licenses tables.")
        except sqlite3.Error as e:
            self._error(f"SQLite error while initializing skins.db: {e}")
        finally:
            skins_db.close()

    def _collect_factions(self, bundle_static: Path) -> None:
        """Collect factions."""
        factions = self.fsd.get_fsd("factions")
        faction_collection = schema_pb2.FactionCollection()
        for faction_id, faction_def in factions.items():
            try:
                validated = Faction(**faction_def)
            except ValidationError:
                self._error(f"Failed to validate faction info for faction {faction_id}")
                continue
            faction_entry = faction_collection.factions.add()
            faction_entry.faction_id = int(faction_id)
            faction_entry.faction_data.CopyFrom(pydantic_to_protobuf_faction(validated))

        bundle_static_factions = bundle_static / "factions.pb"
        if bundle_static_factions.exists():
            self._warning(
                f"Factions protobuf file '{bundle_static_factions}' already exists. It will be overwritten."
            )
            bundle_static_factions.unlink()
        with open(bundle_static_factions, "wb+") as f:
            f.write(faction_collection.SerializeToString())
        self._success("Processed factions information.")

    def _collect_market_groups(self, bundle_static: Path) -> None:
        """Collect market groups."""
        market_groups = self.fsd.get_fsd("marketgroups")
        market_group_collection = schema_pb2.MarketGroupCollection()
        to_export: defaultdict[
            int, dict[typing.Literal["model", "types", "groups"], MarketGroup | list[int]]
        ] = defaultdict(dict)

        for market_group_id, market_group_def in market_groups.items():
            try:
                validated = MarketGroup(**market_group_def)
            except ValidationError:
                self._error(f"Failed to validate market group info for group {market_group_id}")
                continue

            to_export[int(market_group_id)]["model"] = validated
            if validated.parentGroupID is not None:
                to_export[validated.parentGroupID].setdefault("groups", []).append(
                    int(market_group_id)
                )

        for type_id, type_def in self.fsd.get_fsd("types").items():
            if "marketGroupID" in type_def and type_def["marketGroupID"] is not None:
                to_export[type_def["marketGroupID"]].setdefault("types", []).append(int(type_id))

        for market_group_id, data in to_export.items():
            if "model" not in data:
                self._warning(f"Market group {market_group_id} has no model, skipping.")
                continue

            market_group_entry = market_group_collection.market_groups.add()
            market_group_entry.market_group_id = market_group_id
            market_group_entry.market_group_data.name_id = data["model"].nameID
            if data["model"].iconID is not None:
                market_group_entry.market_group_data.icon_id = data["model"].iconID
            if data["model"].descriptionID is not None:
                market_group_entry.market_group_data.description_id = data["model"].descriptionID
            if data["model"].parentGroupID is not None:
                market_group_entry.market_group_data.parent_group_id = data["model"].parentGroupID

            market_group_entry.market_group_data.types.extend(data.get("types") or [])
            market_group_entry.market_group_data.groups.extend(data.get("groups") or [])

        bundle_static_market_groups = bundle_static / "market_groups.pb"
        if bundle_static_market_groups.exists():
            self._warning(
                f"Market groups protobuf file '{bundle_static_market_groups}' already exists. It will be overwritten."
            )
            bundle_static_market_groups.unlink()
        with open(bundle_static_market_groups, "wb+") as f:
            f.write(market_group_collection.SerializeToString())
        self._success("Processed market groups information.")

    def package_bundle(self) -> Path:
        """Package the bundle."""
        cprint("Packaging bundle...", "green", attrs=["bold"])

        # Create the final bundle directory
        final_bundle_dir = self.project_root / "data" / "bundle"
        final_bundle_dir.mkdir(parents=True, exist_ok=True)

        # Create the bundle zip file
        bundle_zip_path = final_bundle_dir / f"{self.server_id}.bundle"
        if bundle_zip_path.exists():
            self._warning(
                f"Bundle file '{bundle_zip_path}' already exists. It will be overwritten."
            )
            bundle_zip_path.unlink()

        try:
            with zipfile.ZipFile(bundle_zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
                # Add all files from the bundle directory
                for file_path in self.bundle_root.rglob("*"):
                    if file_path.is_file():
                        # Calculate relative path from bundle root
                        relative_path = file_path.relative_to(self.bundle_root)
                        zipf.write(file_path, relative_path)

                # Count total files for progress indication
                total_files = sum(
                    1 for file_path in self.bundle_root.rglob("*") if file_path.is_file()
                )
                self._success(f"Packaged {total_files} files into bundle.")

            # Get final bundle size
            bundle_size = bundle_zip_path.stat().st_size
            bundle_size_mb = bundle_size / (1024 * 1024)

            self._success(f"Bundle created successfully: {bundle_zip_path}")
            self._success(f"Bundle size: {bundle_size_mb:.2f} MB")
            return bundle_zip_path
        except Exception as e:
            self._error(f"Failed to create bundle package: {e}")

    async def process_bundle(self) -> Path:
        """Process the complete bundle."""
        if not self.check_workspace():
            return None

        self.load_workspace_descriptor()
        self.load_workspace_data()
        self.initialize_bundle_processing()

        # Create metadata descriptor
        self.create_metadata_descriptor()

        # Create ESI configuration
        self.create_esi_config()

        # Create links configuration
        self.create_links_config()

        # Collect images
        await self.collect_images()

        # Collect localizations
        await self.collect_localizations()

        # Collect static data
        await self.collect_static_data()

        # Package the bundle
        return self.package_bundle()


# Helper classes and functions from original bundle.py


class ResourceTree:
    """Generic resource tree view."""

    @dataclass
    class _FileNode:
        file_name: str
        file_path: Path
        res_id: str
        url: str
        checksum: str

    type _Node = "_FileNode" | dict[str, "_Node"]

    __tree: dict[str, "_Node"]
    __cache_dir: Path
    __url_formatter: collections.abc.Callable[[str], str]
    __semaphore: asyncio.Semaphore

    def __init__(
        self,
        url_formatter: collections.abc.Callable[[str], str],
        cache_dir: Path,
        index: list[tuple[str, str, str, str, str]],
        semaphore: asyncio.Semaphore,
    ):
        self.__cache_dir = cache_dir
        self.__url_formatter = url_formatter
        self.__tree = {}
        self.__semaphore = semaphore
        for res_id, url, checksum, *_ in index:
            prev = self.__tree
            prev_d = cache_dir
            nodes = list(res_id.split("/"))
            for i in range(1, len(nodes) - 1):
                if ":" in nodes[i]:
                    continue
                prev = prev.setdefault(nodes[i], {})
                prev_d = prev_d / nodes[i]
            prev[nodes[-1]] = ResourceTree._FileNode(
                file_name=nodes[-1],
                file_path=prev_d / nodes[-1],
                res_id=res_id,
                url=url,
                checksum=checksum,
            )

    def _get_element(self, res: str) -> "_Node" | None:
        prev = self.__tree
        nodes = list(filter(lambda t: len(t) > 0, res.split("/")))
        for i in range(1, len(nodes) - 1):
            if ":" in nodes[i]:
                continue
            prev = prev.setdefault(nodes[i], {})
        if nodes[-1] in prev:
            return prev[nodes[-1]]
        return None

    async def _download_element(self, res: str) -> "_FileNode" | None:
        """Download a single resource asynchronously."""
        el = self._get_element(res)
        if el is None:
            raise RuntimeError(f"Resource '{res}' not found in the index.")
        if el.file_path.exists():
            return el

        async with self.__semaphore:  # Use global semaphore or pass it as parameter
            async with aiohttp.ClientSession() as session:
                async with session.get(self.__url_formatter(el.url)) as response:
                    response.raise_for_status()
                    el.file_path.parent.mkdir(parents=True, exist_ok=True)

                    with open(el.file_path, "wb") as f:
                        async for chunk in response.content.iter_chunked(8192):
                            f.write(chunk)

                    # checksum
                    if el.checksum:
                        md5 = hashlib.md5()
                        with open(el.file_path, "rb") as f:
                            md5.update(f.read())
                        if md5.hexdigest() != el.checksum:
                            cprint(
                                f"Checksum mismatch for {el.file_path}. Expected {el.checksum}, got {md5.hexdigest()}.",
                                "yellow",
                                attrs=["bold"],
                            )
                    cprint(f"Downloaded {el.file_name} to {el.file_path}.", "green")
                    return el

    async def get_resource(self, res: str, download: bool = True) -> "_FileNode" | None:
        """Get resource by ID asynchronously."""
        el = self._get_element(res)
        if el is None or isinstance(el, ResourceTree._FileNode):
            if not download:
                return el
            return await self._download_element(res)
        else:
            raise RuntimeError(f"Resource '{res}' is not a file node.")

    async def get_resources(self, res: str, download: bool = True) -> list["_FileNode"]:
        """Get all resources under a given ID asynchronously."""
        el = self._get_element(res)
        if el is None:
            return []
        if isinstance(el, ResourceTree._FileNode):
            if download:
                return [await self._download_element(res)]
            else:
                return [el]
        else:
            resources = []
            tasks = []
            for key, v in el.items():
                if isinstance(v, ResourceTree._FileNode):
                    if download:
                        tasks.append(self._download_element(v.res_id))
                    else:
                        resources.append(v)
                else:
                    sub_res_id = f"{res}/{key}" if not res.endswith("/") else f"{res}{key}"
                    sub_resources = await self.get_resources(sub_res_id, download)
                    resources.extend(sub_resources)

            if tasks:
                downloaded_resources = await asyncio.gather(*tasks)
                resources.extend(downloaded_resources)

            return resources


class Fsd:
    """FSD cache handler."""

    __cache: dict[str, dict]

    def __init__(self, fsd_dir: Path):
        self.fsd_dir = fsd_dir
        if not self.fsd_dir.exists():
            raise RuntimeError(f"FSD directory '{self.fsd_dir}' does not exist.")
        else:
            cprint(f"Initialized FSD handler with directory: {self.fsd_dir}", "green")
        self.__cache = {}

    def get_fsd(self, fsd_name: str) -> dict[str, typing.Any]:
        """Get FSD data by name."""
        if fsd_name in self.__cache:
            return self.__cache[fsd_name]

        fsd_path = self.fsd_dir / f"{fsd_name}.json"
        if not fsd_path.exists():
            raise RuntimeError(f"FSD file '{fsd_path}' does not exist.")

        with open(fsd_path, "r", encoding="utf-8") as f:
            try:
                fsd_data = json.load(f)
                self.__cache[fsd_name] = fsd_data
                return fsd_data
            except Exception as e:
                raise RuntimeError(f"Unable to load FSD data from '{fsd_path}': {e}")


# Pydantic models and conversion functions


def _cvt_int_to_bool(v: int | bool) -> bool:
    if isinstance(v, int):
        return v != 0
    elif isinstance(v, bool):
        return v
    else:
        raise ValueError(f"Invalid bool-like value: {v}")


type BoolInt = typing.Annotated[bool, BeforeValidator(_cvt_int_to_bool)]


class TypeID(BaseModel):
    """Type ID definition.

    This mirrors the structure of typeIDs.json in the FSD."""

    basePrice: float
    capacity: float
    certificateTemplate: int | None = Field(default=None)
    descriptionID: int | None = Field(default=None)
    designerIDs: list[int] = Field(default_factory=list)
    factionID: int | None = Field(default=None)
    graphicID: int | None = Field(default=None)
    groupID: int
    iconID: int | None = Field(default=None)
    isDynamicType: BoolInt = Field(default=False)
    isisGroupID: int | None = Field(default=None)
    marketGroupID: int | None = Field(default=None)
    metaGroupID: int | None = Field(default=None)
    metaLevel: int | None = Field(default=None)
    portionSize: int
    published: BoolInt
    quoteAuthorID: int | None = Field(default=None)
    quoteID: int | None = Field(default=None)
    raceID: int | None = Field(default=None)
    radius: float
    soundID: int | None = Field(default=None)
    techLevel: int | None = Field(default=None)
    typeID: int
    typeNameID: int
    variationParentTypeID: int | None = Field(default=None)
    volume: float
    wreckTypeID: int | None = Field(default=None)


def pydantic_to_protobuf_type_id(pydantic_obj: "TypeID", type_id: int) -> schema_pb2.TypeID:
    """Convert Pydantic TypeID to protobuf TypeID."""
    pb_obj = schema_pb2.TypeID()

    # Required fields
    pb_obj.base_price = pydantic_obj.basePrice
    pb_obj.capacity = pydantic_obj.capacity
    pb_obj.group_id = pydantic_obj.groupID
    pb_obj.portion_size = pydantic_obj.portionSize
    pb_obj.published = pydantic_obj.published
    pb_obj.radius = pydantic_obj.radius
    pb_obj.type_id = type_id
    pb_obj.type_name_id = pydantic_obj.typeNameID
    pb_obj.volume = pydantic_obj.volume
    pb_obj.is_dynamic_type = pydantic_obj.isDynamicType

    # Optional fields - only set if not None
    if pydantic_obj.certificateTemplate is not None:
        pb_obj.certificate_template = pydantic_obj.certificateTemplate
    if pydantic_obj.descriptionID is not None:
        pb_obj.description_id = pydantic_obj.descriptionID
    if pydantic_obj.designerIDs:
        pb_obj.designer_ids.extend(pydantic_obj.designerIDs)
    if pydantic_obj.factionID is not None:
        pb_obj.faction_id = pydantic_obj.factionID
    if pydantic_obj.graphicID is not None:
        pb_obj.graphic_id = pydantic_obj.graphicID
    if pydantic_obj.iconID is not None:
        pb_obj.icon_id = pydantic_obj.iconID
    if pydantic_obj.isisGroupID is not None:
        pb_obj.isis_group_id = pydantic_obj.isisGroupID
    if pydantic_obj.marketGroupID is not None:
        pb_obj.market_group_id = pydantic_obj.marketGroupID
    if pydantic_obj.metaGroupID is not None:
        pb_obj.meta_group_id = pydantic_obj.metaGroupID
    if pydantic_obj.metaLevel is not None:
        pb_obj.meta_level = pydantic_obj.metaLevel
    if pydantic_obj.quoteAuthorID is not None:
        pb_obj.quote_author_id = pydantic_obj.quoteAuthorID
    if pydantic_obj.quoteID is not None:
        pb_obj.quote_id = pydantic_obj.quoteID
    if pydantic_obj.raceID is not None:
        pb_obj.race_id = pydantic_obj.raceID
    if pydantic_obj.soundID is not None:
        pb_obj.sound_id = pydantic_obj.soundID
    if pydantic_obj.techLevel is not None:
        pb_obj.tech_level = pydantic_obj.techLevel
    if pydantic_obj.variationParentTypeID is not None:
        pb_obj.variation_parent_type_id = pydantic_obj.variationParentTypeID
    if pydantic_obj.wreckTypeID is not None:
        pb_obj.wreck_type_id = pydantic_obj.wreckTypeID

    return pb_obj


class TypeDogma(BaseModel):
    """Type dogma definition.

    This mirrors the structure of typeDogma.json in the FSD."""

    class _DogmaAttribute(BaseModel):
        """Dogma attribute definition."""

        attributeID: int
        value: float

    class _DogmaEffect(BaseModel):
        """Dogma effect definition."""

        effectID: int
        isDefault: BoolInt

    dogmaAttributes: list[_DogmaAttribute] = Field(default_factory=list)
    dogmaEffects: list[_DogmaEffect] = Field(default_factory=list)


def pydantic_to_protobuf_type_dogma(pydantic_obj: "TypeDogma") -> schema_pb2.TypeDogma:
    """Convert Pydantic TypeDogma to protobuf TypeDogma."""
    pb_obj = schema_pb2.TypeDogma()

    # Convert dogma attributes
    for attr in pydantic_obj.dogmaAttributes:
        pb_attr = pb_obj.dogma_attributes.add()
        pb_attr.attribute_id = attr.attributeID
        pb_attr.value = attr.value

    # Convert dogma effects
    for effect in pydantic_obj.dogmaEffects:
        pb_effect = pb_obj.dogma_effects.add()
        pb_effect.effect_id = effect.effectID
        pb_effect.is_default = effect.isDefault

    return pb_obj


class TypeMaterial(BaseModel):
    """Type material definition.

    This mirrors the structure of typeMaterials.json in the FSD."""

    class _Material(BaseModel):
        """Material definition."""

        materialTypeID: int
        quantity: int

    materials: list[_Material] = Field(default_factory=list)


def pydantic_to_protobuf_type_material(pydantic_obj: "TypeMaterial") -> schema_pb2.TypeMaterial:
    """Convert Pydantic TypeMaterial to protobuf TypeMaterial."""
    pb_obj = schema_pb2.TypeMaterial()

    # Convert materials
    for material in pydantic_obj.materials:
        pb_material = pb_obj.materials.add()
        pb_material.material_type_id = material.materialTypeID
        pb_material.quantity = material.quantity

    return pb_obj


class Category(BaseModel):
    """Category definition.

    This mirrors the structure of categories.json in the FSD."""

    categoryID: int
    categoryNameID: int
    iconID: int | None = Field(default=None)
    published: BoolInt = Field(default=False)


def pydantic_to_protobuf_category(pydantic_obj: "Category") -> schema_pb2.Category:
    pb_obj = schema_pb2.Category()
    pb_obj.category_id = pydantic_obj.categoryID
    pb_obj.category_name_id = pydantic_obj.categoryNameID
    pb_obj.published = pydantic_obj.published
    if pydantic_obj.iconID is not None:
        pb_obj.icon_id = pydantic_obj.iconID
    return pb_obj


class Group(BaseModel):
    """Group definition.

    This mirrors the structure of groups.json in the FSD."""

    anchorable: BoolInt = Field(default=False)
    fittableNonSingleton: BoolInt = Field(default=False)
    iconID: int | None = None
    groupNameID: int
    groupID: int
    anchored: BoolInt = Field(default=False)
    published: BoolInt = Field(default=False)
    useBasePrice: BoolInt = Field(default=False)
    categoryID: int


def pydantic_to_protobuf_group(pydantic_obj: "Group") -> schema_pb2.Group:
    pb_obj = schema_pb2.Group()
    pb_obj.group_id = pydantic_obj.groupID
    pb_obj.group_name_id = pydantic_obj.groupNameID
    if pydantic_obj.iconID is not None:
        pb_obj.icon_id = pydantic_obj.iconID
    pb_obj.category_id = pydantic_obj.categoryID
    pb_obj.anchorable = pydantic_obj.anchorable
    pb_obj.fittable_non_singleton = pydantic_obj.fittableNonSingleton
    pb_obj.anchored = pydantic_obj.anchored
    pb_obj.published = pydantic_obj.published
    pb_obj.use_base_price = pydantic_obj.useBasePrice
    return pb_obj


class MetaGroup(BaseModel):
    nameID: int
    iconID: int | None = Field(default=None)


def pydantic_to_protobuf_meta_group(pydantic_obj: "MetaGroup") -> schema_pb2.MetaGroup:
    pb_obj = schema_pb2.MetaGroup()
    pb_obj.name_id = pydantic_obj.nameID
    if pydantic_obj.iconID is not None:
        pb_obj.icon_id = pydantic_obj.iconID
    return pb_obj


class Faction(BaseModel):
    nameID: int
    descriptionID: int
    shortDescriptionID: int | None = Field(default=None)
    corporationID: int | None = Field(default=None)
    iconID: int
    memberRaces: list[int] = Field(default_factory=list)
    uniqueName: BoolInt = Field(default=False)
    flatLogo: str | None = Field(default=None)
    flatLogoWithName: str | None = Field(default=None)
    solarSystemID: int
    militiaCorporationID: int | None = Field(default=None)
    sizeFactor: float


def pydantic_to_protobuf_faction(pydantic_obj: "Faction") -> schema_pb2.Faction:
    pb_obj = schema_pb2.Faction()
    pb_obj.name_id = pydantic_obj.nameID
    pb_obj.description_id = pydantic_obj.descriptionID
    if pydantic_obj.shortDescriptionID is not None:
        pb_obj.short_description_id = pydantic_obj.shortDescriptionID
    if pydantic_obj.corporationID is not None:
        pb_obj.corporation_id = pydantic_obj.corporationID
    pb_obj.icon_id = pydantic_obj.iconID
    pb_obj.unique_name = pydantic_obj.uniqueName
    if pydantic_obj.flatLogo is not None:
        pb_obj.flat_logo = pydantic_obj.flatLogo
    if pydantic_obj.flatLogoWithName is not None:
        pb_obj.flat_logo_with_name = pydantic_obj.flatLogoWithName
    pb_obj.solar_system_id = pydantic_obj.solarSystemID
    if pydantic_obj.militiaCorporationID is not None:
        pb_obj.militia_corporation_id = pydantic_obj.militiaCorporationID
    pb_obj.size_factor = pydantic_obj.sizeFactor
    pb_obj.member_races.extend(pydantic_obj.memberRaces)
    return pb_obj


class MarketGroup(BaseModel):
    nameID: int
    descriptionID: int | None = Field(default=None)
    iconID: int | None = Field(default=None)
    parentGroupID: int | None = Field(default=None)
    hasTypes: BoolInt
