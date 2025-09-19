import { AccordionItem } from "@radix-ui/react-accordion";
import { ChevronLeft } from "lucide-react";
import type React from "react";
import { Fragment, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import SyntaxHighlighter from "react-syntax-highlighter";
import { a11yDark, a11yLight } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { EmbeddedTypeCard } from "@/components/card/TypeCard";
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
import type { NpcStation } from "@/data/schema";
import { useTheme } from "@/hooks/useAppSettings";
import { useLocalization } from "@/hooks/useLocalization";
import { useSPARouter } from "@/hooks/useSPARouter";
import { useData } from "@/stores/dataStore";
import { getMoonName, getPlanetName, getStationName } from "@/utils/name";
import { displayPercent } from "@/utils/unit";

export interface NpcStationDetailPageProps {
    npcStationId: number;
}

export const NpcStationDetailPage: React.FC<NpcStationDetailPageProps> = ({ npcStationId }) => {
    const { loc } = useLocalization();
    const { t } = useTranslation();
    const { theme } = useTheme();

    const [name, setName] = useState<string>("");
    const [galaxyPosition, setGalaxyPosition] = useState<
        {
            name: string;
            onNavigate: () => void;
        }[]
    >([]);

    // const [planetBrief, setPlanetBrief] = useState<PlanetBrief | null>(null);
    // const [systemBrief, setSystemBrief] = useState<SystemBrief | null>(null);
    // const [moonData, setMoonData] = useState<Moon | null>(null);
    const [npcStationData, setNpcStationData] = useState<NpcStation | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(true);

    const {
        navigateToTypeDetail,
        navigateToUniverseSystem,
        navigateToUniverseConstellation,
        navigateToUniverseRegion,
        navigateToUniversePlanet,
        navigateToUniverseMoon,
    } = useSPARouter();

    const { getData } = useData();

    // biome-ignore lint/correctness/useExhaustiveDependencies: navigate funcs are constant
    useEffect(() => {
        let mounted = true;
        setIsLoading(true);

        (async () => {
            const position = [];
            const station = await getData("getNpcStationDataById", npcStationId);

            const systemId = station.solarSystemId;
            console.log(npcStationId, station);
            const systemBrief = await getData("getSystemById", systemId);

            const systemName = await loc(systemBrief.name_id);

            let planet = null;
            if (station.moonId) {
                const moon = await getData("getMoonById", station.moonId);
                console.log("moon2", moon);
                planet = await getData("getPlanetById", moon.planet_id);
                const moonName = moon.moon_name_id
                    ? await loc(moon.moon_name_id)
                    : getMoonName(systemName, planet.celestial_index, moon.celestial_index, t);
                position.push({
                    name: moonName,
                    onNavigate: () => navigateToUniverseMoon(moon.moon_id),
                });
            } else if (station.planetId) {
                planet = await getData("getPlanetById", station.planetId);
            }

            if (planet) {
                const planetName = planet.planet_name_id
                    ? await loc(planet.planet_name_id)
                    : getPlanetName(planet.celestial_index, systemName);
                position.push({
                    name: planetName,
                    onNavigate: () => navigateToUniversePlanet(planet.planet_id),
                });
            }

            position.push({
                name: systemName,
                onNavigate: () => navigateToUniverseSystem(systemBrief.solar_system_id),
            });
            const constellation = await getData(
                "getConstellationById",
                systemBrief.constellation_id
            );
            position.push({
                name: await loc(constellation.name_id),
                onNavigate: () => navigateToUniverseConstellation(constellation.constellation_id),
            });
            const region = await getData("getRegionById", systemBrief.region_id);
            position.push({
                name: await loc(region.name_id),
                onNavigate: () => navigateToUniverseRegion(region.region_id),
            });

            setGalaxyPosition(position.reverse());

            const name = await getStationName(npcStationId, getData, loc, t);

            if (mounted) {
                setName(name);
                setNpcStationData(station);
                setGalaxyPosition(position.reverse());
            }

            setIsLoading(false);
        })();

        return () => {
            mounted = false;
        };
    }, [npcStationId, loc, t, getData]);

    if (isLoading || !npcStationData) {
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
                                    <h2 className="text-2xl font-bold flex flex-col">
                                        {name}
                                        <div className="flex flex-row items-center gap-2 ml-8">
                                            {galaxyPosition.length > 0 &&
                                                galaxyPosition.map((pos) => (
                                                    <Fragment key={pos.name}>
                                                        <ChevronLeft className="text-sm h-[1em] w-[1em]" />
                                                        <Button
                                                            variant="link"
                                                            className="text-sm p-0"
                                                            onClick={pos.onNavigate}
                                                        >
                                                            {pos.name}
                                                        </Button>
                                                    </Fragment>
                                                ))}
                                        </div>
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        ID: {npcStationId}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <AttributePanel>
                    <AttributeTitle>
                        {t("explore.universe.npc_station.npc_station_attributes.title")}
                    </AttributeTitle>
                    <AttributeContent>
                        <Attribute>
                            <AttributeName>
                                {t(
                                    "explore.universe.npc_station.npc_station_attributes.operation_id"
                                )}
                            </AttributeName>
                            <AttributeText>{npcStationData.operationId}</AttributeText>
                        </Attribute>
                        <Attribute>
                            <AttributeName>
                                {t("explore.universe.npc_station.npc_station_attributes.owner_id")}
                            </AttributeName>
                            <AttributeText>{npcStationData.ownerId}</AttributeText>
                        </Attribute>
                        <Attribute>
                            <AttributeName>
                                {t("explore.universe.npc_station.npc_station_attributes.type_id")}
                            </AttributeName>
                            <EmbeddedTypeCard
                                className="mt-2"
                                typeId={npcStationData.typeId}
                                onClick={() => navigateToTypeDetail(npcStationData.typeId)}
                            />
                        </Attribute>
                        <Attribute>
                            <AttributeName>
                                {t(
                                    "explore.universe.npc_station.npc_station_attributes.is_conquerable"
                                )}
                            </AttributeName>
                            <AttributeText>
                                {npcStationData.isConquerable ? t("common.yes") : t("common.no")}
                            </AttributeText>
                        </Attribute>
                        <Attribute>
                            <AttributeName>
                                {t(
                                    "explore.universe.npc_station.npc_station_attributes.graphic_id"
                                )}
                            </AttributeName>
                            <AttributeText>{npcStationData.graphicId}</AttributeText>
                        </Attribute>
                        <Attribute>
                            <AttributeName>
                                {t(
                                    "explore.universe.npc_station.npc_station_attributes.reprocessing_efficiency"
                                )}
                            </AttributeName>
                            <AttributeText>
                                {displayPercent(npcStationData.reprocessingEfficiency)}
                            </AttributeText>
                        </Attribute>
                        <Attribute>
                            <AttributeName>
                                {t(
                                    "explore.universe.npc_station.npc_station_attributes.reprocessing_stations_take"
                                )}
                            </AttributeName>
                            <AttributeText>
                                {displayPercent(npcStationData.reprocessingStationsTake)}
                            </AttributeText>
                        </Attribute>
                    </AttributeContent>
                </AttributePanel>
                <AttributePanel>
                    <AttributeTitle>
                        {t("explore.universe.npc_station.hidden_attributes.title")}
                    </AttributeTitle>
                    <AttributeContent>
                        {npcStationData.position && (
                            <Attribute>
                                <AttributeName>
                                    {t("explore.universe.npc_station.hidden_attributes.position")}
                                </AttributeName>
                                <AttributeText>
                                    <UniversePointDisplay point={npcStationData.position} />
                                </AttributeText>
                            </Attribute>
                        )}
                        <Attribute>
                            <AttributeName>
                                {t("explore.universe.npc_station.hidden_attributes.orbit_id")}
                            </AttributeName>
                            <AttributeText>{npcStationData.orbitId}</AttributeText>
                        </Attribute>
                        <Attribute>
                            <AttributeName>
                                {t("explore.universe.npc_station.hidden_attributes.station_name")}
                            </AttributeName>
                            <AttributeText className="line-clamp-2">
                                {npcStationData.stationName}
                            </AttributeText>
                        </Attribute>
                        <Attribute>
                            <AttributeName>
                                {t(
                                    "explore.universe.npc_station.npc_station_attributes.use_operation_name"
                                )}
                            </AttributeName>
                            <AttributeText>
                                {npcStationData.useOperationName ? t("common.yes") : t("common.no")}
                            </AttributeText>
                        </Attribute>
                        <Attribute>
                            <AttributeName>
                                {t(
                                    "explore.universe.npc_station.npc_station_attributes.reprocessing_hangar_flag"
                                )}
                            </AttributeName>
                            <AttributeText>
                                {npcStationData.reprocessingHangarFlag || t("common.none")}
                            </AttributeText>
                        </Attribute>
                    </AttributeContent>
                </AttributePanel>
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
                                        {JSON.stringify(npcStationData, null, 4)}
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

export const NpcStationDetailPageWrapper: React.FC = () => {
    const { t } = useTranslation();
    const { navigate, useRouteParams } = useSPARouter();

    const routeParams = useRouteParams("/explore/universe/npc-station");
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

    return <NpcStationDetailPage npcStationId={id} />;
};
