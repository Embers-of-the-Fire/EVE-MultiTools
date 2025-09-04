import { AccordionItem } from "@radix-ui/react-accordion";
import type React from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import SyntaxHighlighter from "react-syntax-highlighter";
import { a11yDark, a11yLight } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { EmbeddedFactionCard } from "@/components/card/FactionCard";
import { PageLayout } from "@/components/layout";
import { UniversePointDisplay } from "@/components/UniverseLocation";
import { Accordion, AccordionContent, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Region } from "@/data/schema";
import {
    getRegionTypeFromNative,
    getRegionTypeNameKey,
    getWormholeClassFromNative,
    getWormholeClassNameKey,
} from "@/data/universe";
import { useTheme } from "@/hooks/useAppSettings";
import { useFactionExplore } from "@/hooks/useFactionExplore";
import { useLocalization } from "@/hooks/useLocalization";
import { useSPARouter } from "@/hooks/useSPARouter";
import { getRegionById, getRegionDetailById } from "@/native/data";
import type { RegionBrief } from "@/types/data";
import { UniverseHistoryActions } from "./_Actions";

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

    const { setCurrentFactionID } = useFactionExplore();
    const { navigate } = useSPARouter();

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
                                    </h2>
                                    <p className="text-sm text-muted-foreground">ID: {regionId}</p>
                                </div>

                                {desc && <p className="text-sm leading-relaxed">{desc}</p>}
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {t("explore.universe.region.region_attributes.title")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div>
                            <h4 className="font-medium text-sm text-muted-foreground">
                                {t("explore.universe.region.region_attributes.faction_id")}
                            </h4>
                            {regionDetail.factionId ? (
                                <EmbeddedFactionCard
                                    className="mt-2"
                                    factionId={regionDetail.factionId}
                                    onClick={() => {
                                        if (!regionDetail.factionId) return;
                                        setCurrentFactionID(regionDetail.factionId);
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
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>{t("explore.universe.region.hidden_attributes")}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div>
                            <h4 className="font-medium text-sm text-muted-foreground">
                                {t("terms.wormhole_class")}
                            </h4>
                            <p className="font-medium">
                                {regionDetail.wormholeClassId
                                    ? t(
                                          getWormholeClassNameKey(
                                              getWormholeClassFromNative(
                                                  regionDetail.wormholeClassId
                                              )
                                          )
                                      )
                                    : t("common.none")}
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-sm text-muted-foreground">
                                {t("terms.region_type")}
                            </h4>
                            <p className="font-medium">
                                {regionDetail.regionType
                                    ? t(
                                          getRegionTypeNameKey(
                                              getRegionTypeFromNative(regionDetail.regionType)
                                          )
                                      )
                                    : t("common.none")}
                            </p>
                        </div>
                        {regionDetail.center && (
                            <div>
                                <h4 className="font-medium text-sm text-muted-foreground">
                                    {t("explore.universe.region.center")}
                                </h4>
                                <p className="font-medium">
                                    <UniversePointDisplay point={regionDetail.center} />
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
