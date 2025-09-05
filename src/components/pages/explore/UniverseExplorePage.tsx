import { useState } from "react";
import { useTranslation } from "react-i18next";
import { EmbeddedUniverseObjectCard } from "@/components/card/UniverseObjectCard";
import { SearchBar } from "@/components/common/SearchBar";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    getRegionTypeNameKey,
    getRegionTypeString,
    getWormholeClassNameKey,
    getWormholeClassString,
    type RegionTypeString,
    type WormholeClassString,
    wormholeClassList,
} from "@/data/universe";
import { useLanguage } from "@/hooks/useAppSettings";
import { useSPARouter } from "@/hooks/useSPARouter";
import type { Language } from "@/native";
import {
    getConstellationById,
    getRegionById,
    getSystemById,
    searchConstellationByName,
    searchRegionByName,
    searchSystemByName,
} from "@/native/data";
import type { UniverseObject, UniverseObjectType } from "@/stores/universeExploreStore";
import type { WormholeClass } from "@/types/data";
import { RegionType } from "@/types/data";
import { PageLayout } from "../../layout";

type WormholeClassFilterString =
    | WormholeClassString
    | "all"
    | "out-space"
    | "wormhole"
    | "void"
    | "abyssal"
    | "drifter"
    | "none"; // "none" means no wormhole class, not out-space like high-sec, low-sec, null-sec

const regionTypeList: RegionType[] = [
    RegionType.HighSec,
    RegionType.LowSec,
    RegionType.NullSec,
    RegionType.Wormhole,
    RegionType.Void,
    RegionType.Abyssal,
    RegionType.Pochven,
];

type RegionTypeFilterString = RegionTypeString | "all" | "none"; // "none" means no region type

const singleChecker = (target: WormholeClassFilterString): ((wc: WormholeClass) => boolean) => {
    return (wc: WormholeClass) => getWormholeClassString(wc) === target;
};
const multipleChecker = (
    targets: Set<WormholeClassFilterString>
): ((wc: WormholeClass) => boolean) => {
    return (wc: WormholeClass) => targets.has(getWormholeClassString(wc));
};

const wcFilter = (
    filterID: WormholeClassFilterString
): ((wormholeClassID: number | undefined) => boolean) => {
    if (filterID === "none")
        return (wormholeClassID: number | undefined) => wormholeClassID === undefined;
    if (filterID === "all") return (_: number | undefined) => true;
    if (filterID === "out-space") {
        const targets = new Set<WormholeClassFilterString>([
            "high-sec",
            "low-sec",
            "null-sec",
            "gm1",
            "gm2",
        ]);
        return (wormholeClassID: number | undefined) => {
            if (wormholeClassID === null) return false;
            const cls = wormholeClassID as WormholeClass;
            return multipleChecker(targets)(cls);
        };
    }
    if (filterID === "wormhole") {
        const targets = new Set<WormholeClassFilterString>([
            "c1",
            "c2",
            "c3",
            "c4",
            "c5",
            "c6",
            "thera",
            "small-ship",
            "sentinel",
            "barbican",
            "vidette",
            "conflux",
            "redoubt",
        ]);
        return (wormholeClassID: number | undefined) => {
            if (wormholeClassID === null) return false;
            const cls = wormholeClassID as WormholeClass;
            return multipleChecker(targets)(cls);
        };
    }
    if (filterID === "void") {
        const targets = new Set<WormholeClassFilterString>(["void-or-abyssal-1"]);
        return (wormholeClassID: number | undefined) => {
            if (wormholeClassID === null) return false;
            const cls = wormholeClassID as WormholeClass;
            return multipleChecker(targets)(cls);
        };
    }
    if (filterID === "abyssal") {
        const targets = new Set<WormholeClassFilterString>([
            "void-or-abyssal-1",
            "abyssal-2",
            "abyssal-3",
            "abyssal-4",
            "abyssal-5",
        ]);
        return (wormholeClassID: number | undefined) => {
            if (wormholeClassID === null) return false;
            const cls = wormholeClassID as WormholeClass;
            return multipleChecker(targets)(cls);
        };
    }
    if (filterID === "drifter") {
        const targets = new Set<WormholeClassFilterString>([
            "sentinel",
            "barbican",
            "vidette",
            "conflux",
            "redoubt",
        ]);
        return (wormholeClassID: number | undefined) => {
            if (wormholeClassID === null) return false;
            const cls = wormholeClassID as WormholeClass;
            return multipleChecker(targets)(cls);
        };
    }
    return (wormholeClassID: number | undefined) => {
        if (wormholeClassID === null) return false;
        const cls = wormholeClassID as WormholeClass;
        return singleChecker(filterID)(cls);
    };
};

const rtFilter = (filterID: RegionTypeFilterString): ((rt: RegionType | undefined) => boolean) => {
    if (filterID === "all") return (_: RegionType | undefined) => true;
    if (filterID === "none") return (rt: RegionType | undefined) => rt === undefined;
    return (rt: RegionType | undefined) => {
        if (rt === undefined) return false;
        return getRegionTypeString(rt) === filterID;
    };
};

