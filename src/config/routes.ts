import { AboutPage } from "@/components/pages/AboutPage";
import { BundlePage } from "@/components/pages/BundlePage";
import { ExplorePage } from "@/components/pages/ExplorePage";
import { FactionDetailPageWrapper } from "@/components/pages/explore/FactionDetailPageWrapper";
import { FactionExplorePage } from "@/components/pages/explore/FactionExplorePage";
import { LocalizationExplorePage } from "@/components/pages/explore/LocalizationExplorePage";
import { TypeDetailPageWrapper } from "@/components/pages/explore/TypeDetailPageWrapper";
import { TypeExplorePage } from "@/components/pages/explore/TypeExplorePage";
import { UniverseExplorePage } from "@/components/pages/explore/UniverseExplorePage";
import { UniverseObjectDetailPageWrapper } from "@/components/pages/explore/UniverseObjectDetailPageWrapper";
import { GetStartedPage } from "@/components/pages/GetStartedPage";
import { HomePage } from "@/components/pages/HomePage";
import { MarketListPage } from "@/components/pages/market/MarketListPage";
import { MarketSearchPage } from "@/components/pages/market/MarketSearchPage";
import type { AppRoute } from "@/types/router";

export const routes: AppRoute[] = [
    {
        key: "home",
        path: "/",
        labelKey: "nav.home",
        component: HomePage,
        icon: "home",
    },
    {
        key: "get-started",
        path: "/get-started",
        labelKey: "nav.get_started",
        component: GetStartedPage,
        icon: "rocket",
    },
    {
        key: "market",
        path: "/market",
        labelKey: "nav.market",
        icon: "trending",
        children: [
            {
                key: "market-list",
                path: "/market/list",
                labelKey: "nav.market.list",
                component: MarketListPage,
            },
            {
                key: "market-search",
                path: "/market/search",
                labelKey: "nav.market.search",
                component: MarketSearchPage,
            },
        ],
    },
    {
        key: "explore",
        path: "/explore",
        labelKey: "nav.explore",
        component: ExplorePage,
        icon: "compass",
        children: [
            {
                key: "explore-type",
                path: "/explore/type",
                labelKey: "nav.explore.type",
                component: TypeExplorePage,
            },
            {
                key: "explore-type-detail",
                path: "/explore/type/detail",
                labelKey: "nav.explore.type.detail",
                component: TypeDetailPageWrapper,
                hideFromNav: true,
            },
            {
                key: "explore-faction",
                path: "/explore/faction",
                labelKey: "nav.explore.faction",
                component: FactionExplorePage,
            },
            {
                key: "explore-faction-detail",
                path: "/explore/faction/detail",
                labelKey: "nav.explore.faction.detail",
                component: FactionDetailPageWrapper,
                hideFromNav: true,
            },
            {
                key: "explore-localization",
                path: "/explore/localization",
                labelKey: "nav.explore.localization",
                component: LocalizationExplorePage,
            },
            {
                key: "explore-universe",
                path: "/explore/universe",
                labelKey: "nav.explore.universe",
                component: UniverseExplorePage,
            },
            {
                key: "explore-universe-detail",
                path: "/explore/universe/detail",
                labelKey: "nav.explore.universe.detail",
                component: UniverseObjectDetailPageWrapper,
                hideFromNav: true,
            },
        ],
    },
    {
        key: "bundle",
        path: "/bundle",
        labelKey: "nav.bundle",
        component: BundlePage,
        icon: "archive",
    },
    {
        key: "about",
        path: "/about",
        labelKey: "nav.about",
        component: AboutPage,
        icon: "info",
    },
];

export function getFlatRoutes(): AppRoute[] {
    const flatRoutes: AppRoute[] = [];

    function addRoute(route: AppRoute) {
        flatRoutes.push(route);
        if (route.children) {
            route.children.forEach(addRoute);
        }
    }

    routes.forEach(addRoute);
    return flatRoutes;
}

export function findRouteByPath(path: string): AppRoute | undefined {
    return getFlatRoutes().find((route) => route.path === path);
}

export function getRouteTitleKey(path: string): string {
    const route = findRouteByPath(path);
    return route?.labelKey || "nav.unknown";
}

export function generateBreadcrumbs(path: string): { labelKey: string; path: string }[] {
    const breadcrumbs: { labelKey: string; path: string }[] = [];
    const pathSegments = path.split("/").filter(Boolean);

    breadcrumbs.push({ labelKey: "nav.home", path: "/" });

    let currentPath = "";
    pathSegments.forEach((segment) => {
        currentPath += `/${segment}`;
        const route = findRouteByPath(currentPath);
        if (route) {
            breadcrumbs.push({ labelKey: route.labelKey, path: currentPath });
        }
    });

    return breadcrumbs;
}
