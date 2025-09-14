import { AccordionItem } from "@radix-ui/react-accordion";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { ChevronLeft } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import SyntaxHighlighter from "react-syntax-highlighter";
import { a11yDark, a11yLight } from "react-syntax-highlighter/dist/esm/styles/hljs";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Planet } from "@/data/schema";
import { useTheme } from "@/hooks/useAppSettings";
import { useLocalization } from "@/hooks/useLocalization";
import { useSPARouter } from "@/hooks/useSPARouter";
import { useData } from "@/stores/dataStore";
import type { SystemBrief } from "@/types/data";
import { getPlanetName } from "@/utils/name";
import { CelestialAttributesPanel, CelestialStatisticsPanel } from "./_CelestialAttributes";

export interface PlanetDetailPageProps {
    planetId: number;
}

export const PlanetDetailPage: React.FC<PlanetDetailPageProps> = ({ planetId }) => {
    const { loc } = useLocalization();
    const { t } = useTranslation();
    const { theme } = useTheme();

    const [name, setName] = useState<string>("");
    const [regionName, setRegionName] = useState<string>("");
    const [constellationName, setConstellationName] = useState<string>("");
    const [systemName, setSystemName] = useState<string>("");

    const [planetData, setPlanetData] = useState<Planet | null>(null);
    const [systemBrief, setSystemBrief] = useState<SystemBrief | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(true);

    const {
        navigateToTypeDetail,
        navigateToUniverseSystem,
        navigateToUniverseConstellation,
        navigateToUniverseRegion,
        navigateToUniverseMoon,
        navigateToUniverseNpcStation,
    } = useSPARouter();

    const { getData } = useData();

    useEffect(() => {
        let mounted = true;
        setIsLoading(true);

        (async () => {
            const planet = await getData("getPlanetDataById", planetId);
            const systemId = planet.solarSystemId;
            const systemBrief = await getData("getSystemById", systemId);

            const systemName = await loc(systemBrief.name_id);
            const planetName = getPlanetName(
                planet.celestialIndex,
                systemName,
                planet.planetNameId ? await loc(planet.planetNameId) : undefined
            );

            let regionName = "";
            let constellationName = "";
            const region = await getData("getRegionById", systemBrief.region_id);
            if (region) {
                regionName = await loc(region.name_id);
            }
            const constellation = await getData(
                "getConstellationById",
                systemBrief.constellation_id
            );
            if (constellation) {
                constellationName = await loc(constellation.name_id);
            }

            if (mounted) {
                setPlanetData(planet);
                setSystemName(systemName);
                setSystemBrief(systemBrief);
                setName(planetName);
                setRegionName(regionName);
                setConstellationName(constellationName);
            }

            setIsLoading(false);
        })();

        return () => {
            mounted = false;
        };
    }, [planetId, loc, getData]);

    if (isLoading || !planetData || !systemBrief) {
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
                                                navigateToUniverseSystem(
                                                    systemBrief.solar_system_id
                                                );
                                            }}
                                        >
                                            {systemName ||
                                                t("explore.universe.detail.unknown_system")}
                                        </Button>
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
                                    <p className="text-sm text-muted-foreground">ID: {planetId}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <AttributePanel>
                    <AttributeTitle>
                        {t("explore.universe.planet.planet_attributes.title")}
                    </AttributeTitle>
                    <AttributeContent>
                        <Attribute>
                            <AttributeName>
                                {t("explore.universe.planet.planet_attributes.type_id")}
                            </AttributeName>
                            <EmbeddedTypeCard
                                className="mt-2"
                                typeId={planetData.typeId}
                                onClick={() => navigateToTypeDetail(planetData.typeId)}
                            />
                        </Attribute>
                    </AttributeContent>
                </AttributePanel>
                {planetData.statistics && (
                    <CelestialStatisticsPanel celestial={planetData.statistics} />
                )}
                {planetData.moons.length > 0 && (
                    <Card>
                        <Accordion
                            type="single"
                            collapsible
                            className="w-full"
                            defaultValue="moons"
                        >
                            <AccordionItem value="moons">
                                <CardHeader className="w-full">
                                    <AccordionTrigger className="text-base">
                                        <CardTitle>{t("explore.universe.planet.moons")}</CardTitle>
                                    </AccordionTrigger>
                                </CardHeader>
                                <AccordionContent asChild>
                                    <ScrollArea>
                                        <CardContent className="grid grid-flow-row auto-rows-max grid-cols-2 md:grid-cols-3 gap-2 max-h-96">
                                            {planetData.moons.map((moonId) => (
                                                <EmbeddedUniverseObjectCard
                                                    key={moonId}
                                                    obj={{
                                                        type: "moon",
                                                        id: moonId,
                                                    }}
                                                    compact={true}
                                                    onClick={() => {
                                                        navigateToUniverseMoon(moonId);
                                                    }}
                                                />
                                            ))}
                                        </CardContent>
                                    </ScrollArea>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </Card>
                )}
                {planetData.npcStations.length > 0 && (
                    <Card>
                        <Accordion
                            type="single"
                            collapsible
                            className="w-full"
                            defaultValue="moons"
                        >
                            <AccordionItem value="moons">
                                <CardHeader className="w-full">
                                    <AccordionTrigger className="text-base">
                                        <CardTitle>
                                            {t("explore.universe.planet.npc_stations")}
                                        </CardTitle>
                                    </AccordionTrigger>
                                </CardHeader>
                                <AccordionContent asChild>
                                    <ScrollArea>
                                        <CardContent className="grid grid-flow-row auto-rows-max grid-cols-2 md:grid-cols-3 gap-2 max-h-96">
                                            {planetData.npcStations.map((npcStationId) => (
                                                <EmbeddedUniverseObjectCard
                                                    key={npcStationId}
                                                    obj={{
                                                        type: "npc-station",
                                                        id: npcStationId,
                                                    }}
                                                    compact={true}
                                                    onClick={() => {
                                                        navigateToUniverseNpcStation(npcStationId);
                                                    }}
                                                />
                                            ))}
                                        </CardContent>
                                    </ScrollArea>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </Card>
                )}
                <AttributePanel>
                    <AttributeTitle>
                        {t("explore.universe.system.hidden_attributes")}
                    </AttributeTitle>
                    <AttributeContent>
                        {planetData.position && (
                            <Attribute>
                                <AttributeName>
                                    {t("explore.universe.planet.position")}
                                </AttributeName>
                                <AttributeText>
                                    <UniversePointDisplay point={planetData.position} />
                                </AttributeText>
                            </Attribute>
                        )}
                    </AttributeContent>
                </AttributePanel>
                {planetData.attributes && (
                    <CelestialAttributesPanel celestial={planetData.attributes} />
                )}
                <Card>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="show-json">
                            <CardHeader>
                                <AccordionTrigger className="text-base">
                                    <CardTitle>{t("common.data.raw_json_data")}</CardTitle>
                                </AccordionTrigger>
                            </CardHeader>
                            <AccordionContent>
                                <CardContent>
                                    <SyntaxHighlighter
                                        language="json"
                                        style={theme === "Light" ? a11yLight : a11yDark}
                                        showLineNumbers={true}
                                    >
                                        {JSON.stringify(planetData, null, 4)}
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

export const PlanetDetailPageWrapper: React.FC = () => {
    const { t } = useTranslation();
    const { navigate, useRouteParams } = useSPARouter();

    const routeParams = useRouteParams("/explore/universe/planet");
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

    return <PlanetDetailPage planetId={id} />;
};
