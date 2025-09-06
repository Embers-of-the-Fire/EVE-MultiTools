import { AccordionItem } from "@radix-ui/react-accordion";
import { ChevronLeft } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import SyntaxHighlighter from "react-syntax-highlighter";
import { a11yDark, a11yLight } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { EmbeddedFactionCard } from "@/components/card/FactionCard";
import { EmbeddedUniverseObjectCard } from "@/components/card/UniverseObjectCard";
import {
    Attribute,
    AttributeContent,
    AttributeName,
    AttributePanel,
    AttributeText,
    AttributeTitle,
} from "@/components/common/AttributePanel";
import { PageLayout } from "@/components/layout";
import { UniversePointDisplay } from "@/components/UniverseLocation";
import { Accordion, AccordionContent, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Constellation } from "@/data/schema";
import { getWormholeClassFromNative, getWormholeClassNameKey } from "@/data/universe";
import { useTheme } from "@/hooks/useAppSettings";
import { useLocalization } from "@/hooks/useLocalization";
import { useSPARouter } from "@/hooks/useSPARouter";
import { getConstellationById, getConstellationDetailById, getRegionById } from "@/native/data";
import type { ConstellationBrief } from "@/types/data";

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

    const { navigateToFactionDetail, navigateToUniverseRegion, navigateToUniverseSystem } =
        useSPARouter();

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
        <PageLayout title={name}>
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
                                                navigateToUniverseRegion(
                                                    constellationBrief.region_id
                                                );
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
                <AttributePanel>
                    <AttributeTitle>
                        {t("explore.universe.constellation.constellation_attributes.title")}
                    </AttributeTitle>
                    <AttributeContent>
                        <Attribute>
                            <AttributeName>
                                {t(
                                    "explore.universe.constellation.constellation_attributes.faction_id"
                                )}
                            </AttributeName>
                            <AttributeText>
                                {constellationDetail.factionId ? (
                                    <EmbeddedFactionCard
                                        className="mt-2"
                                        factionId={constellationDetail.factionId}
                                        onClick={() => {
                                            if (!constellationDetail.factionId) return;
                                            navigateToFactionDetail(constellationDetail.factionId);
                                        }}
                                    />
                                ) : (
                                    t("common.none")
                                )}
                            </AttributeText>
                        </Attribute>
                        <Attribute>
                            <AttributeName>{t("terms.wormhole_class")}</AttributeName>
                            <AttributeText>
                                {constellationDetail.wormholeClassId
                                    ? t(
                                          getWormholeClassNameKey(
                                              getWormholeClassFromNative(
                                                  constellationDetail.wormholeClassId
                                              )
                                          )
                                      )
                                    : t("common.none")}
                            </AttributeText>
                        </Attribute>
                    </AttributeContent>
                </AttributePanel>
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
                                                    navigateToUniverseSystem(systemId);
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
                        {t("explore.universe.constellation.hidden_attributes")}
                    </AttributeTitle>
                    <AttributeContent>
                        {constellationDetail.center && (
                            <Attribute>
                                <AttributeName>
                                    {t("explore.universe.constellation.center")}
                                </AttributeName>
                                <AttributeText>
                                    <UniversePointDisplay point={constellationDetail.center} />
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

export const ConstellationDetailPageWrapper: React.FC = () => {
    const { t } = useTranslation();
    const { navigate, useRouteParams } = useSPARouter();

    const routeParams = useRouteParams("/explore/universe/constellation");
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

    return <ConstellationDetailPage constellationId={id} />;
};
