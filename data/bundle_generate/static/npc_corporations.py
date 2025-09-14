from __future__ import annotations

import sqlite3

from enum import StrEnum
from enum import unique
from typing import TYPE_CHECKING

from pydantic import BaseModel
from pydantic import Field
from pydantic import ValidationError

from data import schema_pb2
from data.bundle_generate.log import LOGGER
from data.bundle_generate.types import BoolInt  # noqa: TC001


if TYPE_CHECKING:
    from pathlib import Path

    from data.bundle_generate.resources import Fsd


class _NpcCorporation(BaseModel):
    allowedMemberRaces: list[int] = Field(default_factory=list)
    ceoID: int | None = Field(default=None)
    corporationTrades: dict[int, float] = Field(default_factory=dict)
    deleted: BoolInt
    descriptionID: int | None = Field(default=None)

    class Division(BaseModel):
        divisionNumber: int
        leaderID: int
        size: int

    divisions: dict[int, Division] = Field(default_factory=dict)

    enemyID: int | None = Field(default=None)

    @unique
    class Extent(StrEnum):
        EXT_C = "C"
        EXT_G = "G"
        EXT_L = "L"
        EXT_N = "N"
        EXT_R = "R"

        def to_pb(self) -> schema_pb2.NpcCorporation.Extent:
            mapping = {
                _NpcCorporation.Extent.EXT_C: schema_pb2.NpcCorporation.Extent.EXT_C,
                _NpcCorporation.Extent.EXT_G: schema_pb2.NpcCorporation.Extent.EXT_G,
                _NpcCorporation.Extent.EXT_L: schema_pb2.NpcCorporation.Extent.EXT_L,
                _NpcCorporation.Extent.EXT_N: schema_pb2.NpcCorporation.Extent.EXT_N,
                _NpcCorporation.Extent.EXT_R: schema_pb2.NpcCorporation.Extent.EXT_R,
            }
            return mapping[self]

    extent: Extent

    factionID: int | None = Field(default=None)
    friendID: int | None = Field(default=None)
    hasPlayerPersonnelManager: BoolInt
    iconID: int | None = Field(default=None)
    initialPrice: float
    investors: dict[int, int] = Field(default_factory=dict)
    lpOfferTables: list[int] = Field(default_factory=list)
    mainActivityID: int | None = Field(default=None)
    minSecurity: float
    minimumJoinStanding: BoolInt
    nameID: int
    publicShares: int
    raceID: int | None = Field(default=None)
    secondaryActivityID: int | None = Field(default=None)
    sendCharTerminationMessage: BoolInt
    shares: int

    @unique
    class Size(StrEnum):
        SIZE_H = "H"
        SIZE_L = "L"
        SIZE_M = "M"
        SIZE_S = "S"
        SIZE_T = "T"

        def to_pb(self) -> schema_pb2.NpcCorporation.Size:
            mapping = {
                _NpcCorporation.Size.SIZE_H: schema_pb2.NpcCorporation.Size.SIZE_H,
                _NpcCorporation.Size.SIZE_L: schema_pb2.NpcCorporation.Size.SIZE_L,
                _NpcCorporation.Size.SIZE_M: schema_pb2.NpcCorporation.Size.SIZE_M,
                _NpcCorporation.Size.SIZE_S: schema_pb2.NpcCorporation.Size.SIZE_S,
                _NpcCorporation.Size.SIZE_T: schema_pb2.NpcCorporation.Size.SIZE_T,
            }
            return mapping[self]

    size: Size

    sizeFactor: float | None = Field(default=None)
    solarSystemID: int | None = Field(default=None)
    stationID: int | None = Field(default=None)
    taxRate: float
    tickerName: str
    uniqueName: BoolInt


