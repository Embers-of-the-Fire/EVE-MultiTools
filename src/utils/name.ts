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

export const getMoonName = (
    solarSystemName: string,
    planetCelestialIndex: number,
    moonCelestialIndex: number,
    t: (id: string) => string
) => {
    const planetNum = numberToRoman(planetCelestialIndex + 1);
    const moonNum = moonCelestialIndex + 1;

    return `${solarSystemName} ${planetNum} - ${t("terms.moon")} ${moonNum}`;
};
