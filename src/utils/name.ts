import { numberToRoman } from "./number";

export const getPlanetName = (
    celestialIndex: number,
    solarSystemName: string,
    planetName?: string
) => {
    if (planetName) {
        return planetName;
    }
    const num = numberToRoman(celestialIndex + 1);
    return `${solarSystemName} ${num}`;
};
