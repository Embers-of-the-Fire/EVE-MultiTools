####  EVE MultiTools Data Bundle Script  ####

from __future__ import annotations

import asyncio
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

PROJECT = Path(__file__).resolve().parent.parent

DOWNLOAD_SEMAPHORE = asyncio.Semaphore(4)

cprint("Initializing data bundle...", "green", attrs=["bold"])


def _success(*args, **kwargs) -> None:
    """Print success message."""
    cprint("Success: ", "green", attrs=["bold"], end="")
    print(*args, **kwargs)


def _warning(*args, **kwargs) -> None:
    """Print warning message."""
    cprint("Warning: ", "yellow", attrs=["bold"], end="")
    print(*args, **kwargs)


def _error(*args, **kwargs) -> None:
    """Print error message and exit."""
    cprint("Error: ", "red", attrs=["bold"], end="")
    cprint(*args, **kwargs)
    exit(1)


## 1. Check workspace
cprint("Checking workspace...", "green", attrs=["bold"])

WORKSPACE = PROJECT / "data" / "bundle-ws"
if not WORKSPACE.exists():
    _error(f"Workspace '{WORKSPACE}' does not exist.")
else:
    _success(f"Found workspace at '{WORKSPACE}'.")

METADATA = WORKSPACE / "metadata.json"
if not METADATA.exists():
    _error(f"Metadata file '{METADATA}' does not exist.")
else:
    _success(f"Found metadata file: {METADATA}.")

START_CFG = WORKSPACE / "start.ini"
if not START_CFG.exists():
    _error(f"Start configuration file '{START_CFG}' does not exist.")
else:
    _success(f"Found start configuration file: {START_CFG}.")

RES_FILE_INDEX = WORKSPACE / "resfileindex.txt"
if not RES_FILE_INDEX.exists():
    _error(f"Resource file index '{RES_FILE_INDEX}' does not exist.")
else:
    _success(f"Found resource file index: {RES_FILE_INDEX}.")

APP_INDEX = WORKSPACE / "index_application.txt"
if not APP_INDEX.exists():
    _error(f"Application index '{APP_INDEX}' does not exist.")
else:
    _success(f"Found application index: {APP_INDEX}.")

FSD_DIR = WORKSPACE / "fsd"
if not FSD_DIR.exists():
    _error(f"FSD directory '{FSD_DIR}' does not exist.")
else:
    _success(f"Found FSD directory: {FSD_DIR}.")

## 2. Load workspace data
with open(METADATA, "r", encoding="utf-8") as f:
    try:
        metadata = json.load(f)
        _success("Loaded metadata.")
        server_id = metadata["server"]
        _success(f"Detected target server ID: {server_id}")
    except Exception as e:
        _error(f"Unable to load metadata: {e}")

try:
    start_cfg = configparser.ConfigParser()
    start_cfg.read(START_CFG)
    _success("Loaded start config.")
except Exception as e:
    _error(f"Unable to load start config: {e}")

BUNDLE_CACHE_MAIN = PROJECT / "data" / "bundle-cache"
if not BUNDLE_CACHE_MAIN.exists():
    BUNDLE_CACHE_MAIN.mkdir(parents=True, exist_ok=True)
    _success(f"Created cache directory: {BUNDLE_CACHE_MAIN}")
else:
    _success(f"Cache directory already exists: {BUNDLE_CACHE_MAIN}")

BUNDLE_CACHE = BUNDLE_CACHE_MAIN / server_id
if not BUNDLE_CACHE.exists():
    BUNDLE_CACHE.mkdir(parents=True, exist_ok=True)
    _success(f"Created project cache directory: {BUNDLE_CACHE}")
else:
    _warning(f"Project cache directory already exists: {BUNDLE_CACHE}")
    _warning("The cache will be inherited. Delete the directory when performing clean builds.")

