from __future__ import annotations

from enum import IntEnum
from enum import unique

from pydantic import BaseModel

from data import schema_pb2


class UniversePoint(BaseModel):
    x: float
    y: float
    z: float

    def to_pb(self) -> schema_pb2.UniversePoint:
        pb_obj = schema_pb2.UniversePoint()
        pb_obj.x = self.x
        pb_obj.y = self.y
        pb_obj.z = self.z
        return pb_obj


class Rotation(BaseModel):
    yaw: float
    pitch: float
    roll: float

    def to_pb(self) -> schema_pb2.Rotation:
        pb_obj = schema_pb2.Rotation()
        pb_obj.yaw = self.yaw
        pb_obj.pitch = self.pitch
        pb_obj.roll = self.roll
        return pb_obj


class PointRotation(BaseModel):
    x: float
    y: float
    z: float

    def to_pb(self) -> schema_pb2.PointRotation:
        pb_obj = schema_pb2.PointRotation()
        pb_obj.x = self.x
        pb_obj.y = self.y
        pb_obj.z = self.z
        return pb_obj


class WormholeClassID(IntEnum):
    ## Regular wormholes
    C1 = 1
    C2 = 2
    C3 = 3
    C4 = 4
    C5 = 5
    C6 = 6
    HIGH_SEC = 7
    LOW_SEC = 8
    NULL_SEC = 9

    ## GM regions
    GM1 = 10
    GM2 = 11

    THERA = 12
    SMALL_SHIP = 13

    ## Drifter wormholes
    SENTINEL = 14
    BARBICAN = 15
    VIDETTE = 16
    CONFLUX = 17
    REDOUBT = 18

    ## Test systems
    VOID = 19

    ## Abyssal regions
    ABYSSAL1 = 19
    ABYSSAL2 = 20
    ABYSSAL3 = 21
    ABYSSAL4 = 22
    ABYSSAL5 = 23

    POCHVEN = 25

    def get_region_type(self, region_id) -> RegionType:
        if self == WormholeClassID.HIGH_SEC:
            return RegionType.HIGH_SEC
        elif self == WormholeClassID.LOW_SEC:
            return RegionType.LOW_SEC
        elif self in {WormholeClassID.NULL_SEC, WormholeClassID.GM1, WormholeClassID.GM2}:
            return RegionType.NULL_SEC
        elif (
            self == RegionType.VOID and 14_000_000 <= region_id < 15_000_000
        ):  # a little hack for abyssal regions
            return RegionType.VOID
        elif self in {
            WormholeClassID.ABYSSAL1,
            WormholeClassID.ABYSSAL2,
            WormholeClassID.ABYSSAL3,
            WormholeClassID.ABYSSAL4,
            WormholeClassID.ABYSSAL5,
        }:
            return RegionType.ABYSSAL
        elif self == WormholeClassID.POCHVEN:
            return RegionType.POCHVEN
        else:
            return RegionType.WORMHOLE


@unique
class RegionType(IntEnum):
    HIGH_SEC = 1
    LOW_SEC = 2
    NULL_SEC = 3
    WORMHOLE = 4
    VOID = 5
    ABYSSAL = 6
    POCHVEN = 7


class CelestialAttributes(BaseModel):
    heightMap1: int
    heightMap2: int
    population: bool
    shaderPreset: int

    def to_pb(self) -> schema_pb2.CelestialAttributes:
        pb_obj = schema_pb2.CelestialAttributes()
        pb_obj.height_map1 = self.heightMap1
        pb_obj.height_map2 = self.heightMap2
        pb_obj.population = self.population
        pb_obj.shader_preset = self.shaderPreset
        return pb_obj


class CelestialStatistics(BaseModel):
    density: float
    escapeVelocity: float
    eccentricity: float
    fragmented: bool
    life: float
    locked: bool
    massDust: float
    massGas: float
    orbitPeriod: float
    orbitRadius: float
    pressure: float
    radius: float
    rotationRate: float
    surfaceGravity: float
    temperature: float
    spectralClass: str

    def to_pb(self) -> schema_pb2.CelestialStatistics:
        pb_obj = schema_pb2.CelestialStatistics()
        pb_obj.density = self.density
        pb_obj.escape_velocity = self.escapeVelocity
        pb_obj.eccentricity = self.eccentricity
        pb_obj.fragmented = self.fragmented
        pb_obj.life = self.life
        pb_obj.locked = self.locked
        pb_obj.mass_dust = self.massDust
        pb_obj.mass_gas = self.massGas
        pb_obj.orbit_period = self.orbitPeriod
        pb_obj.orbit_radius = self.orbitRadius
        pb_obj.pressure = self.pressure
        pb_obj.radius = self.radius
        pb_obj.rotation_rate = self.rotationRate
        pb_obj.surface_gravity = self.surfaceGravity
        pb_obj.temperature = self.temperature
        pb_obj.spectral_class = self.spectralClass
        return pb_obj