def _pydantic_to_protobuf_npc_corporation(
    pydantic_obj: _NpcCorporation, corp_id: int
) -> schema_pb2.NpcCorporation:
    pb_obj = schema_pb2.NpcCorporation()
    pb_obj.corporation_id = corp_id
    pb_obj.allowed_member_races.extend(pydantic_obj.allowedMemberRaces)
    if pydantic_obj.ceoID is not None:
        pb_obj.ceo_id = pydantic_obj.ceoID
    pb_obj.corporation_trades.update(pydantic_obj.corporationTrades)
    pb_obj.deleted = pydantic_obj.deleted
    if pydantic_obj.descriptionID is not None:
        pb_obj.description_id = pydantic_obj.descriptionID

    for div_id, div_d in pydantic_obj.divisions.items():
        division_entry = pb_obj.divisions.add()
        division_entry.division_id = div_id
        division_entry.leader_id = div_d.leaderID
        division_entry.size = div_d.size
        division_entry.division_number = div_d.divisionNumber

    if pydantic_obj.enemyID is not None:
        pb_obj.enemy_id = pydantic_obj.enemyID

    pb_obj.extent = pydantic_obj.extent.to_pb()

    if pydantic_obj.factionID is not None:
        pb_obj.faction_id = pydantic_obj.factionID
    if pydantic_obj.friendID is not None:
        pb_obj.friend_id = pydantic_obj.friendID
    pb_obj.has_player_personnel_manager = pydantic_obj.hasPlayerPersonnelManager
    if pydantic_obj.iconID is not None:
        pb_obj.icon_id = pydantic_obj.iconID
    pb_obj.initial_price = pydantic_obj.initialPrice
    pb_obj.investors.update(pydantic_obj.investors)
    pb_obj.lp_offer_tables.extend(pydantic_obj.lpOfferTables)
    if pydantic_obj.mainActivityID is not None:
        pb_obj.main_activity_id = pydantic_obj.mainActivityID
    pb_obj.min_security = pydantic_obj.minSecurity
    pb_obj.minimum_join_standing = pydantic_obj.minimumJoinStanding
    pb_obj.name_id = pydantic_obj.nameID
    pb_obj.public_shares = pydantic_obj.publicShares
    if pydantic_obj.raceID is not None:
        pb_obj.race_id = pydantic_obj.raceID
    if pydantic_obj.secondaryActivityID is not None:
        pb_obj.secondary_activity_id = pydantic_obj.secondaryActivityID
    pb_obj.send_char_termination_message = pydantic_obj.sendCharTerminationMessage
    pb_obj.shares = pydantic_obj.shares
    pb_obj.size = pydantic_obj.size.to_pb()
    if pydantic_obj.sizeFactor is not None:
        pb_obj.size_factor = pydantic_obj.sizeFactor
    if pydantic_obj.solarSystemID is not None:
        pb_obj.solar_system_id = pydantic_obj.solarSystemID
    if pydantic_obj.stationID is not None:
        pb_obj.station_id = pydantic_obj.stationID
    pb_obj.tax_rate = pydantic_obj.taxRate
    pb_obj.ticker_name = pydantic_obj.tickerName
    pb_obj.unique_name = pydantic_obj.uniqueName
    return pb_obj


def collect_npc_corporations(fsd: Fsd, bundle_static: Path, loc_root: Path):
    npc_corporations = fsd.get_fsd("npccorporations")
    if npc_corporations is None:
        return

    npc_corporation_db = bundle_static / "npc_corporations.db"
    npc_loc_lookup = schema_pb2.NpcCorporationLocalizationLookup()
    if npc_corporation_db.exists():
        LOGGER.warning(f"NPC corporations file '{npc_corporation_db}' already exists. Overwriting.")
        npc_corporation_db.unlink()

    with sqlite3.connect(npc_corporation_db) as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE npc_corporations (
                npc_corporation_id INTEGER PRIMARY KEY,
                name_id INTEGER NOT NULL,
                ticker_name TEXT NOT NULL,
                description_id INTEGER,
                icon_id INTEGER,
                data BLOB NOT NULL
            )
            """
        )

        for corp_id, corp_def in npc_corporations.items():
            corp_id = int(corp_id)
            try:
                validated = _NpcCorporation(**corp_def)
            except ValidationError:
                LOGGER.error(f"Invalid NPC corporation definition for ID {corp_id}: {corp_def}")
                continue

            blob = _pydantic_to_protobuf_npc_corporation(validated, corp_id).SerializeToString()

            cursor.execute(
                """
                INSERT INTO npc_corporations (npc_corporation_id, name_id, ticker_name, description_id, icon_id, data)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    int(corp_id),
                    validated.nameID,
                    validated.tickerName,
                    validated.descriptionID,
                    validated.iconID,
                    blob,
                ),
            )

            loc_entry = npc_loc_lookup.npc_corporation_entries.add()
            loc_entry.npc_corporation_id = int(corp_id)
            loc_entry.name_id = validated.nameID
            if validated.descriptionID is not None:
                loc_entry.description_id = validated.descriptionID

        conn.commit()

    bundle_npc_corp_look_up = loc_root / "npc_corporation_localization_lookup.pb"
    if bundle_npc_corp_look_up.exists():
        LOGGER.warning(
            f"NPC corporations localization lookup file '{bundle_npc_corp_look_up}' already exists. Overwriting."
        )
        bundle_npc_corp_look_up.unlink()

    with open(bundle_npc_corp_look_up, "wb") as f:
        f.write(npc_loc_lookup.SerializeToString())
