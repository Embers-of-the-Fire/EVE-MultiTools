from __future__ import annotations

import sqlite3

from dataclasses import dataclass
from typing import TYPE_CHECKING

from pydantic import BaseModel
from pydantic import Field

from data import schema_loader
from data import schema_pb2
from data.bundle_generate.consts import SOLAR_SYSTEM_CONTENT_RES
from data.bundle_generate.log import LOGGER
from data.bundle_generate.universe._type import CelestialAttributes  # noqa: TC001
from data.bundle_generate.universe._type import CelestialStatistics  # noqa: TC001
from data.bundle_generate.universe._type import PointRotation  # noqa: TC001
from data.bundle_generate.universe._type import Rotation  # noqa: TC001
from data.bundle_generate.universe._type import UniversePoint  # noqa: TC001
from data.bundle_generate.universe._type import WormholeClassID  # noqa: TC001


if TYPE_CHECKING:
    from pathlib import Path

    from data.bundle_generate.resources import ResourceTree


class SolarSystem(BaseModel):
    solarSystemID: int
    solarSystemNameID: int
    fringe: bool
    hub: bool
    international: bool
    regional: bool
    border: bool
    corridor: bool
    luminosity: float
    center: UniversePoint
    max: UniversePoint
    min: UniversePoint
    radius: float
    security: float
    descriptionID: int | None = Field(default=None)
    planets: dict[int, Planet] = Field(default_factory=dict)
    wormholeClassID: WormholeClassID | None = Field(default=None)
    secondarySun: SecondarySun | None = Field(default=None)
    securityClass: str = Field(default="")
    factionID: int | None = Field(default=None)
    sunTypeID: int | None = Field(default=None)
    sunFlareGraphicID: int | None = Field(default=None)
    star: Star | None = Field(default=None)
    stargates: dict[int, Stargate] = Field(default_factory=dict)
    disruptedStargates: dict[int, DisruptedStargate] = Field(default_factory=dict)
    warpTunnelOverwrite: int = Field(default=0)
    systemWideCloud: int = Field(default=0)
    visualEffect: str = Field(default="")
    disallowedAnchorGroups: list[int] = Field(default_factory=list)
    disallowedAnchorCategories: list[int] = Field(default_factory=list)
    disallowScanning: bool | None = Field(default=None)
    disallowCyno: bool | None = Field(default=None)


class Planet(BaseModel):
    celestialIndex: int
    planetAttributes: CelestialAttributes
    position: UniversePoint
    radius: int
    typeID: int
    solarSystemID: int
    planetNameID: int | None = Field(default=None)
    statistics: CelestialStatistics
    moons: dict[int, Moon] = Field(default_factory=dict)
    npcStations: dict[int, NpcStation] = Field(default_factory=dict)
    asteroidBelts: dict[int, AsteroidBelt] = Field(default_factory=dict)


class Moon(BaseModel):
    typeID: int
    planetAttributes: CelestialAttributes
    position: UniversePoint
    radius: float
    orbitID: int
    moonNameID: int | None = Field(default=None)
    npcStations: dict[int, NpcStation] = Field(default_factory=dict)
    statistics: CelestialStatistics | None = Field(default=None)
    asteroidBelts: dict[int, AsteroidBelt] = Field(default_factory=dict)

    class MiningBeacon(BaseModel):
        position: UniversePoint

    miningBeacon: MiningBeacon | None = Field(default=None)

    environmentTemplateID: int | None = Field(default=None)


class NpcStation(BaseModel):
    isConquerable: bool
    operationID: int
    ownerID: int
    position: UniversePoint
    reprocessingEfficiency: float
    reprocessingHangarFlag: int
    reprocessingStationsTake: float
    typeID: int
    useOperationName: bool
    orbitID: int
    graphicID: int
    solarSystemID: int
    rotation: Rotation | None = Field(default=None)
    stationName: str
    ignoredByCorporationDefenseDjinn: bool = Field(default=False)


