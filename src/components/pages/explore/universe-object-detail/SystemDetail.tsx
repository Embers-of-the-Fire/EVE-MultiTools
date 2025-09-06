import { AccordionItem } from "@radix-ui/react-accordion";
import { ChevronLeft } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import SyntaxHighlighter from "react-syntax-highlighter";
import { a11yDark, a11yLight } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { EmbeddedFactionCard } from "@/components/card/FactionCard";
import { EmbeddedTypeCard } from "@/components/card/TypeCard";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SECONDARY_COLOR } from "@/constant/color";
import { AU_IN_M } from "@/constant/unit";
import type { SolarSystem } from "@/data/schema";
import { getWormholeClassFromNative, getWormholeClassNameKey } from "@/data/universe";
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

    const {
        navigateToTypeDetail,
        navigateToFactionDetail,
        navigateToUniversePlanet,
        navigateToUniverseConstellation,
        navigateToUniverseRegion,
    } = useSPARouter();

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
            const region = await getRegionById(systemBrief.region_id);
            if (region) {
                regionName = await loc(region.name_id);
            }
            const constellation = await getConstellationById(systemBrief.constellation_id);
            if (constellation) {
                constellationName = await loc(constellation.name_id);
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
                                                navigateToUniverseConstellation(
                                                    systemBrief.constellation_id
                                                );
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
                                                navigateToUniverseRegion(systemBrief.region_id);
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
                <AttributePanel>
                    <AttributeTitle>
                        {t("explore.universe.system.system_attributes.title")}
                    </AttributeTitle>
                    <AttributeContent>
                        <Attribute>
                            <AttributeName>{t("terms.security_status")}</AttributeName>
                            <AttributeText
                                className="inline px-2 py-0.5 rounded"
                                style={{
                                    backgroundColor: SECONDARY_COLOR,
                                    color: getSecurityStatusColor(systemData.security),
                                }}
                            >
                                {systemData.security.toFixed(2)}
                            </AttributeText>
                        </Attribute>
                        <Attribute>
                            <AttributeName>{t("terms.luminosity")}</AttributeName>
                            <AttributeText>{systemData.luminosity.toFixed(6)}</AttributeText>
                        </Attribute>
                        <Attribute>
                            <AttributeName>{t("terms.radius")}</AttributeName>
                            <AttributeText>
                                {(systemData.radius / AU_IN_M).toLocaleString(language)} AU
                            </AttributeText>
                        </Attribute>
                        {systemData.factionId && (
                            <Attribute>
                                <AttributeName>
                                    {t("explore.universe.system.system_attributes.faction_id")}
                                </AttributeName>
                                <EmbeddedFactionCard
                                    className="mt-2"
                                    factionId={systemData.factionId}
                                    onClick={() => {
                                        if (!systemData.factionId) return;
                                        navigateToFactionDetail(systemData.factionId);
                                    }}
                                />
                            </Attribute>
                        )}
                        {systemData.sunTypeId && (
                            <Attribute>
                                <AttributeName>
                                    {t("explore.universe.system.system_attributes.sun_type_id")}
                                </AttributeName>
                                <EmbeddedTypeCard
                                    className="mt-2"
                                    typeId={systemData.sunTypeId}
                                    onClick={() => {
                                        if (!systemData.sunTypeId) return;
                                        navigateToTypeDetail(systemData.sunTypeId);
                                    }}
                                />
                            </Attribute>
                        )}
                        {systemData.sunFlareGraphicId && (
                            <Attribute>
                                <AttributeName>
                                    {t(
                                        "explore.universe.system.system_attributes.sun_flare_graphic_id"
                                    )}
                                </AttributeName>
                                <AttributeText>{systemData.sunFlareGraphicId}</AttributeText>
                            </Attribute>
                        )}
                    </AttributeContent>
                </AttributePanel>
                <Card>
                    <Accordion type="single" collapsible className="w-full" defaultValue="planets">
                        <AccordionItem value="planets">
                            <CardHeader className="w-full">
                                <AccordionTrigger className="text-base">
                                    <CardTitle>{t("explore.universe.system.planets")}</CardTitle>
                                </AccordionTrigger>
                            </CardHeader>
                            <AccordionContent asChild>
                                <ScrollArea>
                                    <CardContent className="grid grid-flow-row auto-rows-max grid-cols-2 md:grid-cols-3 gap-2 max-h-96">
                                        {systemData.planets.map((planetId) => (
                                            <EmbeddedUniverseObjectCard
                                                key={planetId}
                                                obj={{ type: "planet", id: planetId }}
                                                onClick={() => navigateToUniversePlanet(planetId)}
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
                        {t("explore.universe.system.hidden_attributes")}
                    </AttributeTitle>
                    <AttributeContent>
                        <Attribute>
                            <AttributeName>{t("terms.wormhole_class")}</AttributeName>
                            <AttributeText>
                                {systemData.wormholeClassId
                                    ? t(
                                          getWormholeClassNameKey(
                                              getWormholeClassFromNative(systemData.wormholeClassId)
                                          )
                                      )
                                    : t("common.none")}
                            </AttributeText>
                        </Attribute>
                        {systemData.warpTunnelOverwrite ? (
                            <Attribute>
                                <AttributeName>
                                    {t("explore.universe.system.warp_tunnel_overwrite")}
                                </AttributeName>
                                <AttributeText>
                                    {systemData.warpTunnelOverwrite.toFixed(0)}
                                </AttributeText>
                            </Attribute>
                        ) : null}
                        {systemData.systemWideCloud ? (
                            <Attribute>
                                <AttributeName>
                                    {t("explore.universe.system.system_wide_cloud")}
                                </AttributeName>
                                <AttributeText>
                                    {systemData.systemWideCloud.toFixed(0)}
                                </AttributeText>
                            </Attribute>
                        ) : null}
                        {systemData.visualEffect && systemData.visualEffect.length > 0 ? (
                            <Attribute>
                                <AttributeName>
                                    {t("explore.universe.system.visual_effect")}
                                </AttributeName>
                                <AttributeText>{systemData.visualEffect}</AttributeText>
                            </Attribute>
                        ) : null}
                        {systemData.disallowScanning && (
                            <Attribute>
                                <AttributeName>
                                    {t("explore.universe.system.disallow_scanning")}
                                </AttributeName>
                                <AttributeText>
                                    {systemData.disallowScanning ? t("common.yes") : t("common.no")}
                                </AttributeText>
                            </Attribute>
                        )}
                        {systemData.disallowCyno && (
                            <Attribute>
                                <AttributeName>
                                    {t("explore.universe.system.disallow_cyno")}
                                </AttributeName>
                                <AttributeText>
                                    {systemData.disallowCyno ? t("common.yes") : t("common.no")}
                                </AttributeText>
                            </Attribute>
                        )}
                        {systemData.position && (
                            <Attribute>
                                <AttributeName>
                                    {t("explore.universe.system.position")}
                                </AttributeName>
                                <AttributeText>
                                    <UniversePointDisplay point={systemData.position} />
                                </AttributeText>
                            </Attribute>
                        )}
                        {systemData.max && (
                            <Attribute>
                                <AttributeName>
                                    {t("explore.universe.system.boundary_max")}
                                </AttributeName>
                                <AttributeText>
                                    <UniversePointDisplay point={systemData.max} />
                                </AttributeText>
                            </Attribute>
                        )}
                        {systemData.min && (
                            <Attribute>
                                <AttributeName>
                                    {t("explore.universe.system.boundary_min")}
                                </AttributeName>
                                <AttributeText>
                                    <UniversePointDisplay point={systemData.min} />
                                </AttributeText>
                            </Attribute>
                        )}
                    </AttributeContent>
                </AttributePanel>
                <AttributePanel>
                    <AttributeTitle>
                        {t("explore.universe.system.unknown_attributes")}
                    </AttributeTitle>
                    <AttributeContent>
                        <Attribute>
                            <AttributeName>Fringe</AttributeName>
                            <AttributeText>
                                {systemData.fringe ? t("common.yes") : t("common.no")}
                            </AttributeText>
                        </Attribute>
                        <Attribute>
                            <AttributeName>Hub</AttributeName>
                            <AttributeText>
                                {systemData.hub ? t("common.yes") : t("common.no")}
                            </AttributeText>
                        </Attribute>
                        <Attribute>
                            <AttributeName>International</AttributeName>
                            <AttributeText>
                                {systemData.international ? t("common.yes") : t("common.no")}
                            </AttributeText>
                        </Attribute>
                        <Attribute>
                            <AttributeName>Regional</AttributeName>
                            <AttributeText>
                                {systemData.regional ? t("common.yes") : t("common.no")}
                            </AttributeText>
                        </Attribute>
                        <Attribute>
                            <AttributeName>border</AttributeName>
                            <AttributeText>
                                {systemData.border ? t("common.yes") : t("common.no")}
                            </AttributeText>
                        </Attribute>
                        <Attribute>
                            <AttributeName>corridor</AttributeName>
                            <AttributeText>
                                {systemData.corridor ? t("common.yes") : t("common.no")}
                            </AttributeText>
                        </Attribute>
                    </AttributeContent>
                </AttributePanel>
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

export const SystemDetailPageWrapper: React.FC = () => {
    const { t } = useTranslation();
    const { navigate, useRouteParams } = useSPARouter();

    const routeParams = useRouteParams("/explore/universe/system");
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

    return <SystemDetailPage systemId={id} />;
};
