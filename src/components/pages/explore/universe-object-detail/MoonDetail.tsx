import { AccordionItem } from "@radix-ui/react-accordion";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Moon } from "@/data/schema";
import { useTheme } from "@/hooks/useAppSettings";
import { useLocalization } from "@/hooks/useLocalization";
import { useSPARouter } from "@/hooks/useSPARouter";
import {
    getConstellationById,
    getMoonDataById,
    getPlanetById,
    getRegionById,
    getSystemById,
} from "@/native/data";
import type { PlanetBrief, SystemBrief } from "@/types/data";
import { getMoonName, getPlanetName } from "@/utils/name";
import { CelestialAttributesPanel, CelestialStatisticsPanel } from "./_CelestialAttributes";

export interface MoonDetailPageProps {
    moonId: number;
}

export const MoonDetailPage: React.FC<MoonDetailPageProps> = ({ moonId }) => {
    const { loc } = useLocalization();
    const { t } = useTranslation();
    const { theme } = useTheme();

    const [name, setName] = useState<string>("");
    const [regionName, setRegionName] = useState<string>("");
    const [constellationName, setConstellationName] = useState<string>("");
    const [systemName, setSystemName] = useState<string>("");
    const [planetName, setPlanetName] = useState<string>("");

    const [planetBrief, setPlanetBrief] = useState<PlanetBrief | null>(null);
    const [systemBrief, setSystemBrief] = useState<SystemBrief | null>(null);
    const [moonData, setMoonData] = useState<Moon | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(true);

    const {
        navigateToTypeDetail,
        navigateToUniverseSystem,
        navigateToUniverseConstellation,
        navigateToUniverseRegion,
        navigateToUniversePlanet,
        navigateToUniverseNpcStation,
    } = useSPARouter();

    useEffect(() => {
        let mounted = true;
        setIsLoading(true);

        (async () => {
            const moon = await getMoonDataById(moonId);
            const planetBrief = await getPlanetById(moon.planetId);
            const systemId = planetBrief.system_id;
            const systemBrief = await getSystemById(systemId);

            const systemName = await loc(systemBrief.name_id);
            const planetName = getPlanetName(
                planetBrief.celestial_index,
                systemName,
                planetBrief.planet_name_id ? await loc(planetBrief.planet_name_id) : undefined
            );
            const moonName = moon.moonNameId
                ? await loc(moon.moonNameId)
                : getMoonName(systemName, planetBrief.celestial_index, moon.celestialIndex, t);

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
                setName(moonName);
                setMoonData(moon);
                setPlanetName(planetName);
                setPlanetBrief(planetBrief);
                setSystemName(systemName);
                setSystemBrief(systemBrief);
                setPlanetName(planetName);
                setRegionName(regionName);
                setConstellationName(constellationName);
            }

            setIsLoading(false);
        })();

        return () => {
            mounted = false;
        };
    }, [moonId, loc, t]);

    if (isLoading || !moonData || !systemBrief) {
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
                                        M
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
                                                if (!planetBrief) return;
                                                navigateToUniversePlanet(planetBrief.planet_id);
                                            }}
                                        >
                                            {planetName ||
                                                t("explore.universe.detail.unknown_planet")}
                                        </Button>
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
                                    <p className="text-sm text-muted-foreground">ID: {moonId}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <AttributePanel>
                    <AttributeTitle>
                        {t("explore.universe.moon.moon_attributes.title")}
                    </AttributeTitle>
                    <AttributeContent>
                        <Attribute>
                            <AttributeName>
                                {t("explore.universe.moon.moon_attributes.type_id")}
                            </AttributeName>
                            <EmbeddedTypeCard
                                className="mt-2"
                                typeId={moonData.typeId}
                                onClick={() => navigateToTypeDetail(moonData.typeId)}
                            />
                        </Attribute>
                    </AttributeContent>
                </AttributePanel>
                {moonData.statistics && (
                    <CelestialStatisticsPanel celestial={moonData.statistics} />
                )}
                <Card>
                    <Accordion type="single" collapsible className="w-full" defaultValue="moons">
                        <AccordionItem value="moons">
                            <CardHeader className="w-full">
                                <AccordionTrigger className="text-base">
                                    <CardTitle>{t("explore.universe.moon.npc_stations")}</CardTitle>
                                </AccordionTrigger>
                            </CardHeader>
                            <AccordionContent asChild>
                                <ScrollArea>
                                    <CardContent className="grid grid-flow-row auto-rows-max grid-cols-2 md:grid-cols-3 gap-2 max-h-96">
                                        {moonData.npcStations.map((npcStationId) => (
                                            <EmbeddedUniverseObjectCard
                                                key={npcStationId}
                                                obj={{
                                                    type: "npc-station",
                                                    id: npcStationId,
                                                }}
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
                <AttributePanel>
                    <AttributeTitle>
                        {t("explore.universe.moon.hidden_attributes.title")}
                    </AttributeTitle>
                    <AttributeContent>
                        {moonData.position && (
                            <Attribute>
                                <AttributeName>
                                    {t("explore.universe.moon.hidden_attributes.position")}
                                </AttributeName>
                                <AttributeText>
                                    <UniversePointDisplay point={moonData.position} />
                                </AttributeText>
                            </Attribute>
                        )}
                    </AttributeContent>
                </AttributePanel>
                {moonData.attributes && (
                    <CelestialAttributesPanel celestial={moonData.attributes} />
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
                                        {JSON.stringify(moonData, null, 4)}
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

export const MoonDetailPageWrapper: React.FC = () => {
    const { t } = useTranslation();
    const { navigate, useRouteParams } = useSPARouter();

    const routeParams = useRouteParams("/explore/universe/moon");
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

    return <MoonDetailPage moonId={id} />;
};