class AsteroidBelt(BaseModel):
    typeID: int
    asteroidBeltNameID: int | None = Field(default=None)
    statistics: CelestialStatistics | None = Field(default=None)


class SecondarySun(BaseModel):
    itemID: int
    typeID: int
    effectBeaconTypeID: int
    position: UniversePoint


class Star(BaseModel):
    id: int
    radius: int
    typeID: int

    class StarStatistics(BaseModel):
        age: float
        life: float
        locked: bool
        luminosity: float
        radius: float
        temperature: float
        spectralClass: str

        def to_pb(self):
            pb_obj = schema_pb2.Star.StarStatistics()
            pb_obj.age = self.age
            pb_obj.life = self.life
            pb_obj.locked = self.locked
            pb_obj.luminosity = self.luminosity
            pb_obj.radius = self.radius
            pb_obj.temperature = self.temperature
            pb_obj.spectral_class = self.spectralClass
            return pb_obj

    statistics: StarStatistics | None = Field(default=None)

    npcStations: dict[int, NpcStation] = Field(default_factory=dict)


class Stargate(BaseModel):
    destination: int
    position: UniversePoint
    typeID: int
    rotation: Rotation | None = Field(default=None)
    ignoredByCorporationDefenseDjinn: bool = Field(default=False)
    allowedShipsTypeListID: int | None = Field(default=None)


class DisruptedStargate(BaseModel):
    typeID: int
    targetSolarSystemID: int
    position: UniversePoint
    rotation: PointRotation


@dataclass
class NpcStationPosition:
    solarSystemID: int
    starID: int | None = None
    planetID: int | None = None
    moonID: int | None = None


@dataclass
class AsteroidBeltPosition:
    planetID: int | None = None
    moonID: int | None = None


@dataclass
class MoonExtraInfo:
    solarSystemID: int
    planetID: int
    celestialIndex: int


type SystemRegistry = dict[int, SolarSystem]
type PlanetRegistry = dict[int, Planet]
type MoonRegistry = dict[int, tuple[Moon, MoonExtraInfo]]
type NpcStationRegistry = dict[int, tuple[NpcStation, NpcStationPosition]]
type AsteroidBeltRegistry = dict[int, tuple[AsteroidBelt, AsteroidBeltPosition]]
# stargate, system id
type StargateRegistry = dict[int, tuple[Stargate, int]]
# disrupted stargate, system id
type DisruptedStargateRegistry = dict[int, tuple[DisruptedStargate, int]]
# secondary sun, system id
type SecondarySunRegistry = dict[int, tuple[SecondarySun, int]]
# star, system id
type StarRegistry = dict[int, tuple[Star, int]]


