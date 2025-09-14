import {
    Constellation,
    MarketGroupCollection,
    Moon,
    NpcCorporation,
    NpcStation,
    Planet,
    Region,
    SolarSystem,
} from "@/data/schema";
import {
    type Category,
    type ConstellationBrief,
    type Faction,
    GraphicType,
    type Group,
    type LinkKey,
    type LocSearchResult,
    type MarketGroup,
    type MetaGroup,
    type MoonBrief,
    type NpcCorporationBrief,
    type NpcStationBrief,
    type PlanetBrief,
    type RegionBrief,
    type Skin,
    type SkinLicense,
    type SkinMaterial,
    type SystemBrief,
    type Type,
    type WormholeClass,
} from "@/types/data";
import { tauriInvoke } from "./base";

export async function getGraphicPath(
    graphicId: number,
    graphicType = GraphicType.Icon
): Promise<string | null> {
    return await tauriInvoke<string | null>("get_graphic_path", {
        graphicId,
        graphicType,
    });
}

export async function getIconPath(iconId: number): Promise<string | null> {
    return await tauriInvoke<string | null>("get_icon_path", { iconId });
}

export async function getSkinMaterialPath(skinMaterialId: number): Promise<string> {
    return await tauriInvoke<string>("get_skin_material_path", {
        skinMaterialId,
    });
}

export async function getFactionIconPath(iconId: number): Promise<string | null> {
    return await tauriInvoke<string | null>("get_faction_icon_path", {
        iconId,
    });
}

export async function getFactionLogoPath(logoId: string): Promise<string | null> {
    return await tauriInvoke<string | null>("get_faction_logo_path", {
        logoId,
    });
}

export type LocString = {
    en: string;
    zh: string;
};

export async function getLocalization(key: number): Promise<LocString | null> {
    return await tauriInvoke<LocString | null>("get_localization", { key });
}

export async function getLocalizationByLang(
    key: number,
    language: "en" | "zh"
): Promise<string | null> {
    const loc = await tauriInvoke<string | null>("get_localization_by_language", { key, language });
    return loc;
}

export async function getUiLocalizationByLang(
    key: string,
    language: "en" | "zh"
): Promise<string | null> {
    const loc = await tauriInvoke<string | null>("get_ui_localization_by_language", {
        key,
        language,
    });
    return loc;
}

export async function getGroup(groupId: number): Promise<Group | null> {
    return await tauriInvoke<Group | null>("get_group", { groupId });
}

export async function getCategory(categoryId: number): Promise<Category | null> {
    return await tauriInvoke<Category | null>("get_category", { categoryId });
}

export async function getMetaGroup(metaGroupId: number): Promise<MetaGroup | null> {
    return await tauriInvoke<MetaGroup | null>("get_meta_group", {
        metaGroupId,
    });
}

export async function getType(typeId: number): Promise<Type | null> {
    return await tauriInvoke<Type | null>("get_type", { typeId });
}

export async function searchTypeByName(
    name: string,
    language: "en" | "zh",
    limit: number = 20
): Promise<number[]> {
    return await tauriInvoke<number[]>("search_type_by_name", {
        name,
        language,
        limit,
    });
}

export async function searchTypeByDescription(
    desc: string,
    language: "en" | "zh",
    limit: number = 20
): Promise<number[]> {
    return await tauriInvoke<number[]>("search_type_by_description", {
        desc,
        language,
        limit,
    });
}

export async function searchRegionByName(
    name: string,
    language: "en" | "zh"
): Promise<LocSearchResult[]> {
    return await tauriInvoke<LocSearchResult[]>("search_region_by_name", {
        name,
        language,
    });
}

export async function searchConstellationByName(
    name: string,
    language: "en" | "zh"
): Promise<LocSearchResult[]> {
    return await tauriInvoke<LocSearchResult[]>("search_constellation_by_name", {
        name,
        language,
    });
}

export async function searchSystemByName(
    name: string,
    language: "en" | "zh"
): Promise<LocSearchResult[]> {
    return await tauriInvoke<LocSearchResult[]>("search_system_by_name", {
        name,
        language,
    });
}

export async function getSkin(skinId: number): Promise<Skin | null> {
    return await tauriInvoke<Skin | null>("get_skin", { skinId });
}

