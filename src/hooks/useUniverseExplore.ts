import { type UniverseObject, useUniverseExploreStore } from "@/stores/universeExploreStore";

export function useUniverseExplore() {
    const {
        currentUniverseObject,
        history,
        setCurrentUniverseObject,
        clearCurrentUniverseObject,
        clearHistory,
    } = useUniverseExploreStore();

    return {
        currentUniverseObject,
        history,

        setCurrentUniverseObject,
        setCurrentUniverseObjectAsRegion: (id: number) => {
            const obj = { id, type: "region" } as UniverseObject;
            setCurrentUniverseObject(obj);
        },
        setCurrentUniverseObjectAsConstellation: (id: number) => {
            const obj = { id, type: "constellation" } as UniverseObject;
            setCurrentUniverseObject(obj);
        },
        setCurrentUniverseObjectAsSystem: (id: number) => {
            const obj = { id, type: "system" } as UniverseObject;
            setCurrentUniverseObject(obj);
        },

        clearCurrentUniverseObject,
        clearHistory,
    };
}