async def collect_system_contents(index: ResourceTree, root: Path, loc_root: Path):
    system_content_file = await index.download_resource(SOLAR_SYSTEM_CONTENT_RES)
    system_contents = schema_loader.binaryLoader.LoadFSDDataInPython(system_content_file.file_path)

    systems: SystemRegistry = {}
    planets: PlanetRegistry = {}
    moons: MoonRegistry = {}
    npc_stations: NpcStationRegistry = {}
    asteroid_belts: AsteroidBeltRegistry = {}
    stargates: StargateRegistry = {}
    disrupted_stargates: DisruptedStargateRegistry = {}
    secondary_suns: SecondarySunRegistry = {}
    stars: StarRegistry = {}

    for system_id, system_content in system_contents.items():
        system_def = SolarSystem(**schema_loader.convert.convert_to_serializable(system_content))
        planets.update(system_def.planets)
        if system_def.secondarySun is not None:
            secondary_suns[system_def.secondarySun.itemID] = [system_def.secondarySun, system_id]
        if system_def.star is not None:
            stars[system_def.star.id] = [system_def.star, system_id]
        stargates.update({k: [v, system_id] for k, v in system_def.stargates.items()})
        disrupted_stargates.update(
            {k: [v, system_id] for k, v in system_def.disruptedStargates.items()}
        )
        systems[system_def.solarSystemID] = system_def

    for planet_id, planet in planets.items():
        celestial_counter = 0
        previous_orbit_id = -1
        for moon_id, moon in sorted(planet.moons.items(), key=lambda item: item[0]):
            if moon.orbitID != previous_orbit_id:
                celestial_counter = 0
                previous_orbit_id = moon.orbitID
            celestial_counter += 1
            moons[moon_id] = (
                moon,
                MoonExtraInfo(
                    planetID=planet_id,
                    celestialIndex=celestial_counter,
                    solarSystemID=planet.solarSystemID,
                ),
            )

        npc_stations.update(
            {
                k: [v, NpcStationPosition(solarSystemID=planet.solarSystemID, planetID=planet_id)]
                for k, v in planet.npcStations.items()
            }
        )
        asteroid_belts.update(
            {
                k: [v, AsteroidBeltPosition(planetID=planet_id)]
                for k, v in planet.asteroidBelts.items()
            }
        )

    for moon_id, (moon, moon_extra) in moons.items():
        npc_stations.update(
            {
                k: [v, NpcStationPosition(solarSystemID=moon_extra.solarSystemID, moonID=moon_id)]
                for k, v in moon.npcStations.items()
            }
        )
        asteroid_belts.update(
            {k: [v, AsteroidBeltPosition(moonID=moon_id)] for k, v in moon.asteroidBelts.items()}
        )

    for star_id, (star, system_id) in stars.items():
        npc_stations.update(
            {
                k: [v, NpcStationPosition(solarSystemID=system_id, starID=star_id)]
                for k, v in star.npcStations.items()
            }
        )

    solar_system_db = root / "solar_system.db"
    with sqlite3.connect(solar_system_db) as conn:
        _collect_solar_systems(solar_system_db, conn, systems)
        _collect_planets(solar_system_db, conn, planets)
        _collect_moons(solar_system_db, conn, moons)
        _collect_npc_stations(solar_system_db, conn, npc_stations)
        _collect_asteroid_belts(solar_system_db, conn, asteroid_belts)
        _collect_secondary_suns(solar_system_db, conn, secondary_suns)
        _collect_stars(solar_system_db, conn, stars)
        _collect_stargates(solar_system_db, conn, stargates)
        _collect_disrupted_stargates(solar_system_db, conn, disrupted_stargates)
        conn.commit()

    LOGGER.info(f"Collected {len(systems)} solar systems into {solar_system_db}")


