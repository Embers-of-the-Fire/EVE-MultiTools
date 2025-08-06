import { BundlePage } from "@/components/pages/BundlePage";
import {
    CharacterAssetsPage,
    CharacterSkillsPage,
    CharacterWalletPage,
} from "@/components/pages/CharacterPages";
import { DatabasePage } from "@/components/pages/DatabasePage";
import { ExplorePage } from "@/components/pages/ExplorePage";
import { FactionDetailPageWrapper } from "@/components/pages/explore/FactionDetailPageWrapper";
import { FactionExplorePage } from "@/components/pages/explore/FactionExplorePage";
import { LocalizationExplorePage } from "@/components/pages/explore/LocalizationExplorePage";
import { TypeDetailPageWrapper } from "@/components/pages/explore/TypeDetailPageWrapper";
import { TypeExplorePage } from "@/components/pages/explore/TypeExplorePage";
import { UniverseExplorePage } from "@/components/pages/explore/UniverseExplorePage";
import { HomePage } from "@/components/pages/HomePage";
import {
    IndustryManufacturingPage,
    IndustryMiningPage,
    IndustryResearchPage,
} from "@/components/pages/IndustryPages";
import {
    MarketAnalysisPage,
    MarketCalculatorPage,
    MarketHistoryPage,
    MarketOrdersPage,
    MarketPredictorPage,
} from "@/components/pages/MarketPages";
import { SettingsPage } from "@/components/pages/SettingsPage";
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
        key: "market",
        path: "/market",
        labelKey: "nav.market",
        icon: "trending",
        children: [
            {
                key: "market-analysis",
                path: "/market/analysis",
                labelKey: "nav.market.analysis",
                component: MarketAnalysisPage,
            },
            {
                key: "market-orders",
                path: "/market/orders",
                labelKey: "nav.market.orders",
                component: MarketOrdersPage,
            },
            {
                key: "market-history",
                path: "/market/history",
                labelKey: "nav.market.history",
                component: MarketHistoryPage,
            },
            {
                key: "market-calculator",
                path: "/market/tools/calculator",
                labelKey: "nav.market.tools.calculator",
                component: MarketCalculatorPage,
            },
            {
                key: "market-predictor",
                path: "/market/tools/predictor",
                labelKey: "nav.market.tools.predictor",
                component: MarketPredictorPage,
            },
        ],
    },
    {
        key: "industry",
        path: "/industry",
        labelKey: "nav.industry",
        icon: "factory",
        children: [
            {
                key: "industry-manufacturing",
                path: "/industry/manufacturing",
                labelKey: "nav.industry.manufacturing",
                component: IndustryManufacturingPage,
            },
            {
                key: "industry-mining",
                path: "/industry/mining",
                labelKey: "nav.industry.mining",
                component: IndustryMiningPage,
            },
            {
                key: "industry-research",
                path: "/industry/research",
                labelKey: "nav.industry.research",
                component: IndustryResearchPage,
            },
        ],
    },
    {
        key: "character",
        path: "/character",
        labelKey: "nav.character",
        component: CharacterSkillsPage,
        icon: "users",
        children: [
            {
                key: "character-skills",
                path: "/character/skills",
                labelKey: "nav.character.skills",
                component: CharacterSkillsPage,
            },
            {
                key: "character-assets",
                path: "/character/assets",
                labelKey: "nav.character.assets",
                component: CharacterAssetsPage,
            },
            {
                key: "character-wallet",
                path: "/character/wallet",
                labelKey: "nav.character.wallet",
                component: CharacterWalletPage,
            },
        ],
    },
    {
        key: "database",
        path: "/database",
        labelKey: "nav.database",
        component: DatabasePage,
        icon: "database",
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
        key: "settings",
        path: "/settings",
        labelKey: "nav.settings",
        component: SettingsPage,
        icon: "settings",
    },
];

/**
 * 获取所有路由的扁平化列表
 */
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

/**
 * 根据路径查找路由
 */
export function findRouteByPath(path: string): AppRoute | undefined {
    return getFlatRoutes().find((route) => route.path === path);
}

/**
 * 生成面包屑导航
 */
export function generateBreadcrumbs(path: string): { labelKey: string; path: string }[] {
    const breadcrumbs: { labelKey: string; path: string }[] = [];
    const pathSegments = path.split("/").filter(Boolean);

    // 添加首页
    breadcrumbs.push({ labelKey: "nav.home", path: "/" });

    // 根据路径段生成面包屑
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