export function UniverseExplorePage() {
    const { t } = useTranslation();
    const { language } = useLanguage();

    const { navigateToUniverseDetail } = useSPARouter();

    const [sourceType, setSourceType] = useState<UniverseObjectType>("system");
    const [wormholeClassFilter, setWormholeClassFilter] =
        useState<WormholeClassFilterString>("out-space");
    const [regionTypeFilter, setRegionTypeFilter] = useState<RegionTypeFilterString>("all");

    const handleSourceTypeChange = (type: UniverseObjectType) => {
        setSourceType(type);
    };

    const handleUniverseObjectClick = (obj: UniverseObject) => {
        navigateToUniverseDetail(obj, t("explore.universe.detail.title"));
    };

    const searchFunction = async (query: string, language: Language) => {
        const results: (UniverseObject & { score: number })[] = [];
        const filter = wcFilter(wormholeClassFilter);
        const rtFilterFunc = rtFilter(regionTypeFilter);

        if (sourceType === "region") {
            const out = await searchRegionByName(query, language);
            for (const r of out) {
                const region = await getRegionById(r[0]);
                if (region) {
                    if (filter(region.wormhole_class_id) === false) continue;
                    if (rtFilterFunc && !rtFilterFunc(region.region_type as RegionType)) continue;
                    results.push({ type: "region", id: r[0], score: r[1] });
                }
            }
        } else if (sourceType === "constellation") {
            const out = await searchConstellationByName(query, language);
            for (const r of out) {
                const constellation = await getConstellationById(r[0]);
                if (constellation) {
                    if (filter(constellation.wormhole_class_id) === false) continue;
                    results.push({ type: "constellation", id: r[0], score: r[1] });
                }
            }
        } else if (sourceType === "system") {
            const out = await searchSystemByName(query, language);
            for (const r of out) {
                const system = await getSystemById(r[0]);
                if (filter(system.wormhole_class_id) === false) continue;
                results.push({ type: "system", id: r[0], score: r[1] });
            }
        }

        results.sort((a, b) => b.score - a.score);
        return results;
    };

    return (
        <PageLayout
            title={t("explore.universe.title", "宇宙/Universe")}
            description={t("explore.universe.desc", "探索宇宙相关内容")}
        >
            <div className="flex gap-4 mb-4">
                <Select value={sourceType} onValueChange={handleSourceTypeChange}>
                    <SelectTrigger className="w-56">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="region">{t("terms.region")}</SelectItem>
                        <SelectItem value="constellation">{t("terms.constellation")}</SelectItem>
                        <SelectItem value="system">{t("terms.system")}</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={wormholeClassFilter}
                    onValueChange={(value) => setWormholeClassFilter(value as WormholeClassString)}
                >
                    <SelectTrigger className="w-56">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-96">
                        <SelectGroup>
                            <SelectLabel>
                                {t("explore.universe.filter.wormhole_class.label.shortcut")}
                            </SelectLabel>
                            <SelectItem value="all">{t("common.all")}</SelectItem>
                            <SelectItem value="out-space">{t("terms.out_space")}</SelectItem>
                            <SelectItem value="wormhole">{t("terms.wormhole")}</SelectItem>
                            <SelectItem value="void">{t("terms.void")}</SelectItem>
                            <SelectItem value="abyssal">{t("terms.abyssal")}</SelectItem>
                            <SelectItem value="pochven">{t("terms.pochven")}</SelectItem>
                            <SelectItem value="drifter">{t("terms.drifter")}</SelectItem>
                            <SelectItem value="none">{t("common.none")}</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                            <SelectLabel>
                                {t("explore.universe.filter.wormhole_class.label.detail")}
                            </SelectLabel>
                            {wormholeClassList.map((wc) => (
                                <SelectItem key={wc} value={getWormholeClassString(wc)}>
                                    {t(getWormholeClassNameKey(wc))}
                                </SelectItem>
                            ))}
                            <SelectItem value="none">{t("common.none")}</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>

                <Select
                    value={regionTypeFilter || ""}
                    onValueChange={(value) =>
                        setRegionTypeFilter((value as RegionTypeFilterString) || null)
                    }
                    disabled={sourceType !== "region"}
                >
                    <SelectTrigger className="w-56">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-96">
                        <SelectItem value="all">{t("common.all")}</SelectItem>
                        {regionTypeList.map((rt) => (
                            <SelectItem key={rt} value={getRegionTypeString(rt)}>
                                {t(getRegionTypeNameKey(rt))}
                            </SelectItem>
                        ))}
                        <SelectItem value="none">{t("common.none")}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <SearchBar
                onItemSelect={handleUniverseObjectClick}
                searchFunction={searchFunction}
                placeholder={t("explore.universe.search.placeholder")}
                noResultsMessage={t("common.no_results")}
                language={language}
            >
                {(ctx) => (
                    <div className="space-y-2">
                        {ctx.results.slice(0, 30).map((result) => (
                            <EmbeddedUniverseObjectCard
                                key={`${result.type}-${result.id}`}
                                obj={{ type: result.type, id: result.id }}
                                onClick={handleUniverseObjectClick}
                                compact={true}
                            />
                        ))}
                    </div>
                )}
            </SearchBar>
        </PageLayout>
    );
}