try:
    _resource_url = metadata["resource-service"]

    def resource_url(ty: typing.Literal["resources", "binaries"], url: str) -> str:
        """Format resource URL based on type and URL."""
        if ty not in ["resources", "binaries"]:
            _error(f"Invalid resource type '{ty}'. Expected 'resources' or 'binaries'.")
        return _resource_url.format(type=ty, url=url)
except KeyError:
    _error("Resource service URL not found in metadata. Please check the metadata file.")


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

    def __init__(
        self,
        url_formatter: collections.abc.Callable[[str], str],
        cache_dir: Path,
        index: list[tuple[str, str, str, str, str]],
    ):
        self.__cache_dir = cache_dir
        self.__url_formatter = url_formatter
        self.__tree = {}
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
        nodes = list(res.split("/"))
        for i in range(1, len(nodes) - 1):
            if ":" in nodes[i]:
                continue
            prev = prev.setdefault(nodes[i], {})
        if nodes[-1] in prev:
            return prev[nodes[-1]]
        return None

    def _download_element(self, res: str) -> "_FileNode":
        """Synchronous download method for backward compatibility."""
        return asyncio.run(self._download_element_async(res))

    async def _download_element_async(self, res: str) -> "_FileNode" | None:
        """Download a single resource asynchronously."""
        el = self._get_element(res)
        if el is None:
            _error(f"Resource '{res}' not found in the index.")
        if el.file_path.exists():
            return el

        async with DOWNLOAD_SEMAPHORE:
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
                            _warning(
                                f"Checksum mismatch for {el.file_path}. Expected {el.checksum}, got {md5.hexdigest()}."
                            )
                    _success(f"Downloaded {el.file_name} to {el.file_path}.")
                    return el

    def get_resource(self, res: str, download: bool = True) -> "_FileNode" | None:
        """Get resource by ID."""
        el = self._get_element(res)
        if el is None or isinstance(el, ResourceTree._FileNode):
            if not download:
                return el
            return self._download_element(res)
        else:
            _error(f"Resource '{res}' is not a file node.")

    async def get_resource_async(self, res: str, download: bool = True) -> "_FileNode" | None:
        """Get resource by ID asynchronously."""
        el = self._get_element(res)
        if el is None or isinstance(el, ResourceTree._FileNode):
            if not download:
                return el
            return await self._download_element_async(res)
        else:
            _error(f"Resource '{res}' is not a file node.")

    def get_resources(self, res: str, download: bool = True) -> list["_FileNode"]:
        """Get all resources under a given ID."""
        return asyncio.run(self.get_resources_async(res, download))

    async def get_resources_async(self, res: str, download: bool = True) -> list["_FileNode"]:
        """Get all resources under a given ID asynchronously."""
        el = self._get_element(res)
        if el is None:
            return []
        if isinstance(el, ResourceTree._FileNode):
            if download:
                return [await self._download_element_async(res)]
            else:
                return [el]
        else:
            resources = []
            tasks = []
            for key, v in el.items():
                if isinstance(v, ResourceTree._FileNode):
                    if download:
                        tasks.append(self._download_element_async(v.res_id))
                    else:
                        resources.append(v)
                else:
                    sub_res_id = f"{res}/{key}" if not res.endswith("/") else f"{res}{key}"
                    sub_resources = await self.get_resources_async(sub_res_id, download)
                    resources.extend(sub_resources)

            if tasks:
                downloaded_resources = await asyncio.gather(*tasks)
                resources.extend(downloaded_resources)

            return resources


with open(RES_FILE_INDEX, "r", encoding="utf-8") as f:
    try:
        rdr = csv.reader(f)
        raw_res_file_index = list(rdr)
        res_file_index = ResourceTree(
            url_formatter=lambda x: resource_url("resources", x),
            cache_dir=BUNDLE_CACHE / "index-cache" / "resources",
            index=raw_res_file_index,
        )
        _success("Loaded resource file index")
    except Exception as e:
        _error(f"Unable to load res file index: {e}")

