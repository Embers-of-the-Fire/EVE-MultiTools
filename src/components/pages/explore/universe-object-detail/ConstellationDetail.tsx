import { AccordionItem } from "@radix-ui/react-accordion";
import { ChevronLeft } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import SyntaxHighlighter from "react-syntax-highlighter";
import { a11yDark, a11yLight } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { EmbeddedFactionCard } from "@/components/card/FactionCard";
import { EmbeddedUniverseObjectCard } from "@/components/card/UniverseObjectCard";
import { PageLayout } from "@/components/layout";
import { UniversePointDisplay } from "@/components/UniverseLocation";
import { Accordion, AccordionContent, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Constellation } from "@/data/schema";
import { getWormholeClassFromNative, getWormholeClassNameKey } from "@/data/universe";
import { useTheme } from "@/hooks/useAppSettings";
import { useFactionExplore } from "@/hooks/useFactionExplore";
import { useLocalization } from "@/hooks/useLocalization";
import { useSPARouter } from "@/hooks/useSPARouter";
import { useUniverseExplore } from "@/hooks/useUniverseExplore";
import { getConstellationById, getConstellationDetailById, getRegionById } from "@/native/data";
import type { ConstellationBrief } from "@/types/data";
import { UniverseHistoryActions } from "./_Actions";

export interface ConstellationDetailPageProps {
    constellationId: number;
}

export const ConstellationDetailPage: React.FC<ConstellationDetailPageProps> = ({
    constellationId,
}) => {
    const { loc } = useLocalization();
    const { t } = useTranslation();
    const { theme } = useTheme();

    const [name, setName] = useState<string>("");
    const [regionName, setRegionName] = useState<string>("");
    const [constellationBrief, setConstellationBrief] = useState<ConstellationBrief | null>(null);
    const [constellationDetail, setConstellationDetail] = useState<Constellation | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(true);

    const { setCurrentFactionID } = useFactionExplore();
    const { navigate } = useSPARouter();
    const { setCurrentUniverseObject } = useUniverseExplore();

    useEffect(() => {
        let mounted = true;
        setIsLoading(true);

        (async () => {
            const cons = await getConstellationDetailById(constellationId);
            const consBrief = await getConstellationById(constellationId);

            const name = await loc(cons.nameId);
            let regionName = "";
            if (consBrief) {
                const region = await getRegionById(consBrief.region_id);
                if (region) {
                    regionName = await loc(region.name_id);
                }
            }

            if (mounted) {
                setName(name);
                setRegionName(regionName);
                setConstellationBrief(consBrief);
                setConstellationDetail(cons);
            }

            setIsLoading(false);
        })();

        return () => {
            mounted = false;
        };
    }, [constellationId, loc]);

    if (isLoading || !constellationBrief || !constellationDetail) {
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
        <PageLayout title={name} actions={<UniverseHistoryActions />}>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("explore.universe.detail.basic_info")}</CardTitle>
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
                                        <ChevronLeft className="text-sm h-[1em] w-[1em]" />
                                        <Button
                                            variant="link"
                                            className="text-sm p-0"
                                            onClick={() => {
                                                if (!constellationBrief) return;
                                                setCurrentUniverseObject({
                                                    type: "region",
                                                    id: constellationBrief.region_id,
                                                });
                                            }}
                                        >
                                            {regionName ||
                                                t("explore.universe.detail.unknown_region")}
                                        </Button>
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        ID: {constellationId}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {t("explore.universe.constellation.constellation_attributes.title")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div>
                            <h4 className="font-medium text-sm text-muted-foreground">
                                {t(
                                    "explore.universe.constellation.constellation_attributes.faction_id"
                                )}
                            </h4>
                            {constellationDetail.factionId ? (
                                <EmbeddedFactionCard
                                    className="mt-2"
                                    factionId={constellationDetail.factionId}
                                    onClick={() => {
                                        if (!constellationDetail.factionId) return;
                                        setCurrentFactionID(constellationDetail.factionId);
                                        navigate(
                                            "/explore/faction/detail",
                                            t("explore.faction.detail.title")
                                        );
                                    }}
                                />
                            ) : (
                                t("common.none")
                            )}
                        </div>
                        <div>
                            <h4 className="font-medium text-sm text-muted-foreground">
                                {t("terms.wormhole_class")}
                            </h4>
                            <p className="font-medium">
                                {constellationDetail.wormholeClassId
                                    ? t(
                                          getWormholeClassNameKey(
                                              getWormholeClassFromNative(
                                                  constellationDetail.wormholeClassId
                                              )
                                          )
                                      )
                                    : t("common.none")}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <Accordion type="single" collapsible className="w-full" defaultValue="systems">
                        <AccordionItem value="systems">
                            <CardHeader className="w-full">
                                <AccordionTrigger className="text-base">
                                    <CardTitle>
                                        {t("explore.universe.constellation.systems")}
                                    </CardTitle>
                                </AccordionTrigger>
                            </CardHeader>
                            <AccordionContent asChild>
                                <ScrollArea>
                                    <CardContent className="grid grid-flow-row auto-rows-max grid-cols-2 md:grid-cols-3 gap-2 max-h-96">
                                        {constellationDetail.solarSystemIds.map((systemId) => (
                                            <EmbeddedUniverseObjectCard
                                                key={systemId}
                                                obj={{
                                                    type: "system",
                                                    id: systemId,
                                                }}
                                                onClick={() => {
                                                    setCurrentUniverseObject({
                                                        type: "system",
                                                        id: systemId,
                                                    });
                                                    navigate(
                                                        "/explore/universe/detail",
                                                        t("explore.universe.detail.title")
                                                    );
                                                }}
                                            />
                                        ))}
                                    </CardContent>
                                </ScrollArea>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {t("explore.universe.constellation.hidden_attributes")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {constellationDetail.center && (
                            <div>
                                <h4 className="font-medium text-sm text-muted-foreground">
                                    {t("explore.universe.constellation.center")}
                                </h4>
                                <p className="font-medium">
                                    <UniversePointDisplay point={constellationDetail.center} />
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="show-json">
                            <CardHeader className="w-full">
                                <AccordionTrigger className="text-base">
                                    <CardTitle>
                                        {t("explore.universe.system.show_json_data")}
                                    </CardTitle>
                                </AccordionTrigger>
                            </CardHeader>
                            <AccordionContent asChild>
                                <CardContent>
                                    <SyntaxHighlighter
                                        language="json"
                                        style={theme === "Light" ? a11yLight : a11yDark}
                                        showLineNumbers={true}
                                    >
                                        {JSON.stringify(constellationDetail, null, 4)}
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
