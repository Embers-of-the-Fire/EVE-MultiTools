import { useTranslation } from "react-i18next";
import { getRouteTitleKey } from "@/lib/router";
import { useSPARouterStore } from "@/stores/spaRouterStore";
import type { RouteParam, RouteParamMap } from "@/types/router";

export function useSPARouter() {
    const { t } = useTranslation();
    const router = useSPARouterStore();

    // Add convenience methods for typed route navigation
    const navigateToTypeDetail = (typeId: number, title?: string) => {
        const finalTitle = title || t("explore.type.detail.title");
        // Add to history
        router.addHistoryItem("/explore/type/detail", finalTitle, `type-${typeId}`, { typeId });

        router.navigateWithParams("/explore/type/detail", { typeId });
    };

    const navigateToFactionDetail = (factionId: number, title?: string) => {
        const finalTitle = title || t("explore.faction.detail.title");

        // Add to history
        router.addHistoryItem("/explore/faction/detail", finalTitle, `faction-${factionId}`, {
            factionId,
        });

        router.navigateWithParams("/explore/faction/detail", { factionId });
    };

    const navigateToNpcCorporationDetail = (corporationId: number, title?: string) => {
        const finalTitle = title || t("explore.npc_corporation.detail.title");

        // Add to history
        router.addHistoryItem(
            "/explore/npc-corporation/detail",
            finalTitle,
            `npc-corporation-${corporationId}`,
            { corporationId }
        );

        router.navigateWithParams("/explore/npc-corporation/detail", { corporationId });
    };

    const navigateToUniverseRegion = (id: number, title?: string) => {
        const finalTitle = title || t("explore.universe.region.detail");

        router.addHistoryItem("/explore/universe/region", finalTitle, `region-${id}`, { id });

        router.navigateWithParams("/explore/universe/region", { id });
    };

    const navigateToUniverseConstellation = (id: number, title?: string) => {
        const finalTitle = title || t("explore.universe.constellation.detail");

        router.addHistoryItem(
            "/explore/universe/constellation",
            finalTitle,
            `constellation-${id}`,
            { id }
        );

        router.navigateWithParams("/explore/universe/constellation", { id });
    };

    const navigateToUniverseSystem = (id: number, title?: string) => {
        const finalTitle = title || t("explore.universe.system.detail");

        router.addHistoryItem("/explore/universe/system", finalTitle, `system-${id}`, { id });

        router.navigateWithParams("/explore/universe/system", { id });
    };

    const navigateToUniversePlanet = (id: number, title?: string) => {
        const finalTitle = title || t("explore.universe.planet.detail");

        router.addHistoryItem("/explore/universe/planet", finalTitle, `planet-${id}`, { id });

        router.navigateWithParams("/explore/universe/planet", { id });
    };

    const navigateToUniverseMoon = (id: number, title?: string) => {
        const finalTitle = title || t("explore.universe.moon.detail");

        router.addHistoryItem("/explore/universe/moon", finalTitle, `moon-${id}`, { id });

        router.navigateWithParams("/explore/universe/moon", { id });
    };

    const navigateToUniverseNpcStation = (id: number, title?: string) => {
        const finalTitle = title || t("explore.universe.npc_station.detail");

        router.addHistoryItem("/explore/universe/npc-station", finalTitle, `npc-station-${id}`, {
            id,
        });

        router.navigateWithParams("/explore/universe/npc-station", { id });
    };

    // Generic typed parameter getter
    const useRouteParams = <T extends keyof RouteParamMap>(path: T): RouteParam<T> | undefined => {
        return router.getRouteParams(path);
    };

    const navigateToPage = (path: string, title?: string, params?: any) => {
        const finalTitle = title || t(getRouteTitleKey(path));

        router.addHistoryItem(path, finalTitle, undefined, params);

        if (params) {
            router.navigateWithParams(path as any, params);
        } else {
            router.navigate(path);
        }
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
        navigateToPage,
    };
}