export async function getSkinMaterial(skinMaterialId: number): Promise<SkinMaterial | null> {
    return await tauriInvoke<SkinMaterial | null>("get_skin_material", {
        skinMaterialId,
    });
}

export async function getSkinLicense(licenseId: number): Promise<SkinLicense | null> {
    return await tauriInvoke<SkinLicense | null>("get_skin_license", {
        licenseId,
    });
}

export async function getSkinMaterialIdByLicense(licenseId: number): Promise<number | null> {
    return await tauriInvoke<number | null>("get_skin_material_id_by_license", {
        licenseId,
    });
}

export async function getLicensesBySkin(skinId: number): Promise<SkinLicense[]> {
    return await tauriInvoke<SkinLicense[]>("get_licenses_by_skin", { skinId });
}

export async function getFaction(factionId: number): Promise<Faction | null> {
    return await tauriInvoke<Faction | null>("get_faction", { factionId });
}

export async function getFactionIds(): Promise<number[]> {
    return await tauriInvoke<number[]>("get_faction_ids");
}

export async function getMarketGroup(marketGroupId: number): Promise<MarketGroup | null> {
    return await tauriInvoke<MarketGroup | null>("get_market_group", {
        marketGroupId,
    });
}

export async function getMarketGroupRaw(): Promise<MarketGroupCollection> {
    const bytes = await tauriInvoke<ArrayBuffer>("get_market_group_raw");
    if (!bytes) {
        throw new Error("Failed to fetch market group data");
    }
    return MarketGroupCollection.fromBinary(new Uint8Array(bytes));
}

export async function getMarketPrice(typeId: number): Promise<void> {
    await tauriInvoke<void>("get_market_price", {
        typeId,
    });
}

export async function getMarketPrices(typeIds: number[]): Promise<void> {
    await Promise.all(typeIds.map((typeId) => getMarketPrice(typeId)));
}

export async function getLinkUrl(
    key: LinkKey,
    params: Record<string, string>
): Promise<string | null> {
    return await tauriInvoke<string | null>("get_link_url", {
        key,
        params,
    });
}

export async function getRegionById(regionId: number): Promise<RegionBrief> {
    const result = await tauriInvoke<RegionBrief>("get_region_by_id", {
        regionId,
    });
    if (!result) {
        throw new Error("Region not found");
    }
    return result;
}

export async function getRegionsByFactionId(factionId: number | null): Promise<RegionBrief[]> {
    return await tauriInvoke<RegionBrief[]>("get_regions_by_faction_id", {
        factionId,
    });
}

export async function getRegionsByWormholeClassId(
    classId: WormholeClass | null
): Promise<RegionBrief[]> {
    return await tauriInvoke<RegionBrief[]>("get_regions_by_wormhole_class_id", {
        classId,
    });
}

export async function getRegionDetailById(regionId: number): Promise<Region> {
    const bytes = await tauriInvoke<ArrayBuffer>("get_region_detail_by_id", {
        regionId,
    });
    if (!bytes) {
        throw new Error("Failed to fetch region data");
    }
    return Region.fromBinary(new Uint8Array(bytes));
}

export async function getConstellationById(constellationId: number): Promise<ConstellationBrief> {
    const result = await tauriInvoke<ConstellationBrief>("get_constellation_by_id", {
        constellationId,
    });
    if (!result) {
        throw new Error("Constellation not found");
    }
    return result;
}

export async function getConstellationsByRegionId(regionId: number): Promise<ConstellationBrief[]> {
    return await tauriInvoke<ConstellationBrief[]>("get_constellations_by_region_id", {
        regionId,
    });
}

export async function getConstellationsByFactionId(
    factionId: number | null
): Promise<ConstellationBrief[]> {
    return await tauriInvoke<ConstellationBrief[]>("get_constellations_by_faction_id", {
        factionId,
    });
}

export async function getConstellationsByWormholeClassId(
    classId: WormholeClass | null
): Promise<ConstellationBrief[]> {
    return await tauriInvoke<ConstellationBrief[]>("get_constellations_by_wormhole_class_id", {
        classId,
    });
}

export async function getConstellationDetailById(constellationId: number): Promise<Constellation> {
    const bytes = await tauriInvoke<ArrayBuffer>("get_constellation_detail_by_id", {
        constellationId,
    });
    if (!bytes) {
        throw new Error("Failed to fetch constellation data");
    }
    return Constellation.fromBinary(new Uint8Array(bytes));
}

