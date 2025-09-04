import { AccordionItem } from "@radix-ui/react-accordion";
import { ChevronLeft } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import SyntaxHighlighter from "react-syntax-highlighter";
import { a11yDark, a11yLight } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { EmbeddedFactionCard } from "@/components/card/FactionCard";
import { EmbeddedTypeCard } from "@/components/card/TypeCard";
import { PageLayout } from "@/components/layout";
import { UniversePointDisplay } from "@/components/UniverseLocation";
import { Accordion, AccordionContent, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SECONDARY_COLOR } from "@/constant/color";
import { AU_IN_M } from "@/constant/unit";
import type { SolarSystem } from "@/data/schema";
import { useLanguage, useTheme } from "@/hooks/useAppSettings";
import { useLocalization } from "@/hooks/useLocalization";
import { useSPARouter } from "@/hooks/useSPARouter";
import {
    getConstellationById,
    getRegionById,
    getSystemById,
    getSystemDataById,
} from "@/native/data";
import type { SystemBrief } from "@/types/data";
import { getSecurityStatusColor } from "@/utils/color";

export interface SystemDetailPageProps {
    systemId: number;
}

export const SystemDetailPage: React.FC<SystemDetailPageProps> = ({ systemId }) => {
    const [systemData, setSystemData] = useState<SolarSystem | null>(null);
    const { loc } = useLocalization();
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { language } = useLanguage();

    const [name, setName] = useState<string>("");
    const [desc, setDesc] = useState<string>("");
    const [regionName, setRegionName] = useState<string>("");
    const [constellationName, setConstellationName] = useState<string>("");
    const [systemBrief, setSystemBrief] = useState<SystemBrief | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(true);

    const { navigateToTypeDetail, navigateToFactionDetail, navigateToUniverseDetail } =
        useSPARouter();

    useEffect(() => {
        let mounted = true;
        setIsLoading(true);

        (async () => {
            const system = await getSystemDataById(systemId);

            const name = await loc(system.solarSystemNameId);
            let desc = "";
            if (system.descriptionId) {
                desc = await loc(system.descriptionId);
            }
            const systemBrief = await getSystemById(systemId);
            let regionName = "";
            let constellationName = "";
            if (systemBrief) {
                const region = await getRegionById(systemBrief.region_id);
                if (region) {
                    regionName = await loc(region.name_id);
                }
                const constellation = await getConstellationById(systemBrief.constellation_id);
                if (constellation) {
                    constellationName = await loc(constellation.name_id);
                }
            }

            if (mounted) {
                setSystemData(system);
                setName(name);
                setDesc(desc);
                setRegionName(regionName);
                setConstellationName(constellationName);
                setSystemBrief(systemBrief);
            }

            setIsLoading(false);
        })();

        return () => {
            mounted = false;
        };
    }, [systemId, loc]);

    if (isLoading || !systemData) {
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
                                                if (!systemBrief) return;
                                                navigateToUniverseDetail({
                                                    type: "constellation",
                                                    id: systemBrief.constellation_id,
                                                });
                                            }}
                                        >
                                            {constellationName ||
                                                t("explore.universe.detail.unknown_constellation")}
                                        </Button>
                                        <ChevronLeft className="text-sm h-[1em] w-[1em]" />
                                        <Button
                                            variant="link"
                                            className="text-sm p-0"
                                            onClick={() => {
                                                if (!systemBrief) return;
                                                navigateToUniverseDetail({
                                                    type: "region",
                                                    id: systemBrief.region_id,
                                                });
                                            }}
                                        >
                                            {regionName ||
                                                t("explore.universe.detail.unknown_region")}
                                        </Button>
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        ID: {systemData.solarSystemId}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="secondary">
                                        {t("terms.security_status")}{" "}
                                        <span
                                            className="rounded-sm py-0.5 px-1"
                                            style={{
                                                backgroundColor: SECONDARY_COLOR,
                                                color: getSecurityStatusColor(systemData.security),
                                            }}
                                        >
                                            {systemData.security.toFixed(2)}
                                        </span>
                                    </Badge>
                                </div>

                                {desc && <p className="text-sm leading-relaxed">{desc}</p>}
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {t("explore.universe.system.system_attributes.title")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div>
                            <h4 className="font-medium text-sm text-muted-foreground">
                                {t("terms.security_status")}
                            </h4>
                            <p
                                className="font-medium inline px-2 py-0.5 rounded dark:bg-transparent"
                                style={{
                                    backgroundColor: SECONDARY_COLOR,
                                    color: getSecurityStatusColor(systemData.security),
                                }}
                            >
                                {systemData.security.toFixed(2)}
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-sm text-muted-foreground">
                                {t("terms.luminosity")}
                            </h4>
                            <p className="font-medium">{systemData.luminosity.toFixed(6)}</p>
                        </div>
                        <div>
                            <h4 className="font-medium text-sm text-muted-foreground">
                                {t("terms.radius")}
                            </h4>
                            <p className="font-medium">
                                {(systemData.radius / AU_IN_M).toLocaleString(language)} AU
                            </p>
                        </div>
                        {systemData.factionId && (
                            <div>
                                <h4 className="font-medium text-sm text-muted-foreground">
                                    {t("explore.universe.system.system_attributes.faction_id")}
                                </h4>
                                <EmbeddedFactionCard
                                    className="mt-2"
                                    factionId={systemData.factionId}
                                    onClick={() => {
                                        if (!systemData.factionId) return;
                                        navigateToFactionDetail(systemData.factionId);
                                    }}
                                />
                            </div>
                        )}
                        {systemData.sunTypeId && (
                            <div>
                                <h4 className="font-medium text-sm text-muted-foreground">
                                    {t("explore.universe.system.system_attributes.sun_type_id")}
                                </h4>
                                <EmbeddedTypeCard
                                    className="mt-2"
                                    typeId={systemData.sunTypeId}
                                    onClick={() => {
                                        if (!systemData.sunTypeId) return;
                                        navigateToTypeDetail(systemData.sunTypeId);
                                    }}
                                />
                            </div>
                        )}
                        {systemData.sunFlareGraphicId && (
                            <div>
                                <h4 className="font-medium text-sm text-muted-foreground">
                                    {t(
                                        "explore.universe.system.system_attributes.sun_flare_graphic_id"
                                    )}
                                </h4>
                                <p className="font-medium">{systemData.sunFlareGraphicId}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>{t("explore.universe.system.hidden_attributes")}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div>
                            <h4 className="font-medium text-sm text-muted-foreground">
                                {t("explore.universe.system.warp_tunnel_overwrite")}
                            </h4>
                            <p className="font-medium">
                                {systemData.warpTunnelOverwrite
                                    ? systemData.warpTunnelOverwrite.toFixed(0)
                                    : t("common.none")}
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-sm text-muted-foreground">
                                {t("explore.universe.system.system_wide_cloud")}
                            </h4>
                            <p className="font-medium">
                                {systemData.systemWideCloud
                                    ? systemData.systemWideCloud.toFixed(0)
                                    : t("common.none")}
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-sm text-muted-foreground">
                                {t("explore.universe.system.visual_effect")}
                            </h4>
                            <p className="font-medium">
                                {systemData.visualEffect || t("common.none")}
                            </p>
                        </div>
                        {systemData.position && (
                            <div>
                                <h4 className="font-medium text-sm text-muted-foreground">
                                    {t("explore.universe.system.position")}
                                </h4>
                                <p className="font-medium">
                                    <UniversePointDisplay point={systemData.position} />
                                </p>
                            </div>
                        )}
                        {systemData.max && (
                            <div>
                                <h4 className="font-medium text-sm text-muted-foreground">
                                    {t("explore.universe.system.boundary_max")}
                                </h4>
                                <p className="font-medium">
                                    <UniversePointDisplay point={systemData.max} />
                                </p>
                            </div>
                        )}
                        {systemData.min && (
                            <div>
                                <h4 className="font-medium text-sm text-muted-foreground">
                                    {t("explore.universe.system.boundary_min")}
                                </h4>
                                <p className="font-medium">
                                    <UniversePointDisplay point={systemData.min} />
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>{t("explore.universe.system.unknown_attributes")}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div>
                            <h4 className="font-medium text-sm text-muted-foreground">Fringe</h4>
                            <p className="font-medium">
                                {systemData.fringe ? t("common.yes") : t("common.no")}
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-sm text-muted-foreground">Hub</h4>
                            <p className="font-medium">
                                {systemData.hub ? t("common.yes") : t("common.no")}
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-sm text-muted-foreground">
                                International
                            </h4>
                            <p className="font-medium">
                                {systemData.international ? t("common.yes") : t("common.no")}
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-sm text-muted-foreground">Regional</h4>
                            <p className="font-medium">
                                {systemData.regional ? t("common.yes") : t("common.no")}
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-sm text-muted-foreground">border</h4>
                            <p className="font-medium">
                                {systemData.border ? t("common.yes") : t("common.no")}
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-sm text-muted-foreground">corridor</h4>
                            <p className="font-medium">
                                {systemData.corridor ? t("common.yes") : t("common.no")}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="show-json">
                            <CardHeader>
                                <AccordionTrigger className="text-base">
                                    <CardTitle>
                                        {t("explore.universe.system.show_json_data")}
                                    </CardTitle>
                                </AccordionTrigger>
                            </CardHeader>
                            <AccordionContent>
                                <CardContent>
                                    <SyntaxHighlighter
                                        language="json"
                                        style={theme === "Light" ? a11yLight : a11yDark}
                                        showLineNumbers={true}
                                    >
                                        {JSON.stringify(systemData, null, 4)}
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
