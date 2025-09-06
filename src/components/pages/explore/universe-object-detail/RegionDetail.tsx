import { AccordionItem } from "@radix-ui/react-accordion";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { getRegionById, getRegionDetailById } from "@/native/data";
import type { RegionBrief } from "@/types/data";

export interface RegionDetailPageProps {
    regionId: number;
}

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

    useEffect(() => {
        let mounted = true;
        setIsLoading(true);

        (async () => {
            const reg = await getRegionDetailById(regionId);
            const regBrief = await getRegionById(regionId);

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
    }, [regionId, loc]);

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
                                    </h2>
                                    <p className="text-sm text-muted-foreground">ID: {regionId}</p>
                                </div>

                                {desc && <p className="text-sm leading-relaxed">{desc}</p>}
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <AttributePanel>
                    <AttributeTitle>
                        {t("explore.universe.region.region_attributes.title")}
                    </AttributeTitle>
                    <AttributeContent>
                        <Attribute>
                            <AttributeName>
                                {t("explore.universe.region.region_attributes.faction_id")}
                            </AttributeName>
                            <AttributeText>
                                {regionDetail.factionId ? (
                                    <EmbeddedFactionCard
                                        className="mt-2"
                                        factionId={regionDetail.factionId}
                                        onClick={() => {
                                            if (!regionDetail.factionId) return;
                                            navigateToFactionDetail(
                                                regionDetail.factionId,
                                                t("explore.faction.detail.title")
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
                <Card>
                    <Accordion type="single" collapsible className="w-full" defaultValue="systems">
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
