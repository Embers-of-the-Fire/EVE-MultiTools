from __future__ import annotations

import asyncio
import collections
import hashlib
import json
import logging
import typing

from dataclasses import dataclass

import aiohttp
import yaml

from tenacity import after_log
from tenacity import retry
from tenacity import stop_after_attempt
from tenacity import wait_exponential

from data import schema_loader
from data.bundle_generate.async_config import SEMAPHORE
from data.bundle_generate.log import LOGGER


if typing.TYPE_CHECKING:
    from pathlib import Path


type FormatterFunc = collections.abc.Callable[[str], str]
type ResourcePath = str
type ResourcePathPattern = str
type UrlEndpoint = str
type Checksum = str
type ResFileIndex = list[tuple[ResourcePath, UrlEndpoint, Checksum, str, str]]


class ResourceTree:
    @dataclass
    class _FileNode:
        file_name: str
        file_path: Path
        res_id: str
        url: str
        checksum: str

    type _Node = dict[str, ResourceTree._Node] | _FileNode

    __tree: dict[str, _Node]
    __url_formatter: FormatterFunc

    def __init__(self, url_formatter: FormatterFunc, cache_dir: Path, index: ResFileIndex) -> None:
        self.__tree = {}
        self.__url_formatter = url_formatter

        for res_id, url, checksum, *_ in index:
            prev = self.__tree
            prev_d = cache_dir
            nodes = list(res_id.split("/"))

            for i in range(1, len(nodes) - 1):
                if ":" in nodes[i]:  # i.e. "res:" segment
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

    def _get_element(self, res: ResourcePath) -> _Node | None:
        prev = self.__tree
        nodes = [x for x in res.split("/") if len(x) > 0]

        for i in range(1, len(nodes) - 1):
            if ":" in nodes[i]:  # i.e. "res:" segment
                continue
            prev = prev.setdefault(nodes[i], {})

        if nodes[-1] in prev:
            return prev[nodes[-1]]
        return None

    async def _download_element(self, res: ResourcePath) -> _FileNode | None:
        el = self._get_element(res)
        if el is None:
            LOGGER.error(f"Resource '{res}' not found in resource tree.")
            return None
        if not isinstance(el, ResourceTree._FileNode):
            LOGGER.error(f"Resource '{res}' is not a file node.")
            return None
        if el.file_path.exists():
            return el

        @retry(
            stop=stop_after_attempt(3),
            wait=wait_exponential(),
            after=after_log(LOGGER, logging.WARNING),
            reraise=True,
        )
        async def download() -> ResourceTree._FileNode:
            async with (
                SEMAPHORE,
                aiohttp.ClientSession() as session,
                session.get(self.__url_formatter(el.url)) as resp,
            ):
                resp.raise_for_status()

                el.file_path.parent.mkdir(parents=True, exist_ok=True)

                with open(el.file_path, "wb") as f:
                    async for chunk in resp.content.iter_chunked(8192):
                        f.write(chunk)
                LOGGER.info(f"Downloaded resource '{res}' to '{el.file_path}'")

                if el.checksum:
                    md5 = hashlib.md5()
                    with open(el.file_path, "rb") as f:
                        md5.update(f.read())
                    if md5.hexdigest() != el.checksum:
                        raise RuntimeError(
                            f"Checksum mismatch for resource '{res}': expected {el.checksum}, got {md5.hexdigest()}"
                        )

                return el

        return await download()

    def get_resource(self, res: ResourcePath) -> _FileNode | None:
        el = self._get_element(res)
        return el

    async def download_resource(self, res: ResourcePath) -> _FileNode | None:
        el = await self._download_element(res)
        return el

    def get_resources(self, res: ResourcePath) -> list[_FileNode] | None:
        el = self._get_element(res)
        if el is None:
            return None
        if isinstance(el, ResourceTree._FileNode):
            return [el]

        resources = []
        for key, value in el.items():
            if isinstance(value, ResourceTree._FileNode):
                resources.append(value)

            else:
                sub_resources = self.get_resources(f"{res}/{key}")
                if sub_resources:
                    resources.extend(sub_resources)

        return resources

    async def download_resources(self, res: ResourcePath) -> list[_FileNode] | None:
        el = self._get_element(res)
        if el is None:
            return None
        if isinstance(el, ResourceTree._FileNode):
            downloaded = await self._download_element(res)
            return [downloaded] if downloaded else []

        tasks = []
        for key, value in el.items():
            if isinstance(value, ResourceTree._FileNode):
                tasks.append(self._download_element(value.res_id))
            else:
                tasks.append(self.download_resources(f"{res}/{key}"))

        return await asyncio.gather(*tasks)

    async def get_schema_decoded_resource[T](
        self, schema_res: ResourcePath, bin_res: ResourcePath
    ) -> T | None:
        """Get and decode a resource using its schema and binary data resources.

        See `schema_loader` module for details on decoding.

        Note: This function returns a `T`, and the caller is responsible for ensuring
        that the decoded type matches the expected type `T`.
        """

        schema_el = await self._download_element(schema_res)
        bin_el = await self._download_element(bin_res)

        if schema_el is None or bin_el is None:
            LOGGER.error(
                f"Failed to get schema or binary resource for '{schema_res}' and '{bin_res}'"
            )
            return None

        with open(schema_el.file_path, "r", encoding="utf-8") as schema_file:
            schema = yaml.load(schema_file, yaml.CFullLoader)
        with open(bin_el.file_path, "rb") as bin_file:
            bin_data = bin_file.read()

        out = schema_loader.binaryLoader.LoadFromString(schema, bin_data)
        result = schema_loader.convert.convert_to_serializable(out)

        return result


class Fsd:
    __fsd_dir: Path
    __cache: dict[str, typing.Any]

    def __init__(self, fsd_dir: Path):
        self.__fsd_dir = fsd_dir
        if not self.__fsd_dir.exists() or not self.__fsd_dir.is_dir():
            LOGGER.error(f"FSD directory '{fsd_dir}' does not exist or is not a directory.")
            raise RuntimeError(f"FSD directory '{fsd_dir}' does not exist or is not a directory.")
        LOGGER.info(f"Initialized FSD with directory '{fsd_dir}'")
        self.__cache = {}

    def get_fsd[T = dict](self, fsd_name: str) -> T | None:
        if fsd_name in self.__cache:
            return self.__cache[fsd_name]

        fsd_path = self.__fsd_dir / f"{fsd_name}.json"
        if not fsd_path.exists() or not fsd_path.is_file():
            LOGGER.error(f"FSD file '{fsd_path}' does not exist or is not a file.")
            return None

        try:
            with open(fsd_path, "r", encoding="utf-8") as f:
                fsd_data = json.load(f)
            LOGGER.info(f"Loaded FSD data from '{fsd_path}'")
            self.__cache[fsd_name] = fsd_data
            return fsd_data
        except Exception as e:
            LOGGER.error(f"Unable to load FSD data from '{fsd_path}': {e}")
            return None