export async function getSystemById(solarSystemId: number): Promise<SystemBrief> {
    const result = await tauriInvoke<SystemBrief | null>("get_system_by_id", {
        solarSystemId,
    });
    if (!result) {
        throw new Error("System not found");
    }
    return result;
}

export async function getSystemsByRegionId(regionId: number): Promise<SystemBrief[]> {
    return await tauriInvoke<SystemBrief[]>("get_systems_by_region_id", {
        regionId,
    });
}

export async function getSystemsByConstellationId(constellationId: number): Promise<SystemBrief[]> {
    return await tauriInvoke<SystemBrief[]>("get_systems_by_constellation_id", {
        constellationId,
    });
}

export async function getSystemsByFactionId(factionId: number | null): Promise<SystemBrief[]> {
    return await tauriInvoke<SystemBrief[]>("get_systems_by_faction_id", {
        factionId,
    });
}

export async function getSystemsByWormholeClassId(
    classId: WormholeClass | null
): Promise<SystemBrief[]> {
    return await tauriInvoke<SystemBrief[]>("get_systems_by_wormhole_class_id", {
        classId,
    });
}

export async function getSystemsBySecurityRange(min: number, max: number): Promise<SystemBrief[]> {
    return await tauriInvoke<SystemBrief[]>("get_systems_by_security_range", {
        min,
        max,
    });
}

export async function getSystemDataById(solarSystemId: number): Promise<SolarSystem> {
    const bytes = await tauriInvoke<ArrayBuffer>("get_system_data_by_id", {
        solarSystemId,
    });
    if (!bytes) {
        throw new Error("Failed to fetch system data");
    }
    return SolarSystem.fromBinary(new Uint8Array(bytes));
}

export async function getPlanetById(planetId: number): Promise<PlanetBrief> {
    const result = await tauriInvoke<PlanetBrief | null>("get_planet_by_id", {
        planetId,
    });
    if (!result) {
        throw new Error("Planet not found");
    }
    return result;
}

export async function getPlanetDataById(planetId: number): Promise<Planet> {
    const bytes = await tauriInvoke<ArrayBuffer>("get_planet_data_by_id", {
        planetId,
    });
    if (!bytes) {
        throw new Error("Failed to fetch planet data");
    }
    return Planet.fromBinary(new Uint8Array(bytes));
}

export async function getMoonById(moonId: number): Promise<MoonBrief> {
    const result = await tauriInvoke<MoonBrief | null>("get_moon_by_id", {
        moonId,
    });
    if (!result) {
        throw new Error("Moon not found");
    }
    return result;
}

export async function getMoonDataById(moonId: number): Promise<Moon> {
    const bytes = await tauriInvoke<ArrayBuffer>("get_moon_data_by_id", {
        moonId,
    });
    if (!bytes) {
        throw new Error("Failed to fetch moon data");
    }
    return Moon.fromBinary(new Uint8Array(bytes));
}

export async function getNpcStationById(stationId: number): Promise<NpcStationBrief> {
    const result = await tauriInvoke<NpcStationBrief | null>("get_npc_station_by_id", {
        stationId,
    });
    if (!result) {
        throw new Error("NPC Station not found");
    }
    return result;
}

export async function getNpcStationDataById(stationId: number): Promise<NpcStation> {
    const bytes = await tauriInvoke<ArrayBuffer>("get_npc_station_data_by_id", {
        stationId,
    });
    if (!bytes) {
        throw new Error("Failed to fetch NPC Station data");
    }
    return NpcStation.fromBinary(new Uint8Array(bytes));
}

export async function getNpcCorporationById(
    npcCorporationId: number
): Promise<NpcCorporationBrief> {
    const result = await tauriInvoke<NpcCorporationBrief | null>("get_npc_corporation_by_id", {
        npcCorporationId,
    });
    if (!result) {
        throw new Error("NPC Corporation not found");
    }
    return result;
}

export async function getNpcCorporationDataById(npcCorporationId: number): Promise<NpcCorporation> {
    const bytes = await tauriInvoke<ArrayBuffer>("get_npc_corporation_data_by_id", {
        npcCorporationId,
    });
    if (!bytes) {
        throw new Error("Failed to fetch NPC Corporation data");
    }
    return NpcCorporation.fromBinary(new Uint8Array(bytes));
}