with open(APP_INDEX, "r", encoding="utf-8") as f:
    try:
        rdr = csv.reader(f)
        raw_app_index = list(rdr)
        app_index = ResourceTree(
            url_formatter=lambda x: resource_url("binaries", x),
            cache_dir=BUNDLE_CACHE / "index-cache" / "applications",
            index=raw_res_file_index,
        )
        _success("Loaded app index")
    except Exception as e:
        _error(f"Unable to load app index: {e}")


class Fsd:
    """FSD cache handler."""

    __cache: dict[str, dict]

    def __init__(self, fsd_dir: Path):
        self.fsd_dir = fsd_dir
        if not self.fsd_dir.exists():
            _error(f"FSD directory '{self.fsd_dir}' does not exist.")
        else:
            _success(f"Initialized FSD handler with directory: {self.fsd_dir}")
        self.__cache = {}

    def get_fsd(self, fsd_name: str) -> dict[str, typing.Any]:
        """Get FSD data by name."""
        if fsd_name in self.__cache:
            return self.__cache[fsd_name]

        fsd_path = self.fsd_dir / f"{fsd_name}.json"
        if not fsd_path.exists():
            _error(f"FSD file '{fsd_path}' does not exist.")

        with open(fsd_path, "r", encoding="utf-8") as f:
            try:
                fsd_data = json.load(f)
                self.__cache[fsd_name] = fsd_data
                return fsd_data
            except Exception as e:
                _error(f"Unable to load FSD data from '{fsd_path}': {e}")


fsd = Fsd(FSD_DIR)

## 3. Start bundle processing
cprint("Starting bundle processing...", "green", attrs=["bold"])
BUNDLE_ROOT = BUNDLE_CACHE / "bundle"
BUNDLE_ROOT.mkdir(parents=True, exist_ok=True)

### 3.1 Produce metadata
with open(BUNDLE_ROOT / "bundle.descriptor", "w+", encoding="utf-8") as f:
    try:
        json.dump(
            {
                "server": metadata["server"],
                "server-name": metadata["server-name"],
                "created": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "game": {
                    "version": start_cfg["main"]["version"],
                    "build": start_cfg["main"]["build"],
                },
            },
            f,
            indent=4,
            ensure_ascii=False,
        )
        _success(f"Wrote metadata descriptor: {BUNDLE_CACHE / 'bundle.descriptor'}.")
    except Exception as e:
        _error(f"Unable to write metadata descriptor: {e}")

### 3.2 Collect images

BUNDLE_IMAGES = BUNDLE_ROOT / "images"


async def download_and_copy_icon(res_id: str, target_path: Path, description: str):
    if target_path.exists():
        _warning(f"Skipped {description} (file already exists).")
        return

    downloaded_file = await res_file_index.get_resource_async(res_id, download=True)
    shutil.copyfile(downloaded_file.file_path, target_path)
    _success(f"Copied {description}.")


#### 3.2.1 Collect graphics
# The graphics definition is stored in `fsd/graphicids.json`.
# For any graphic unit, the folder should contains one or more files,
# including extras like blueprint, blueprint copy, etc.
# For the bundle, we do not specify the graphic files,
# which means we're going to select them at the frontend part.
# Some graphic files might provides multiple resolutions,
# so we specify the resolution.
# To be more specific, all graphics has a resolution of 64x64 pixels.


