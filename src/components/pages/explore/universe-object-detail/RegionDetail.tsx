import { AccordionItem } from "@radix-ui/react-accordion";
import { Info } from "lucide-react";
import type React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import SyntaxHighlighter from "react-syntax-highlighter";
import { a11yDark, a11yLight } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { EmbeddedFactionCard } from "@/components/card/FactionCard";
import { EmbeddedUniverseObjectCard } from "@/components/card/UniverseObjectCard";
import { Alongside, AlongsideMain, AlongsideSlave } from "@/components/common/Alongside";
import {
    Attribute,
    AttributeContent,
    AttributeName,
    AttributePanel,
    AttributeText,
    AttributeTitle,
} from "@/components/common/AttributePanel";
import { PageLayout } from "@/components/layout";
import { type TreeDataItem, TreeView } from "@/components/tree-view";
import { UniversePointDisplay } from "@/components/UniverseLocation";
import { Accordion, AccordionContent, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Region } from "@/data/schema";
import {
    getRegionTypeFromNative,
    getRegionTypeNameKey,
    getWormholeClassFromNative,
    getWormholeClassNameKey,
} from "@/data/universe";
import { useTheme } from "@/hooks/useAppSettings";
import { useLocalization } from "@/hooks/useLocalization";
import { useSPARouter } from "@/hooks/useSPARouter";
import { useData } from "@/stores/dataStore";
import type { RegionBrief } from "@/types/data";
import { getSecurityStatusColor } from "@/utils/color";

export interface RegionDetailPageProps {
    regionId: number;
}

const RegionTree: React.FC<{ regionId: number }> = ({ regionId }) => {
    const [tree, setTree] = useState<TreeDataItem[]>([]);
    const { navigateToUniverseConstellation, navigateToUniverseSystem } = useSPARouter();

    const { getData } = useData();

    // biome-ignore lint/correctness/useExhaustiveDependencies: const router func
    useEffect(() => {
        let mounted = true;
        (async () => {
            const reg = await getData("getRegionDetailById", regionId);
            if (!mounted) return;
            console.log("region detail", reg);

            const newTree: TreeDataItem[] = await Promise.all(
                reg.constellationIds.map(async (consId) => {
                    const cons = await getData("getConstellationDetailById", consId);

                    const children = cons.solarSystemIds.map((sysId) => ({
                        id: sysId.toString(),
                        icon: (
                            <Info
                                size={14}
                                onClick={() => navigateToUniverseSystem(sysId)}
                                className="mr-1 cursor-pointer"
                            />
                        ),
                        name: <SystemNode systemId={sysId} />,
                    }));

                    return {
                        id: consId.toString(),
                        icon: (
                            <Info
                                size={14}
                                onClick={() => navigateToUniverseConstellation(consId)}
                                className="mr-1 cursor-pointer"
                            />
                        ),
                        name: <ConstellationNode constellationId={consId} />,
                        children: children,
                    };
                })
            );
            setTree(newTree);
        })();
        return () => {
            mounted = false;
        };
    }, [regionId, getData]);

    return <TreeView data={tree} className="p-0 m-0" />;
};

