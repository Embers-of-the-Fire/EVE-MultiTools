import { useSPARouterStore } from "@/stores/spaRouterStore";
import type { RouteParam, RouteParamMap } from "@/types/router";

export function useSPARouter() {
    const router = useSPARouterStore();

    const navigateToTypeDetail = (typeId: number) => {
        router.navigateWithParams("/explore/type/detail", { typeId });
    };

    const navigateToFactionDetail = (factionId: number) => {
        router.navigateWithParams("/explore/faction/detail", { factionId });
    };

    const navigateToNpcCorporationDetail = (corporationId: number) => {
        router.navigateWithParams("/explore/npc-corporation/detail", { corporationId });
    };

    const navigateToUniverseRegion = (id: number) => {
        router.navigateWithParams("/explore/universe/region", { id });
    };

    const navigateToUniverseConstellation = (id: number) => {
        router.navigateWithParams("/explore/universe/constellation", { id });
    };

    const navigateToUniverseSystem = (id: number) => {
        router.navigateWithParams("/explore/universe/system", { id });
    };

    const navigateToUniversePlanet = (id: number) => {
        router.navigateWithParams("/explore/universe/planet", { id });
    };

    const navigateToUniverseMoon = (id: number) => {
        router.navigateWithParams("/explore/universe/moon", { id });
    };

    const navigateToUniverseNpcStation = (id: number) => {
        router.navigateWithParams("/explore/universe/npc-station", { id });
    };

    // Generic typed parameter getter
    const useRouteParams = <T extends keyof RouteParamMap>(path: T): RouteParam<T> | undefined => {
        return router.getRouteParams(path);
    };

    return {
        ...router,
        navigateToTypeDetail,
        navigateToFactionDetail,
        navigateToNpcCorporationDetail,
        navigateToUniverseRegion,
        navigateToUniverseConstellation,
        navigateToUniverseSystem,
        navigateToUniversePlanet,
        navigateToUniverseMoon,
        navigateToUniverseNpcStation,
        useRouteParams,
    };
}