def _collect_solar_systems(db_path: Path, conn: sqlite3.Connection, solar_systems: SystemRegistry):
    cursor = conn.cursor()
    cursor.execute("SELECT name from sqlite_master WHERE type='table' AND name='solar_systems'")
    if cursor.fetchone() is not None:
        LOGGER.warning(f"Table 'solar_systems' already exists in {db_path}. Overwriting.")
        cursor.execute("DROP TABLE solar_systems")

    cursor.executescript(
        """
        CREATE TABLE IF NOT EXISTS solar_systems (
            solar_system_id INTEGER PRIMARY KEY NOT NULL,
            data BLOB NOT NULL
        );
        """
    )

    for _, solar_system_def in solar_systems.items():
        pb_obj = schema_pb2.SolarSystem()
        pb_obj.solar_system_id = solar_system_def.solarSystemID
        pb_obj.solar_system_name_id = solar_system_def.solarSystemNameID
        pb_obj.fringe = solar_system_def.fringe
        pb_obj.hub = solar_system_def.hub
        pb_obj.international = solar_system_def.international
        pb_obj.regional = solar_system_def.regional
        pb_obj.border = solar_system_def.border
        pb_obj.corridor = solar_system_def.corridor
        pb_obj.luminosity = solar_system_def.luminosity
        pb_obj.position.CopyFrom(solar_system_def.center.to_pb())
        pb_obj.max.CopyFrom(solar_system_def.max.to_pb())
        pb_obj.min.CopyFrom(solar_system_def.min.to_pb())
        pb_obj.radius = solar_system_def.radius
        pb_obj.security = solar_system_def.security
        if solar_system_def.descriptionID is not None:
            pb_obj.description_id = solar_system_def.descriptionID
        pb_obj.planets.extend(solar_system_def.planets.keys())
        if solar_system_def.wormholeClassID is not None:
            pb_obj.wormhole_class_id = solar_system_def.wormholeClassID.value
        if solar_system_def.secondarySun is not None:
            pb_obj.secondary_sun = solar_system_def.secondarySun.itemID
        if solar_system_def.factionID is not None:
            pb_obj.faction_id = solar_system_def.factionID
        if solar_system_def.sunTypeID is not None:
            pb_obj.sun_type_id = solar_system_def.sunTypeID
        if solar_system_def.sunFlareGraphicID is not None:
            pb_obj.sun_flare_graphic_id = solar_system_def.sunFlareGraphicID
        if solar_system_def.star is not None:
            pb_obj.star = solar_system_def.star.id
        pb_obj.stargates.extend(solar_system_def.stargates.keys())
        pb_obj.disrupted_stargates.extend(solar_system_def.disruptedStargates.keys())
        pb_obj.warp_tunnel_overwrite = solar_system_def.warpTunnelOverwrite
        pb_obj.system_wide_cloud = solar_system_def.systemWideCloud
        pb_obj.visual_effect = solar_system_def.visualEffect
        pb_obj.disallowed_anchor_groups.extend(solar_system_def.disallowedAnchorGroups)
        pb_obj.disallowed_anchor_categories.extend(solar_system_def.disallowedAnchorCategories)
        if solar_system_def.disallowScanning is not None:
            pb_obj.disallow_scanning = solar_system_def.disallowScanning
        if solar_system_def.disallowCyno is not None:
            pb_obj.disallow_cyno = solar_system_def.disallowCyno

        blob = pb_obj.SerializeToString()
        cursor.execute(
            """
            INSERT INTO solar_systems (
                solar_system_id,
                data
            ) VALUES (?, ?)
            """,
            (solar_system_def.solarSystemID, blob),
        )

    conn.commit()