async def collect_graphics_async():
    cprint("Collecting graphics...", "green", attrs=["bold"])
    BUNDLE_GRAPHICS = BUNDLE_IMAGES / "graphics"
    BUNDLE_GRAPHICS.mkdir(parents=True, exist_ok=True)
    GRAPHIC_IDS = fsd.get_fsd("graphicids")
    if not GRAPHIC_IDS:
        _error("No graphic IDs found in FSD data.")

    download_tasks = []

    for graphic_id, graphic_data in GRAPHIC_IDS.items():
        graphic_id = int(graphic_id)
        if not isinstance(graphic_data, dict):
            continue
        icon_folder = graphic_data.get("iconInfo", {}).get("folder")
        if not icon_folder:
            _warning(f"Graphic ID {graphic_id} has no icon folder defined, skipping.")
            continue

        icons = await res_file_index.get_resources_async(icon_folder, download=False)
        for icon in icons:
            if f"{graphic_id}_" not in icon.file_name:
                continue
            if "_64" not in icon.file_name:
                continue
            if "t2" in icon.file_name or "t3" in icon.file_name or "faction" in icon.file_name:
                continue

            # 创建下载任务
            if "bpc" in icon.file_name:
                task = download_and_copy_icon(
                    icon.res_id,
                    BUNDLE_GRAPHICS / f"{graphic_id}_bpc.png",
                    f"blueprint copy icon for graphic ID {graphic_id}",
                )
                download_tasks.append(task)
            elif "bp" in icon.file_name:
                task = download_and_copy_icon(
                    icon.res_id,
                    BUNDLE_GRAPHICS / f"{graphic_id}_bp.png",
                    f"blueprint icon for graphic ID {graphic_id}",
                )
                download_tasks.append(task)
            else:
                task = download_and_copy_icon(
                    icon.res_id,
                    BUNDLE_GRAPHICS / f"{graphic_id}.png",
                    f"graphic icon for graphic ID {graphic_id}",
                )
                download_tasks.append(task)

    if download_tasks:
        await asyncio.gather(*download_tasks)


asyncio.run(collect_graphics_async())


#### 3.2.2 Collect icons
# The icons definition is stored in `fsd/iconids.json`.
# Given that most icons varies by resolution,
# we will not change their resolution but let the frontend to process them.


async def collect_icons_async():
    cprint("Collecting icons...", "green", attrs=["bold"])
    BUNDLE_ICONS = BUNDLE_IMAGES / "icons"
    BUNDLE_ICONS.mkdir(parents=True, exist_ok=True)

    ICON_IDS = fsd.get_fsd("iconids")
    if not ICON_IDS:
        _error("No icon IDs found in FSD data.")

    download_tasks = []
    for icon_id, icon_data in ICON_IDS.items():
        if not isinstance(icon_data, dict):
            continue
        icon_file = icon_data.get("iconFile", "").lower()
        if not icon_file:
            _warning(f"Icon ID {icon_id} has no icon file defined, skipping.")
            continue
        icon = await res_file_index.get_resource_async(icon_file, download=False)
        if not icon:
            _warning(f"Icon file '{icon_file}' for icon ID {icon_id} not found, skipping.")
            continue
        target_path = BUNDLE_ICONS / f"{icon_id}.png"
        task = download_and_copy_icon(
            icon.res_id,
            target_path,
            f"icon for icon ID {icon_id}",
        )
        download_tasks.append(task)

    if download_tasks:
        await asyncio.gather(*download_tasks)


asyncio.run(collect_icons_async())


### 3.3 Collect localizations
# The localization files is stored in resource
# `res:/localizationfsd/localization_fsd_<lang code>.pickle`.
# Currently we only support English and Chinese.
# The localization files are Python3-compatible pickle files.
# However, we cannot use them directly as we dont have python
# in the release bundle.
# So we will convert them to a SQLite database file.
cprint("Collecting localizations...", "green", attrs=["bold"])
BUNDLE_LOCALIZATIONS = BUNDLE_ROOT / "localizations"
BUNDLE_LOCALIZATIONS.mkdir(parents=True, exist_ok=True)
BUNDLE_LOC_DB = BUNDLE_LOCALIZATIONS / "localizations.db"
if BUNDLE_LOC_DB.exists():
    _warning(f"Localization database '{BUNDLE_LOC_DB}' already exists. It will be overwritten.")
    BUNDLE_LOC_DB.unlink()
en = res_file_index.get_resource("res:/localizationfsd/localization_fsd_en-us.pickle")
if not en:
    _error("English localization file not found in resource index.")
