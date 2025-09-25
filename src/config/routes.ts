import z from "zod";
import { AboutPage } from "@/components/pages/AboutPage";
import { BundlePage } from "@/components/pages/BundlePage";
import { ExplorePage } from "@/components/pages/ExplorePage";
import { FactionDetailPageWrapper } from "@/components/pages/explore/FactionDetailPage";
import { FactionExplorePage } from "@/components/pages/explore/FactionExplorePage";
import { LocalizationExplorePage } from "@/components/pages/explore/LocalizationExplorePage";
import { NpcCorporationDetailPageWrapper } from "@/components/pages/explore/NpcCorporationDetailPage";
import { TypeDetailPageWrapper } from "@/components/pages/explore/TypeDetailPage";
import { TypeExplorePage } from "@/components/pages/explore/TypeExplorePage";
import { UniverseExplorePage } from "@/components/pages/explore/UniverseExplorePage";
import { ConstellationDetailPageWrapper } from "@/components/pages/explore/universe-object-detail/ConstellationDetail";
import { MoonDetailPageWrapper } from "@/components/pages/explore/universe-object-detail/MoonDetail";
import { NpcStationDetailPageWrapper } from "@/components/pages/explore/universe-object-detail/NpcStationDetail";
import { PlanetDetailPageWrapper } from "@/components/pages/explore/universe-object-detail/PlanetDetail";
import { RegionDetailPageWrapper } from "@/components/pages/explore/universe-object-detail/RegionDetail";
import { SystemDetailPageWrapper } from "@/components/pages/explore/universe-object-detail/SystemDetail";
import { GetStartedPage } from "@/components/pages/GetStartedPage";
import { HomePage } from "@/components/pages/HomePage";
import {
    MarketBatchListPage,
    MarketBatchListTablePage,
} from "@/components/pages/market/MarketBatchListPage";
import { MarketListPage } from "@/components/pages/market/MarketListPage";
import { MarketSearchPage } from "@/components/pages/market/MarketSearchPage";
import type { AppRoute } from "@/types/router";

export const routes = [
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
        labelKey: "nav.market.title",
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
            {
                key: "market-batch-list",
                path: "/market/batch-list",
                labelKey: "nav.market.batch_list.input",
                component: MarketBatchListPage,
                children: [
                    {
                        key: "market-batch-list-table",
                        path: "/market/batch-list/table",
                        labelKey: "nav.market.batch_list.table",
                        component: MarketBatchListTablePage,
                        hideFromNav: true,
                        paramType: z.object({
                            typeList: z.array(
                                z.object({
                                    typeId: z.number(),
                                    amount: z.number(),
                                })
                            ),
                        }),
                    },
                ],
            },
        ],
    },
    {
        key: "explore",
        path: "/explore",
        labelKey: "nav.explore.title",
        component: ExplorePage,
        icon: "compass",
        children: [
            {
                key: "explore-type",
                path: "/explore/type",
                labelKey: "nav.explore.type.title",
                component: TypeExplorePage,
            },
            {
                key: "explore-type-detail",
                path: "/explore/type/detail",
                labelKey: "nav.explore.type.detail",
                component: TypeDetailPageWrapper,
                hideFromNav: true,
                paramType: z.object({ typeId: z.number() }),
            },
            {
                key: "explore-faction",
                path: "/explore/faction",
                labelKey: "nav.explore.faction.title",
                component: FactionExplorePage,
            },
            {
                key: "explore-faction-detail",
                path: "/explore/faction/detail",
                labelKey: "nav.explore.faction.detail",
                component: FactionDetailPageWrapper,
                hideFromNav: true,
                paramType: z.object({ factionId: z.number() }),
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
                labelKey: "nav.explore.universe.title",
                component: UniverseExplorePage,
            },
            {
                key: "explore-universe-region",
                path: "/explore/universe/region",
                labelKey: "nav.explore.universe.region.detail",
                component: RegionDetailPageWrapper,
                hideFromNav: true,
                paramType: z.object({ id: z.number() }),
            },
            {
                key: "explore-universe-constellation",
                path: "/explore/universe/constellation",
                labelKey: "nav.explore.universe.constellation.detail",
                component: ConstellationDetailPageWrapper,
                hideFromNav: true,
                paramType: z.object({ id: z.number() }),
            },
            {
                key: "explore-universe-system",
                path: "/explore/universe/system",
                labelKey: "nav.explore.universe.system.detail",
                component: SystemDetailPageWrapper,
                hideFromNav: true,
                paramType: z.object({ id: z.number() }),
            },
            {
                key: "explore-universe-planet",
                path: "/explore/universe/planet",
                labelKey: "nav.explore.universe.planet.detail",
                component: PlanetDetailPageWrapper,
                hideFromNav: true,
                paramType: z.object({ id: z.number() }),
            },
            {
                key: "explore-universe-moon",
                path: "/explore/universe/moon",
                labelKey: "nav.explore.universe.moon.detail",
                component: MoonDetailPageWrapper,
                hideFromNav: true,
                paramType: z.object({ id: z.number() }),
            },
            {
                key: "explore-universe-npc-station",
                path: "/explore/universe/npc-station",
                labelKey: "nav.explore.universe.npc_station.detail",
                component: NpcStationDetailPageWrapper,
                hideFromNav: true,
                paramType: z.object({ id: z.number() }),
            },
            {
                key: "explore-npc-corporation",
                path: "/explore/npc-corporation/detail",
                labelKey: "nav.explore.npc_corporation.detail",
                component: NpcCorporationDetailPageWrapper,
                hideFromNav: true,
                paramType: z.object({ corporationId: z.number() }),
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
] as const satisfies AppRoute[];