const ConstellationNode: React.FC<{ constellationId: number }> = ({ constellationId }) => {
    const { loc } = useLocalization();
    const [name, setName] = useState<string | null>(null);

    const { getData } = useData();

    useEffect(() => {
        let mounted = true;
        (async () => {
            const cons = await getData("getConstellationById", constellationId);
            const name = await loc(cons.name_id);
            if (mounted) {
                setName(name);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [constellationId, loc, getData]);

    if (!name) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            {name} ({constellationId})
        </div>
    );
};

const SystemNode: React.FC<{ systemId: number }> = ({ systemId }) => {
    const { loc } = useLocalization();
    const [name, setName] = useState<string | null>(null);
    const [security, setSecurity] = useState<number>(-1.0);

    const { getData } = useData();

    useEffect(() => {
        let mounted = true;
        (async () => {
            const sys = await getData("getSystemById", systemId);
            const name = await loc(sys.name_id);
            const sec = sys.security_status;
            if (mounted) {
                setName(name);
                setSecurity(sec);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [systemId, loc, getData]);

    if (!name) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            {name}
            <span className="mx-1" style={{ color: getSecurityStatusColor(security) }}>
                {security.toFixed(2)}
            </span>
            ({systemId})
        </div>
    );
};

export const RegionDetailPage: React.FC<RegionDetailPageProps> = ({ regionId }) => {
    const { loc } = useLocalization();
    const { t } = useTranslation();
    const { theme } = useTheme();

    const [name, setName] = useState<string>("");
    const [desc, setDesc] = useState<string>("");
    const [regionBrief, setRegionBrief] = useState<RegionBrief | null>(null);
    const [regionDetail, setRegionDetail] = useState<Region | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(true);

    const { navigateToFactionDetail, navigateToUniverseConstellation } = useSPARouter();

    const leftDescRef = useRef<HTMLDivElement>(null);
    const rightTreeRef = useRef<HTMLDivElement>(null);

    const { getData } = useData();

    useEffect(() => {
        let mounted = true;
        setIsLoading(true);

        (async () => {
            const reg = await getData("getRegionDetailById", regionId);
            const regBrief = await getData("getRegionById", regionId);

            const name = await loc(reg.nameId);
            let desc = "";
            if (reg.descriptionId) {
                desc = await loc(reg.descriptionId);
            }

            if (mounted) {
                setName(name);
                setDesc(desc);
                setRegionBrief(regBrief);
                setRegionDetail(reg);
            }

            setIsLoading(false);
        })();

        return () => {
            mounted = false;
        };
    }, [regionId, loc, getData]);

    useLayoutEffect(() => {
        const leftEl = leftDescRef.current;
        const rightEl = rightTreeRef.current;
        if (!leftEl || !rightEl) return;

        const applyHeight = (h: number) => {
            rightEl.style.height = `${Math.round(h)}px`;
        };

        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { height } = entry.contentRect;
                requestAnimationFrame(() => applyHeight(height));
            }
        });

        ro.observe(leftEl);
        applyHeight(leftEl.getBoundingClientRect().height);

        return () => {
            ro.disconnect();
        };
    });

    if (isLoading || !regionBrief || !regionDetail) {
        return (
            <PageLayout
                title={t("explore.universe.detail.title")}
                description={t("common.loading")}
            >
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg">{t("common.loading")}</div>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout title={name}>
            <div className="space-y-6">
                <ResizablePanelGroup direction="horizontal">
                    <Alongside className="flex flex-row h-fit w-full">
                        {(main, slave) => (
                            <>
                                <ResizablePanel defaultSize={70}>
                                    <AlongsideMain ref={main} className="space-y-6 block">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>
                                                    {t("explore.universe.detail.basic_info")}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex items-start gap-6">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                                                            <span className="text-2xl font-bold text-muted-foreground">
                                                                S
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 space-y-4">
                                                        <div>
                                                            <h2 className="text-2xl font-bold flex flex-row items-center gap-2">
                                                                {name}
                                                            </h2>
                                                            <p className="text-sm text-muted-foreground">
                                                                ID: {regionId}
                                                            </p>
                                                        </div>

                                                        {desc && (
                                                            <p className="text-sm leading-relaxed">
                                                                {desc}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <AttributePanel>
                                            <AttributeTitle>
                                                {t(
                                                    "explore.universe.region.region_attributes.title"
                                                )}
                                            </AttributeTitle>
                                            <AttributeContent className="grid grid-cols-1 md:grid-cols-1">
                                                <Attribute>
                                                    <AttributeName>
                                                        {t(
                                                            "explore.universe.region.region_attributes.faction_id"
                                                        )}
                                                    </AttributeName>
                                                    <AttributeText>
                                                        {regionDetail.factionId ? (
                                                            <EmbeddedFactionCard
                                                                className="mt-2"
                                                                factionId={regionDetail.factionId}
                                                                onClick={() => {
                                                                    if (!regionDetail.factionId)
                                                                        return;
                                                                    navigateToFactionDetail(
                                                                        regionDetail.factionId,
                                                                        t(
                                                                            "explore.faction.detail.title"
                                                                        )
                                                                    );
                                                                }}
                                                            />
                                                        ) : (
                                                            t("common.none")
                                                        )}
                                                    </AttributeText>
                                                </Attribute>
                                            </AttributeContent>
                                        </AttributePanel>
                                    </AlongsideMain>
                                </ResizablePanel>
                                <ResizableHandle className="block mx-6" />
                                <ResizablePanel maxSize={40} minSize={20} defaultSize={30}>
                                    <AlongsideSlave ref={slave}>
                                        <Card className="h-full min-h-0 gap-2">
                                            <CardHeader>
                                                <CardTitle>
                                                    {t("explore.universe.region.region_tree")}
                                                </CardTitle>
                                            </CardHeader>
                                            <ScrollArea className="overflow-auto px-3 mt-0">
                                                <RegionTree regionId={regionId} />
                                            </ScrollArea>
                                        </Card>
                                    </AlongsideSlave>
                                </ResizablePanel>
                            </>
                        )}
                    </Alongside>
                </ResizablePanelGroup>
                <Card>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="systems">
                            <CardHeader className="w-full">
                                <AccordionTrigger className="text-base">
                                    <CardTitle>
                                        {t("explore.universe.region.constellations")}
                                    </CardTitle>
                                </AccordionTrigger>
                            </CardHeader>
                            <AccordionContent asChild>
                                <ScrollArea>
                                    <CardContent className="grid grid-flow-row auto-rows-max grid-cols-2 md:grid-cols-3 gap-2 max-h-96">
                                        {regionDetail.constellationIds.map((consId) => (
                                            <EmbeddedUniverseObjectCard
                                                key={consId}
                                                obj={{
                                                    type: "constellation",
                                                    id: consId,
                                                }}
                                                onClick={() => {
                                                    navigateToUniverseConstellation(consId);
                                                }}
                                            />
                                        ))}
                                    </CardContent>
                                </ScrollArea>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </Card>
                <AttributePanel>
                    <AttributeTitle>
                        {t("explore.universe.region.hidden_attributes")}
                    </AttributeTitle>
                    <AttributeContent>
                        <Attribute>
                            <AttributeName>{t("terms.wormhole_class")}</AttributeName>
                            <AttributeText>
                                {regionDetail.wormholeClassId
                                    ? t(
                                          getWormholeClassNameKey(
                                              getWormholeClassFromNative(
                                                  regionDetail.wormholeClassId
                                              )
                                          )
                                      )
                                    : t("common.none")}
                            </AttributeText>
                        </Attribute>
                        <Attribute>
                            <AttributeName>{t("terms.region_type")}</AttributeName>
                            <AttributeText>
                                {regionDetail.regionType
                                    ? t(
                                          getRegionTypeNameKey(
                                              getRegionTypeFromNative(regionDetail.regionType)
                                          )
                                      )
                                    : t("common.none")}
                            </AttributeText>
                        </Attribute>
                        {regionDetail.center && (
                            <Attribute>
                                <AttributeName>{t("explore.universe.region.center")}</AttributeName>
                                <AttributeText>
                                    <UniversePointDisplay point={regionDetail.center} />
                                </AttributeText>
                            </Attribute>
                        )}
                    </AttributeContent>
                </AttributePanel>
                <Card>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="show-json">
                            <CardHeader className="w-full">
                                <AccordionTrigger className="text-base">
                                    <CardTitle>{t("common.data.raw_json_data")}</CardTitle>
                                </AccordionTrigger>
                            </CardHeader>
                            <AccordionContent asChild>
                                <CardContent>
                                    <SyntaxHighlighter
                                        language="json"
                                        style={theme === "Light" ? a11yLight : a11yDark}
                                        showLineNumbers={true}
                                    >
                                        {JSON.stringify(regionDetail, null, 4)}
                                    </SyntaxHighlighter>
                                </CardContent>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </Card>
            </div>
        </PageLayout>
    );
};

export const RegionDetailPageWrapper: React.FC = () => {
    const { t } = useTranslation();
    const { navigate, useRouteParams } = useSPARouter();

    const routeParams = useRouteParams("/explore/universe/region");
    const id = routeParams?.id;

    useEffect(() => {
        if (!id) {
            navigate("/explore/universe");
        }
    }, [id, navigate]);

    if (!id) {
        return (
            <PageLayout title={t("explore.universe.detail.title")} description={t("common.error")}>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-muted-foreground">
                            {t("explore.universe.detail.no_object_selected")}
                        </div>
                    </CardContent>
                </Card>
            </PageLayout>
        );
    }

    return <RegionDetailPage regionId={id} />;
};