zh = res_file_index.get_resource("res:/localizationfsd/localization_fsd_zh.pickle")
if not zh:
    _error("Chinese localization file not found in resource index.")

with open(en.file_path, "rb") as f:
    try:
        _, en_data = pickle.load(f)
        _success("Loaded English localization data.")
    except Exception as e:
        _error(f"Unable to load English localization data: {e}")
with open(zh.file_path, "rb") as f:
    try:
        _, zh_data = pickle.load(f)
        _success("Loaded Chinese localization data.")
    except Exception as e:
        _error(f"Unable to load Chinese localization data: {e}")

db = sqlite3.connect(BUNDLE_LOC_DB)
try:
    cursor = db.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS localization (
            key INTEGER UNIQUE PRIMARY KEY,
            en TEXT,
            zh TEXT
        )
        """
    )
    _success("Created localization table.")
    for key in en_data:
        cursor.execute(
            "INSERT OR REPLACE INTO localization (key, en, zh) VALUES (?, ?, ?)",
            (key, en_data[key][0], zh_data.get(key, [""])[0]),
        )
    db.commit()
    _success("Inserted localization data into the database.")
except sqlite3.Error as e:
    _error(f"SQLite error: {e}")

### 3.4 Collect static data
# This section is for collecting static data.
# The static data part is the very core of the bundle.
#
# The form we store the static data varies by type.
# For some regular data, we will use ProtoBufs to store them,
# and they'll be loaded into memory when the application starts.
# For some data that is not suitable for ProtoBufs or is used less frequently,
# we will store them in a SQLite database.
cprint("Collecting static data...", "green", attrs=["bold"])

#### 3.4.1 Collect type-related data
# Most static data in EVE is camelCase,
# so this part of Python code we use camelCase in field names.

BUNDLE_STATIC = BUNDLE_ROOT / "static"
BUNDLE_STATIC.mkdir(parents=True, exist_ok=True)


# Some boolean fields stored in FSD are actually integers.
# So we have to define this here.
def _cvt_int_to_bool(v: int | bool) -> bool:
    if isinstance(v, int):
        return v != 0
    elif isinstance(v, bool):
        return v
    else:
        raise ValueError(f"Invalid bool-like value: {v}")


type BoolInt = typing.Annotated[bool, BeforeValidator(_cvt_int_to_bool)]

##### 3.4.1.1 Collect type definitions
# Type definitions are stored in `fsd/typeids.json`.
# This part of data is used quite frequently,
# so we will store them in protobuf format.
# To make it easier for the application to load,
# we will use PyDantic to define the type structure
# and then convert it to protobuf format.


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


types = fsd.get_fsd("types")
type_collection = schema_pb2.TypeCollection()

for type_id, type_def in types.items():
    try:
        validated = TypeID(**type_def)
    except ValidationError:
        _error(f"Failed to validate typeID info for type {type_id}")

    # Create protobuf TypeEntry
    type_entry = type_collection.types.add()
    type_entry.type_id = int(type_id)
    type_entry.type_data.CopyFrom(pydantic_to_protobuf_type_id(validated, int(type_id)))

BUNDLE_STATIC_TYPES = BUNDLE_STATIC / "types.pb"
if BUNDLE_STATIC_TYPES.exists():
    _warning(f"Types protobuf file '{BUNDLE_STATIC_TYPES}' already exists. It will be overwritten.")
    BUNDLE_STATIC_TYPES.unlink()
# Save as protobuf binary
with open(BUNDLE_STATIC_TYPES, "wb+") as f:
    f.write(type_collection.SerializeToString())
_success("Processed types information.")

##### 3.4.1.2 Collect type dogma
# Type dogma definitions are stored in `fsd/typedogma.json`.
# This part of data is used not that frequently,
# so we will store them in a SQLite database.
# However the value of each db entry will be a blob of protobuf.


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


# Process type dogma data
type_dogmas = fsd.get_fsd("typedogma")
if not type_dogmas:
    _error("No type dogma data found in FSD.")

# Create SQLite database for type dogma
BUNDLE_DOGMA_DB = BUNDLE_STATIC / "type_dogma.db"
if BUNDLE_DOGMA_DB.exists():
    _warning(f"Type dogma database '{BUNDLE_DOGMA_DB}' already exists. It will be overwritten.")
    BUNDLE_DOGMA_DB.unlink()

dogma_db = sqlite3.connect(BUNDLE_DOGMA_DB)
try:
    cursor = dogma_db.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS type_dogma (
            type_id INTEGER UNIQUE PRIMARY KEY,
            dogma_data BLOB
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
            _warning(f"Failed to validate dogma info for type {type_id}: {e}")
            continue

    dogma_db.commit()
    _success("Processed type dogma information.")
except sqlite3.Error as e:
    _error(f"SQLite error while processing type dogma: {e}")
finally:
    dogma_db.close()

##### 3.4.1.3 Collect type materials
# Type material definitions are stored in `fsd/typematerials.json`.
# This part of data is used not that frequently,
# so we will store them in a SQLite database.
# However the value of each db entry will be a blob of protobuf.


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


# Process type material data
type_materials = fsd.get_fsd("typematerials")
if not type_materials:
    _error("No type materials data found in FSD.")

# Create SQLite database for type materials
BUNDLE_MATERIALS_DB = BUNDLE_STATIC / "type_materials.db"
if BUNDLE_MATERIALS_DB.exists():
    _warning(
        f"Type materials database '{BUNDLE_MATERIALS_DB}' already exists. It will be overwritten."
    )
    BUNDLE_MATERIALS_DB.unlink()

materials_db = sqlite3.connect(BUNDLE_MATERIALS_DB)
try:
    cursor = materials_db.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS type_materials (
            type_id INTEGER UNIQUE PRIMARY KEY,
            materials_data BLOB
        )
        """
    )
    _success("Created type materials table.")

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
                        _warning(f"Skipping incomplete material in type {type_id}: {material}")
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
            _warning(f"Failed to validate material info for type {type_id}: {e}")
            continue

    materials_db.commit()
    _success("Processed type materials information.")