def _collect_planets(db_path: Path, conn: sqlite3.Connection, planets: SystemRegistry):
    cursor = conn.cursor()
    cursor.execute("SELECT name from sqlite_master WHERE type='table' AND name='planets'")
    if cursor.fetchone() is not None:
        LOGGER.warning(f"Table 'planets' already exists in {db_path}. Overwriting.")
        cursor.execute("DROP TABLE planets")

    cursor.executescript(
        """
        CREATE TABLE IF NOT EXISTS planets (
            planet_id INTEGER PRIMARY KEY NOT NULL,
            celestial_index INTEGER NOT NULL,
            planet_name_id INTEGER,
            type_id INTEGER NOT NULL,
            system_id INTEGER NOT NULL,
            data BLOB NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_planet_type_id ON planets (type_id);
        """
    )

    for planet_id, planet_def in planets.items():
        pb_obj = schema_pb2.Planet()
        pb_obj.planet_id = planet_id
        pb_obj.celestial_index = planet_def.celestialIndex
        pb_obj.attributes.CopyFrom(planet_def.planetAttributes.to_pb())
        pb_obj.position.CopyFrom(planet_def.position.to_pb())
        pb_obj.radius = planet_def.radius
        pb_obj.type_id = planet_def.typeID
        pb_obj.solar_system_id = planet_def.solarSystemID
        if planet_def.planetNameID is not None:
            pb_obj.planet_name_id = planet_def.planetNameID
        pb_obj.statistics.CopyFrom(planet_def.statistics.to_pb())
        pb_obj.moons.extend(planet_def.moons.keys())
        pb_obj.npc_stations.extend(planet_def.npcStations.keys())
        pb_obj.asteroid_belts.extend(planet_def.asteroidBelts.keys())

        blob = pb_obj.SerializeToString()
        cursor.execute(
            """
            INSERT INTO planets (
                planet_id,
                celestial_index,
                planet_name_id,
                type_id,
                system_id,
                data
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                planet_id,
                planet_def.celestialIndex,
                planet_def.planetNameID,
                planet_def.typeID,
                planet_def.solarSystemID,
                blob,
            ),
        )

    conn.commit()


def _collect_secondary_suns(
    db_path: Path, conn: sqlite3.Connection, secondary_suns: SecondarySunRegistry
):
    cursor = conn.cursor()
    cursor.execute("SELECT name from sqlite_master WHERE type='table' AND name='secondary_suns'")
    if cursor.fetchone() is not None:
        LOGGER.warning(f"Table 'secondary_suns' already exists in {db_path}. Overwriting.")
        cursor.execute("DROP TABLE secondary_suns")

    cursor.executescript(
        """
        CREATE TABLE IF NOT EXISTS secondary_suns (
            sun_id INTEGER PRIMARY KEY NOT NULL,
            type_id INTEGER NOT NULL,
            system_id INTEGER NOT NULL,
            data BLOB NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_secondary_sun_type_id ON secondary_suns (type_id);
        """
    )

    for _, (secondary_sun_def, system_id) in secondary_suns.items():
        pb_obj = schema_pb2.SecondarySun()
        pb_obj.sun_id = secondary_sun_def.itemID
        pb_obj.type_id = secondary_sun_def.typeID
        pb_obj.effect_beacon_type_id = secondary_sun_def.effectBeaconTypeID
        pb_obj.position.CopyFrom(secondary_sun_def.position.to_pb())
        pb_obj.system_id = system_id

        blob = pb_obj.SerializeToString()
        cursor.execute(
            """
            INSERT INTO secondary_suns (
                sun_id,
                type_id,
                system_id,
                data
            ) VALUES (?, ?, ?, ?)
            """,
            (
                secondary_sun_def.itemID,
                secondary_sun_def.typeID,
                system_id,
                blob,
            ),
        )

    conn.commit()


def _collect_stars(db_path: Path, conn: sqlite3.Connection, stars: StarRegistry):
    cursor = conn.cursor()
    cursor.execute("SELECT name from sqlite_master WHERE type='table' AND name='stars'")
    if cursor.fetchone() is not None:
        LOGGER.warning(f"Table 'stars' already exists in {db_path}. Overwriting.")
        cursor.execute("DROP TABLE stars")

    cursor.executescript(
        """
        CREATE TABLE IF NOT EXISTS stars (
            star_id INTEGER PRIMARY KEY NOT NULL,
            type_id INTEGER NOT NULL,
            system_id INTEGER NOT NULL,
            data BLOB NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_star_type_id ON stars (type_id);
        """
    )

    for _, (star_def, system_id) in stars.items():
        pb_obj = schema_pb2.Star()
        pb_obj.star_id = star_def.id
        pb_obj.radius = star_def.radius
        pb_obj.type_id = star_def.typeID
        if star_def.statistics is not None:
            pb_obj.statistics.CopyFrom(star_def.statistics.to_pb())
        pb_obj.npc_stations.extend(star_def.npcStations.keys())
        pb_obj.system_id = star_def.id

        blob = pb_obj.SerializeToString()
        cursor.execute(
            """
            INSERT INTO stars (
                star_id,
                type_id,
                system_id,
                data
            ) VALUES (?, ?, ?, ?)
            """,
            (
                star_def.id,
                star_def.typeID,
                system_id,
                blob,
            ),
        )


def _collect_stargates(db_path: Path, conn: sqlite3.Connection, stargates: StargateRegistry):
    cursor = conn.cursor()
    cursor.execute("SELECT name from sqlite_master WHERE type='table' AND name='stargates'")
    if cursor.fetchone() is not None:
        LOGGER.warning(f"Table 'stargates' already exists in {db_path}. Overwriting.")
        cursor.execute("DROP TABLE stargates")

    cursor.executescript(
        """
        CREATE TABLE IF NOT EXISTS stargates (
            stargate_id INTEGER PRIMARY KEY NOT NULL,
            destination INTEGER NOT NULL,
            system_id INTEGER NOT NULL,
            destination_system_id INTEGER NOT NULL,
            type_id INTEGER NOT NULL,
            data BLOB NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_stargate_type_id ON stargates (type_id);
        CREATE INDEX IF NOT EXISTS idx_stargate_destination ON stargates (destination);
        """
    )

    for stargate_id, (stargate_def, system_id) in stargates.items():
        pb_obj = schema_pb2.Stargate()
        pb_obj.stargate_id = stargate_id
        pb_obj.destination = stargate_def.destination
        pb_obj.position.CopyFrom(stargate_def.position.to_pb())
        if stargate_def.rotation is not None:
            pb_obj.rotation.CopyFrom(stargate_def.rotation.to_pb())
        pb_obj.type_id = stargate_def.typeID
        if stargate_def.rotation is not None:
            pb_obj.rotation.CopyFrom(stargate_def.rotation.to_pb())
        pb_obj.ignored_by_corporation_defense_djinn = stargate_def.ignoredByCorporationDefenseDjinn
        if stargate_def.allowedShipsTypeListID is not None:
            pb_obj.allowed_ships_type_list_id = stargate_def.allowedShipsTypeListID
        pb_obj.system_id = system_id
        destination_system_id = stargates[stargate_def.destination][1]
        pb_obj.destination_system_id = destination_system_id

        blob = pb_obj.SerializeToString()
        cursor.execute(
            """
            INSERT INTO stargates (
                stargate_id,
                destination,
                system_id,
                destination_system_id,
                type_id,
                data
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                stargate_id,
                stargate_def.destination,
                system_id,
                destination_system_id,
                stargate_def.typeID,
                blob,
            ),
        )

    conn.commit()


def _collect_disrupted_stargates(
    db_path: Path, conn: sqlite3.Connection, disrupted_stargates: DisruptedStargateRegistry
):
    cursor = conn.cursor()
    cursor.execute(
        "SELECT name from sqlite_master WHERE type='table' AND name='disrupted_stargates'"
    )
    if cursor.fetchone() is not None:
        LOGGER.warning(f"Table 'disrupted_stargates' already exists in {db_path}. Overwriting.")
        cursor.execute("DROP TABLE disrupted_stargates")

    cursor.executescript(
        """
        CREATE TABLE IF NOT EXISTS disrupted_stargates (
            stargate_id INTEGER PRIMARY KEY NOT NULL,
            target_solar_system_id INTEGER NOT NULL,
            type_id INTEGER NOT NULL,
            system_id INTEGER NOT NULL,
            data BLOB NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_disrupted_stargate_type_id ON disrupted_stargates (type_id);
        CREATE INDEX IF NOT EXISTS idx_disrupted_stargate_target_solar_system_id ON disrupted_stargates (target_solar_system_id);
        """
    )

    for disrupted_stargate_id, (disrupted_stargate_def, system_id) in disrupted_stargates.items():
        pb_obj = schema_pb2.DisruptedStargate()
        pb_obj.stargate_id = disrupted_stargate_id
        pb_obj.type_id = disrupted_stargate_def.typeID
        pb_obj.system_id = system_id
        pb_obj.target_solar_system_id = disrupted_stargate_def.targetSolarSystemID
        pb_obj.position.CopyFrom(disrupted_stargate_def.position.to_pb())
        pb_obj.rotation.CopyFrom(disrupted_stargate_def.rotation.to_pb())

        blob = pb_obj.SerializeToString()
        cursor.execute(
            """
            INSERT INTO disrupted_stargates (
                stargate_id,
                target_solar_system_id,
                type_id,
                system_id,
                data
            ) VALUES (?, ?, ?, ?, ?)
            """,
            (
                disrupted_stargate_id,
                disrupted_stargate_def.targetSolarSystemID,
                disrupted_stargate_def.typeID,
                system_id,
                blob,
            ),
        )

    conn.commit()


def _collect_moons(db_path: Path, conn: sqlite3.Connection, moons: MoonRegistry):
    cursor = conn.cursor()
    cursor.execute("SELECT name from sqlite_master WHERE type='table' AND name='moons'")
    if cursor.fetchone() is not None:
        LOGGER.warning(f"Table 'moons' already exists in {db_path}. Overwriting.")
        cursor.execute("DROP TABLE moons")

    cursor.executescript(
        """
        CREATE TABLE IF NOT EXISTS moons (
            moon_id INTEGER PRIMARY KEY NOT NULL,
            moon_name_id INTEGER,
            type_id INTEGER NOT NULL,
            planet_id INTEGER NOT NULL,
            celestial_index INTEGER NOT NULL,
            data BLOB NOT NULL
        );
        """
    )

    for moon_id, (moon_def, info) in moons.items():
        pb_obj = schema_pb2.Moon()
        pb_obj.moon_id = moon_id
        pb_obj.type_id = moon_def.typeID
        pb_obj.attributes.CopyFrom(moon_def.planetAttributes.to_pb())
        pb_obj.position.CopyFrom(moon_def.position.to_pb())
        pb_obj.radius = moon_def.radius
        pb_obj.orbit_id = moon_def.orbitID
        if moon_def.moonNameID is not None:
            pb_obj.moon_name_id = moon_def.moonNameID
        if moon_def.statistics is not None:
            pb_obj.statistics.CopyFrom(moon_def.statistics.to_pb())
        pb_obj.npc_stations.extend(moon_def.npcStations.keys())
        pb_obj.asteroid_belts.extend(moon_def.asteroidBelts.keys())
        if moon_def.miningBeacon is not None:
            pb_obj.mining_beacon.position.CopyFrom(moon_def.miningBeacon.position.to_pb())
        if moon_def.environmentTemplateID is not None:
            pb_obj.environment_template_id = moon_def.environmentTemplateID
        pb_obj.planet_id = info.planetID
        pb_obj.celestial_index = info.celestialIndex

        blob = pb_obj.SerializeToString()
        cursor.execute(
            """
            INSERT INTO moons (
                moon_id,
                moon_name_id,
                type_id,
                planet_id,
                celestial_index,
                data
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                moon_id,
                moon_def.moonNameID,
                moon_def.typeID,
                info.planetID,
                info.celestialIndex,
                blob,
            ),
        )

    conn.commit()


def _collect_npc_stations(
    db_path: Path, conn: sqlite3.Connection, npc_stations: NpcStationRegistry
):
    cursor = conn.cursor()
    cursor.execute("SELECT name from sqlite_master WHERE type='table' AND name='npc_stations'")
    if cursor.fetchone() is not None:
        LOGGER.warning(f"Table 'npc_stations' already exists in {db_path}. Overwriting.")
        cursor.execute("DROP TABLE npc_stations")

    cursor.executescript(
        """
        CREATE TABLE IF NOT EXISTS npc_stations (
            station_id INTEGER PRIMARY KEY NOT NULL,
            operation_id INTEGER NOT NULL,
            owner_id INTEGER NOT NULL,
            type_id INTEGER NOT NULL,
            system_id INTEGER NOT NULL,
            moon_id INTEGER,
            planet_id INTEGER,
            star_id INTEGER,
            data BLOB NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_npc_station_type_id ON npc_stations (type_id);
        CREATE INDEX IF NOT EXISTS idx_npc_station_operation_id ON npc_stations (operation_id);
        CREATE INDEX IF NOT EXISTS idx_npc_station_owner_id ON npc_stations (owner_id);
        """
    )

    for station_id, (npc_station_def, station_pos) in npc_stations.items():
        pb_obj = schema_pb2.NpcStation()
        pb_obj.station_id = station_id
        pb_obj.is_conquerable = npc_station_def.isConquerable
        pb_obj.operation_id = npc_station_def.operationID
        pb_obj.owner_id = npc_station_def.ownerID
        pb_obj.position.CopyFrom(npc_station_def.position.to_pb())
        pb_obj.reprocessing_efficiency = npc_station_def.reprocessingEfficiency
        pb_obj.reprocessing_hangar_flag = npc_station_def.reprocessingHangarFlag
        pb_obj.reprocessing_stations_take = npc_station_def.reprocessingStationsTake
        pb_obj.type_id = npc_station_def.typeID
        pb_obj.use_operation_name = npc_station_def.useOperationName
        pb_obj.orbit_id = npc_station_def.orbitID
        pb_obj.graphic_id = npc_station_def.graphicID
        pb_obj.solar_system_id = station_pos.solarSystemID
        if npc_station_def.rotation is not None:
            pb_obj.rotation.CopyFrom(npc_station_def.rotation.to_pb())
        pb_obj.station_name = npc_station_def.stationName
        pb_obj.ignored_by_corporation_defense_djinn = (
            npc_station_def.ignoredByCorporationDefenseDjinn
        )

        if station_pos.starID is not None:
            pb_obj.star_id = station_pos.starID
        elif station_pos.planetID is not None:
            pb_obj.planet_id = station_pos.planetID
        elif station_pos.moonID is not None:
            pb_obj.moon_id = station_pos.moonID

        blob = pb_obj.SerializeToString()
        cursor.execute(
            """
            INSERT INTO npc_stations (
                station_id,
                operation_id,
                owner_id,
                type_id,
                system_id,
                moon_id,
                planet_id,
                star_id,
                data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                station_id,
                npc_station_def.operationID,
                npc_station_def.ownerID,
                npc_station_def.typeID,
                station_pos.solarSystemID,
                station_pos.moonID,
                station_pos.planetID,
                station_pos.starID,
                blob,
            ),
        )

    conn.commit()


def _collect_asteroid_belts(
    db_path: Path, conn: sqlite3.Connection, asteroid_belts: AsteroidBeltRegistry
):
    cursor = conn.cursor()
    cursor.execute("SELECT name from sqlite_master WHERE type='table' AND name='asteroid_belts'")
    if cursor.fetchone() is not None:
        LOGGER.warning(f"Table 'asteroid_belts' already exists in {db_path}. Overwriting.")
        cursor.execute("DROP TABLE asteroid_belts")

    cursor.executescript(
        """
        CREATE TABLE IF NOT EXISTS asteroid_belts (
            belt_id INTEGER PRIMARY KEY NOT NULL,
            type_id INTEGER NOT NULL,
            asteroid_belt_name_id INTEGER,
            planet_id INTEGER,
            moon_id INTEGER,
            data BLOB NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_asteroid_belt_type_id ON asteroid_belts (type_id);
        """
    )

    for belt_id, (asteroid_belt_def, belt_pos) in asteroid_belts.items():
        pb_obj = schema_pb2.AsteroidBelt()
        pb_obj.asteroid_belt_id = belt_id
        pb_obj.type_id = asteroid_belt_def.typeID
        if asteroid_belt_def.asteroidBeltNameID is not None:
            pb_obj.asteroid_belt_name_id = asteroid_belt_def.asteroidBeltNameID
        if asteroid_belt_def.statistics is not None:
            pb_obj.statistics.CopyFrom(asteroid_belt_def.statistics.to_pb())

        blob = pb_obj.SerializeToString()
        cursor.execute(
            """
            INSERT INTO asteroid_belts (
                belt_id,
                type_id,
                asteroid_belt_name_id,
                planet_id,
                moon_id,
                data
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                belt_id,
                asteroid_belt_def.typeID,
                asteroid_belt_def.asteroidBeltNameID,
                belt_pos.planetID,
                belt_pos.moonID,
                blob,
            ),
        )

    conn.commit()
