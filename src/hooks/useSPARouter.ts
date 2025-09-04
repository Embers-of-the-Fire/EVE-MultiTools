import { useTranslation } from "react-i18next";
import { useFactionExploreStore } from "@/stores/factionExploreStore";
import { useSPARouterStore } from "@/stores/spaRouterStore";
import { useTypeExploreStore } from "@/stores/typeExploreStore";
import { useUniverseExploreStore } from "@/stores/universeExploreStore";
import type { RouteParam, RouteParamMap } from "@/types/router";

export function useSPARouter() {
    const { t } = useTranslation();
    const router = useSPARouterStore();
    const { setCurrentUniverseObject } = useUniverseExploreStore();
    const { setCurrentTypeID } = useTypeExploreStore();
    const { setCurrentFactionID } = useFactionExploreStore();

    // Add convenience methods for typed route navigation
    const navigateToTypeDetail = (typeId: number, title?: string) => {
        const finalTitle = title || t("explore.type.detail.title");

        // Update the old type explore store for history compatibility
        setCurrentTypeID(typeId);

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

        // Update the old faction explore store for history compatibility
        setCurrentFactionID(factionId);

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

    const navigateToUniverseDetail = (
        params: RouteParam<"/explore/universe/detail">,
        title?: string
    ) => {
        const finalTitle = title || t("explore.universe.detail.title");

        // Update the old universe explore store for history compatibility
        setCurrentUniverseObject(params);

        // Add to detail history
        router.addDetailHistory({
            id: `universe-${params.type}-${params.id}`,
            title: finalTitle,
            path: "/explore/universe/detail",
            params,
            timestamp: Date.now(),
        });

        router.navigateWithParams("/explore/universe/detail", params);
    };

    // Generic typed parameter getter
    const useRouteParams = <T extends keyof RouteParamMap>(path: T): RouteParam<T> | undefined => {
        return router.getRouteParams(path);
    };

    return {
        ...router,
        navigateToTypeDetail,
        navigateToFactionDetail,
        navigateToUniverseDetail,
        useRouteParams,
    };
}