except sqlite3.Error as e:
    _error(f"SQLite error while processing type materials: {e}")
finally:
    materials_db.close()

## 4. Package the bundle
cprint("Packaging bundle...", "green", attrs=["bold"])

# Create the final bundle directory
FINAL_BUNDLE_DIR = PROJECT / "data" / "bundle"
FINAL_BUNDLE_DIR.mkdir(parents=True, exist_ok=True)

# Create the bundle zip file
BUNDLE_ZIP_PATH = FINAL_BUNDLE_DIR / f"{server_id}.bundle"
if BUNDLE_ZIP_PATH.exists():
    _warning(f"Bundle file '{BUNDLE_ZIP_PATH}' already exists. It will be overwritten.")
    BUNDLE_ZIP_PATH.unlink()

try:
    with zipfile.ZipFile(BUNDLE_ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as zipf:
        # Add all files from the bundle directory
        for file_path in BUNDLE_ROOT.rglob("*"):
            if file_path.is_file():
                # Calculate relative path from bundle root
                relative_path = file_path.relative_to(BUNDLE_ROOT)
                zipf.write(file_path, relative_path)

        # Count total files for progress indication
        total_files = sum(1 for file_path in BUNDLE_ROOT.rglob("*") if file_path.is_file())
        _success(f"Packaged {total_files} files into bundle.")

    # Get final bundle size
    bundle_size = BUNDLE_ZIP_PATH.stat().st_size
    bundle_size_mb = bundle_size / (1024 * 1024)

    _success(f"Bundle created successfully: {BUNDLE_ZIP_PATH}")
    _success(f"Bundle size: {bundle_size_mb:.2f} MB")
except Exception as e:
    _error(f"Failed to create bundle package: {e}")

cprint("Bundle processing completed successfully!", "green", attrs=["bold"])
