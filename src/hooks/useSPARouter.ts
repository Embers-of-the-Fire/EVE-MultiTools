import { useTranslation } from "react-i18next";
import { useSPARouterStore } from "@/stores/spaRouterStore";
import type { RouteParam, RouteParamMap } from "@/types/router";

export function useSPARouter() {
    const { t } = useTranslation();
    const router = useSPARouterStore();

    // Add convenience methods for typed route navigation
    const navigateToTypeDetail = (typeId: number, title?: string) => {
        const finalTitle = title || t("explore.type.detail.title");
        // Add to detail history
        router.addDetailHistory({
            id: `type-${typeId}`,
            title: finalTitle,
            path: "/explore/type/detail",
            params: { typeId },
            timestamp: Date.now(),
        });

        router.navigateWithParams("/explore/type/detail", { typeId });
    };

    const navigateToFactionDetail = (factionId: number, title?: string) => {
        const finalTitle = title || t("explore.faction.detail.title");

        // Add to detail history
        router.addDetailHistory({
            id: `faction-${factionId}`,
            title: finalTitle,
            path: "/explore/faction/detail",
            params: { factionId },
            timestamp: Date.now(),
        });

        router.navigateWithParams("/explore/faction/detail", { factionId });
    };

    const navigateToUniverseRegion = (id: number, title?: string) => {
        const finalTitle = title || t("explore.universe.region.detail");

        router.addDetailHistory({
            id: `region-${id}`,
            title: finalTitle,
            path: "/explore/universe/region",
            params: { id },
            timestamp: Date.now(),
        });

        router.navigateWithParams("/explore/universe/region", { id });
    };

    const navigateToUniverseConstellation = (id: number, title?: string) => {
        const finalTitle = title || t("explore.universe.constellation.detail");

        router.addDetailHistory({
            id: `constellation-${id}`,
            title: finalTitle,
            path: "/explore/universe/constellation",
            params: { id },
            timestamp: Date.now(),
        });

        router.navigateWithParams("/explore/universe/constellation", { id });
    };

    const navigateToUniverseSystem = (id: number, title?: string) => {
        const finalTitle = title || t("explore.universe.system.detail");

        router.addDetailHistory({
            id: `system-${id}`,
            title: finalTitle,
            path: "/explore/universe/system",
            params: { id },
            timestamp: Date.now(),
        });

        router.navigateWithParams("/explore/universe/system", { id });
    };

    const navigateToUniversePlanet = (id: number, title?: string) => {
        const finalTitle = title || t("explore.universe.planet.detail");

        router.addDetailHistory({
            id: `planet-${id}`,
            title: finalTitle,
            path: "/explore/universe/planet",
            params: { id },
            timestamp: Date.now(),
        });

        router.navigateWithParams("/explore/universe/planet", { id });
    };

    const navigateToUniverseMoon = (id: number, title?: string) => {
        const finalTitle = title || t("explore.universe.moon.detail");

        router.addDetailHistory({
            id: `moon-${id}`,
            title: finalTitle,
            path: "/explore/universe/moon",
            params: { id },
            timestamp: Date.now(),
        });

        router.navigateWithParams("/explore/universe/moon", { id });
    };

    const navigateToUniverseNpcStation = (id: number, title?: string) => {
        const finalTitle = title || t("explore.universe.npc_station.detail");

        router.addDetailHistory({
            id: `npc-station-${id}`,
            title: finalTitle,
            path: "/explore/universe/npc-station",
            params: { id },
            timestamp: Date.now(),
        });

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
        navigateToUniverseRegion,
        navigateToUniverseConstellation,
        navigateToUniverseSystem,
        navigateToUniversePlanet,
        navigateToUniverseMoon,
        navigateToUniverseNpcStation,
        useRouteParams,
    };
}
