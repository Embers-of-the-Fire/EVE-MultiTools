import type { LocGetter } from "@/hooks/useLocalization";
import type { DataGetter } from "@/stores/dataStore";
import { numberToRoman } from "./number";

export const getPlanetName = (
    celestialIndex: number,
    solarSystemName: string,
    planetName?: string
) => {
    if (planetName) {
        return planetName;
    }
    const num = numberToRoman(celestialIndex);
    return `${solarSystemName} ${num}`;
};

export const getMoonName = (
    solarSystemName: string,
    planetCelestialIndex: number,
    moonCelestialIndex: number,
    t: (id: string) => string
) => {
    const planetNum = numberToRoman(planetCelestialIndex);
    const moonNum = moonCelestialIndex;

    return `${solarSystemName} ${planetNum} - ${t("terms.moon")} ${moonNum}`;
};

export const getStationName = async (
    npcStationId: number,
    getData: DataGetter,
    loc: LocGetter,
    t: (id: string) => string
) => {
    const npcStation = await getData("getNpcStationById", npcStationId);
    let commonName = "";
    if (npcStation.moon_id) {
        const moon = await getData("getMoonById", npcStation.moon_id);
        if (moon.moon_name_id) {
            const moonName = await loc(moon.moon_name_id);
            commonName = moonName || "";
        } else {
            const planet = await getData("getPlanetById", moon.planet_id);
            const system = await getData("getSystemById", planet.system_id);
            const systemName = (await loc(system.name_id)) || "";

            commonName = getMoonName(systemName, planet.celestial_index, moon.celestial_index, t);
        }
    } else if (npcStation.planet_id) {
        const planet = await getData("getPlanetById", npcStation.planet_id);
        if (planet.planet_name_id) {
            const planetName = await loc(planet.planet_name_id);
            commonName = planetName || "";
        } else {
            const system = await getData("getSystemById", planet.system_id);
            const systemName = (await loc(system.name_id)) || "";

            commonName = getPlanetName(
                planet.celestial_index,
                systemName,
                planet.planet_name_id ? await loc(planet.planet_name_id) : undefined
            );
        }
    } else if (npcStation.system_id) {
        const system = await getData("getSystemById", npcStation.system_id);
        commonName = (await loc(system.name_id)) || "";
    }

    const corp = await getData("getNpcCorporationById", npcStation.owner_id);
    const corpName = (await loc(corp.name_id)) || "";
    const operation = await getData("getStationOperationById", npcStation.operation_id);
    const operationName = (await loc(operation.name_id)) || "";
    return `${commonName} - ${corpName} - ${operationName}`;
};
