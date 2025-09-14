import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import SyntaxHighlighter from "react-syntax-highlighter";
import { a11yDark, a11yLight } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { EmbeddedFactionCard } from "@/components/card/FactionCard";
import { EmbeddedNpcCorporationCard } from "@/components/card/NpcCorporationCard";
import { EmbeddedUniverseObjectCard } from "@/components/card/UniverseObjectCard";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { EXTENT_DICT } from "@/constant/localization";
import type { NpcCorporation } from "@/data/schema";
import { useTheme } from "@/hooks/useAppSettings";
import { useLocalization } from "@/hooks/useLocalization";
import { useSPARouter } from "@/hooks/useSPARouter";
import { useData } from "@/stores/dataStore";
import type { Faction } from "@/types/data";
import { getIconUrl } from "@/utils/image";
import {
    Attribute,
    AttributeContent,
    AttributeName,
    AttributePanel,
    AttributeText,
    AttributeTitle,
} from "../../common/AttributePanel";
import { PageLayout } from "../../layout";
import { Badge } from "../../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";

interface NpcCorporationDetailPageProps {
    npcCorporationId: number;
}

export const NpcCorporationDetailPage: React.FC<NpcCorporationDetailPageProps> = ({
    npcCorporationId,
}) => {
    const { t } = useTranslation();
    const { loc, uiLoc } = useLocalization();
    const { theme } = useTheme();

    const {
        navigateToUniverseSystem,
        navigateToNpcCorporationDetail,
        navigateToUniverseNpcStation,
        navigateToFactionDetail,
    } = useSPARouter();

    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [corpData, setCorpData] = useState<NpcCorporation | null>(null);
    const [faction, setFaction] = useState<Faction | null>(null);
    const [iconUrl, setIconUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [extent, setExtent] = useState<string>("");
    const [size, setSize] = useState<string>("");

    const { getData } = useData();

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);

        const loadNpcCorporationDetails = async () => {
            try {
                const npcCorporation = await getData("getNpcCorporationDataById", npcCorporationId);

                let faction = null;
                if (npcCorporation?.factionId) {
                    faction = await getData("getFaction", npcCorporation.factionId);
                }

                const [nameText, descText, iconUrl] = await Promise.all([
                    loc(npcCorporation.nameId),
                    npcCorporation.descriptionId
                        ? loc(npcCorporation.descriptionId)
                        : Promise.resolve(""),
                    npcCorporation.iconId
                        ? getIconUrl(npcCorporation.iconId)
                        : Promise.resolve(null),
                ]);

                const extent = await uiLoc(EXTENT_DICT[npcCorporation.extent]);
                const size =
                    npcCorporation.size !== undefined
                        ? await uiLoc(EXTENT_DICT[npcCorporation.size])
                        : "";

                if (mounted) {
                    setName(nameText);
                    setExtent(extent);
                    setSize(size);
                    setDescription(descText);
                    setCorpData(npcCorporation);
                    setFaction(faction);
                    setIconUrl(iconUrl);
                    setLoading(false);
                }
            } catch (err) {
                if (mounted) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : t("explore.npc_corporation.detail.load_error")
                    );
                    setLoading(false);
                }
            }
        };

        loadNpcCorporationDetails();

        return () => {
            mounted = false;
        };
    }, [npcCorporationId, t, loc, uiLoc, getData]);

    if (loading || !corpData) {
        return (
            <PageLayout
                title={t("explore.npc_corporation.detail.title")}
                description={t("common.loading")}
            >
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg">{t("common.loading")}</div>
                </div>
            </PageLayout>
        );
    }

    if (error || !faction) {
        return (
            <PageLayout
                title={t("explore.npc_corporation.detail.title")}
                description={t("common.error")}
            >
                <Card>
                    <CardContent className="p-6">
                        <div className="text-red-500">
                            {error || t("explore.npc_corporation.detail.npc_corporation_not_found")}
                        </div>
                    </CardContent>
                </Card>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title={
                name ||
                t("explore.npc_corporation.detail.npc_corporation", {
                    npcCorporationId,
                })
            }
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("explore.npc_corporation.detail.basic_info")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-start gap-6">
                            <div className="flex-shrink-0">
                                {iconUrl ? (
                                    <Image
                                        src={iconUrl}
                                        alt={name}
                                        width={64}
                                        height={64}
                                        className="bg-muted p-2 rounded"
                                    />
                                ) : (
                                    <div className="w-16 h-16 bg-muted flex items-center justify-center rounded">
                                        <span className="text-sm text-muted-foreground">N/A</span>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <div className="text-2xl font-bold">{name}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {t("explore.npc_corporation.detail.npc_corporation_id")}:{" "}
                                        {npcCorporationId}
                                    </div>
                                </div>
                                {description && (
                                    <div>
                                        <h4 className="font-semibold mb-2">
                                            {t("explore.npc_corporation.detail.description")}
                                        </h4>
                                        <p className="text-muted-foreground">{description}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <AttributePanel>
                    <AttributeTitle>
                        {t("explore.npc_corporation.detail.attributes.title")}
                    </AttributeTitle>
                    <AttributeContent>
                        <Attribute>
                            <AttributeName>
                                {t("explore.npc_corporation.detail.attributes.extent")}
                            </AttributeName>
                            <AttributeText>{extent}</AttributeText>
                        </Attribute>
                        {size.length > 0 && (
                            <Attribute>
                                <AttributeName>
                                    {t("explore.npc_corporation.detail.attributes.size")}
                                </AttributeName>
                                <AttributeText>{size}</AttributeText>
                            </Attribute>
                        )}

                        <Attribute>
                            <AttributeName>
                                {t("explore.npc_corporation.detail.attributes.min_security")}
                            </AttributeName>
                            <AttributeText>{corpData.minSecurity.toFixed(1)}</AttributeText>
                        </Attribute>

                        <Attribute>
                            <AttributeName>
                                {t("explore.npc_corporation.detail.attributes.public_shares")}
                            </AttributeName>
                            <AttributeText>{corpData.publicShares.toLocaleString()}</AttributeText>
                        </Attribute>
                        <Attribute>
                            <AttributeName>
                                {t("explore.npc_corporation.detail.attributes.shares")}
                            </AttributeName>
                            <AttributeText>{corpData.shares.toLocaleString()}</AttributeText>
                        </Attribute>
                        <Attribute>
                            <AttributeName>
                                {t("explore.npc_corporation.detail.attributes.tax_rate")}
                            </AttributeName>
                            <AttributeText>{(corpData.taxRate * 100).toFixed(2)}%</AttributeText>
                        </Attribute>
                        {corpData.uniqueName && (
                            <Attribute>
                                <AttributeName>
                                    {t("explore.npc_corporation.detail.attributes.unique_name")}
                                </AttributeName>
                                <AttributeText>{t("common.yes")}</AttributeText>
                            </Attribute>
                        )}

                        {corpData.ceoId && (
                            <Attribute>
                                <AttributeName>
                                    {t("explore.npc_corporation.detail.attributes.ceo_id")}
                                </AttributeName>
                                <AttributeText>{corpData.ceoId}</AttributeText>
                            </Attribute>
                        )}

                        {corpData.iconId && (
                            <Attribute>
                                <AttributeName>
                                    {t("explore.npc_corporation.detail.attributes.icon_id")}
                                </AttributeName>
                                <AttributeText>{corpData.iconId}</AttributeText>
                            </Attribute>
                        )}

                        {corpData.enemyId && (
                            <Attribute>
                                <AttributeName>
                                    {t("explore.npc_corporation.detail.attributes.enemy_id")}
                                </AttributeName>
                                <AttributeText>
                                    <EmbeddedNpcCorporationCard
                                        className="mt-2"
                                        npcCorporationId={corpData.enemyId}
                                        onClick={() => {
                                            navigateToNpcCorporationDetail(corpData.enemyId!);
                                        }}
                                    />
                                </AttributeText>
                            </Attribute>
                        )}
                        {corpData.friendId && (
                            <Attribute>
                                <AttributeName>
                                    {t("explore.npc_corporation.detail.attributes.friend_id")}
                                </AttributeName>
                                <AttributeText>
                                    <EmbeddedNpcCorporationCard
                                        className="mt-2"
                                        npcCorporationId={corpData.friendId}
                                        onClick={() => {
                                            navigateToNpcCorporationDetail(corpData.friendId!);
                                        }}
                                    />
                                </AttributeText>
                            </Attribute>
                        )}

                        {corpData.factionId && (
                            <Attribute>
                                <AttributeName>
                                    {t("explore.npc_corporation.detail.attributes.faction_id")}
                                </AttributeName>
                                <AttributeText>
                                    <EmbeddedFactionCard
                                        className="mt-2"
                                        factionId={corpData.factionId}
                                        onClick={() => {
                                            navigateToFactionDetail(corpData.factionId!);
                                        }}
                                    />
                                </AttributeText>
                            </Attribute>
                        )}

                        {corpData.sizeFactor !== undefined && (
                            <Attribute>
                                <AttributeName>
                                    {t("explore.npc_corporation.detail.attributes.size_factor")}
                                </AttributeName>
                                <AttributeText>{corpData.sizeFactor} x</AttributeText>
                            </Attribute>
                        )}

                        {corpData.solarSystemId && (
                            <Attribute>
                                <AttributeName>
                                    {t("explore.npc_corporation.detail.attributes.solar_system_id")}
                                </AttributeName>
                                <AttributeText>
                                    <EmbeddedUniverseObjectCard
                                        className="mt-2"
                                        obj={{
                                            type: "system",
                                            id: corpData.solarSystemId,
                                        }}
                                        onClick={() => {
                                            navigateToUniverseSystem(corpData.solarSystemId!);
                                        }}
                                    />
                                </AttributeText>
                            </Attribute>
                        )}
                        {corpData.stationId && (
                            <Attribute>
                                <AttributeName>
                                    {t("explore.npc_corporation.detail.attributes.station_id")}
                                </AttributeName>
                                <AttributeText>
                                    <EmbeddedUniverseObjectCard
                                        className="mt-2"
                                        obj={{
                                            type: "npc-station",
                                            id: corpData.stationId,
                                        }}
                                        onClick={() => {
                                            navigateToUniverseNpcStation(corpData.stationId!);
                                        }}
                                    />
                                </AttributeText>
                            </Attribute>
                        )}
                    </AttributeContent>
                </AttributePanel>
                <AttributePanel>
                    <AttributeTitle>
                        {t("explore.npc_corporation.detail.hidden_attributes.title")}
                    </AttributeTitle>
                    <AttributeContent>
                        {corpData.deleted && (
                            <Attribute>
                                <AttributeName>
                                    {t("explore.npc_corporation.detail.hidden_attributes.deleted")}
                                </AttributeName>
                                <AttributeText>{t("common.yes")}</AttributeText>
                            </Attribute>
                        )}

                        {corpData.hasPlayerPersonnelManager && (
                            <Attribute>
                                <AttributeName>
                                    {t(
                                        "explore.npc_corporation.detail.hidden_attributes.has_player_personnel_manager"
                                    )}
                                </AttributeName>
                                <AttributeText>{t("common.yes")}</AttributeText>
                            </Attribute>
                        )}

                        {corpData.allowedMemberRaces.length > 0 && (
                            <Attribute>
                                <AttributeName>
                                    {t("explore.npc_corporation.detail.attributes.member_races")}
                                </AttributeName>
                                <AttributeText className="mt-2 flex flex-wrap gap-2">
                                    {corpData.allowedMemberRaces.map((raceId) => (
                                        <Badge key={raceId} variant="outline">
                                            {t(
                                                "explore.npc_corporation.detail.hidden_attributes.race_tag",
                                                { raceId }
                                            )}
                                        </Badge>
                                    ))}
                                </AttributeText>
                            </Attribute>
                        )}
                        {corpData.raceId && (
                            <Attribute>
                                <AttributeName>
                                    {t("explore.npc_corporation.detail.hidden_attributes.race_id")}
                                </AttributeName>
                                <AttributeText>
                                    <Badge variant="outline">
                                        {t(
                                            "explore.npc_corporation.detail.hidden_attributes.race_tag",
                                            { raceId: corpData.raceId }
                                        )}
                                    </Badge>
                                </AttributeText>
                            </Attribute>
                        )}
                        {corpData.lpOfferTables.length > 0 && (
                            <Attribute>
                                <AttributeName>
                                    {t(
                                        "explore.npc_corporation.detail.hidden_attributes.lp_offer_tables"
                                    )}
                                </AttributeName>
                                <AttributeText className="mt-2 flex flex-wrap gap-2">
                                    <code>{corpData.lpOfferTables.join(", ")}</code>
                                </AttributeText>
                            </Attribute>
                        )}
                    </AttributeContent>
                </AttributePanel>
                {Object.keys(corpData.investors).length > 0 ? (
                    <Card>
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="investors">
                                <CardHeader>
                                    <AccordionTrigger className="text-base">
                                        <CardTitle>
                                            {t("explore.npc_corporation.detail.investors")}
                                        </CardTitle>
                                    </AccordionTrigger>
                                </CardHeader>
                                <AccordionContent className="pb-0">
                                    <CardContent>
                                        <table>
                                            <tbody>
                                                {Object.entries(corpData.investors).map(
                                                    ([investorId, share]) => (
                                                        <tr key={investorId}>
                                                            <td>
                                                                <EmbeddedNpcCorporationCard
                                                                    className="w-full"
                                                                    noBorder
                                                                    compact={true}
                                                                    npcCorporationId={Number(
                                                                        investorId
                                                                    )}
                                                                    onClick={() =>
                                                                        navigateToNpcCorporationDetail(
                                                                            Number(investorId)
                                                                        )
                                                                    }
                                                                />
                                                            </td>
                                                            <td className="pl-8 text-sm">
                                                                {share}%
                                                            </td>
                                                        </tr>
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </CardContent>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </Card>
                ) : null}

                <AttributePanel>
                    <AttributeTitle>
                        {t("explore.faction.detail.unknown_attributes.title")}
                    </AttributeTitle>
                    <AttributeContent>
                        <Attribute>
                            <AttributeName>
                                {t(
                                    "explore.npc_corporation.detail.unknown_attributes.minimum_join_standing"
                                )}
                            </AttributeName>
                            <AttributeText>
                                {corpData.minimumJoinStanding ? t("common.yes") : t("common.no")}
                            </AttributeText>
                        </Attribute>

                        <Attribute>
                            <AttributeName>
                                {t(
                                    "explore.npc_corporation.detail.unknown_attributes.send_char_termination_message"
                                )}
                            </AttributeName>
                            <AttributeText>
                                {corpData.sendCharTerminationMessage
                                    ? t("common.yes")
                                    : t("common.no")}
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
                                        {JSON.stringify(
                                            { ...corpData, corporationTrades: undefined },
                                            null,
                                            4
                                        )}
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

export const NpcCorporationDetailPageWrapper: React.FC = () => {
    const { t } = useTranslation();
    const { useRouteParams } = useSPARouter();

    // Get parameters from the new router system
    const routeParams = useRouteParams("/explore/npc-corporation/detail");
    const factionId = routeParams?.corporationId;

    if (!factionId) {
        return (
            <PageLayout title={t("explore.faction.detail.title")} description={t("common.error")}>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-muted-foreground">
                            {t("explore.faction.detail.no_faction_selected")}
                        </div>
                    </CardContent>
                </Card>
            </PageLayout>
        );
    }

    return <NpcCorporationDetailPage npcCorporationId={factionId} />;
};
