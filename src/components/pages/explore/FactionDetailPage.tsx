import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { EmbeddedNpcCorporationCard } from "@/components/card/NpcCorporationCard";
import { EmbeddedUniverseObjectCard } from "@/components/card/UniverseObjectCard";
import { useLocalization } from "@/hooks/useLocalization";
import { useSPARouter } from "@/hooks/useSPARouter";
import { useData } from "@/stores/dataStore";
import type { Faction } from "@/types/data";
import { getFactionIconUrl, getFactionLogoUrl } from "@/utils/image";
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

interface FactionDetailPageProps {
    factionId: number;
}

export const FactionDetailPage: React.FC<FactionDetailPageProps> = ({ factionId }) => {
    const { t } = useTranslation();
    const { loc } = useLocalization();

    const { navigateToUniverseSystem, navigateToNpcCorporationDetail } = useSPARouter();

    const [faction, setFaction] = useState<Faction | null>(null);
    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [shortDescription, setShortDescription] = useState<string>("");
    const [iconUrl, setIconUrl] = useState<string | null>(null);
    const [factionLogoUrl, setFactionLogoUrl] = useState<string | null>(null);
    const [factionLogoNameUrl, setFactionLogoNameUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { getData } = useData();

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);

        const loadFactionDetails = async () => {
            try {
                const factionData = await getData("getFaction", factionId);
                if (!factionData) {
                    if (mounted) {
                        setError(t("explore.faction.detail.faction_not_found"));
                        setLoading(false);
                    }
                    return;
                }

                if (mounted) {
                    setFaction(factionData);
                }

                // 并行获取相关数据
                const [
                    nameText,
                    descText,
                    shortDescText,
                    factionIconUrl,
                    factionLogoUrl,
                    factionLogoNameUrl,
                ] = await Promise.all([
                    loc(factionData.name_id),
                    loc(factionData.description_id),
                    factionData.short_description_id
                        ? loc(factionData.short_description_id)
                        : Promise.resolve(""),
                    getFactionIconUrl(factionId),
                    factionData.flat_logo
                        ? getFactionLogoUrl(factionData.flat_logo)
                        : Promise.resolve(null),
                    factionData.flat_logo_with_name
                        ? getFactionLogoUrl(factionData.flat_logo_with_name)
                        : Promise.resolve(null),
                ]);

                if (!mounted) return;

                setName(nameText || "");
                setDescription(descText || "");
                setShortDescription(shortDescText || "");
                setIconUrl(factionIconUrl);
                setFactionLogoUrl(factionLogoUrl);
                setFactionLogoNameUrl(factionLogoNameUrl);

                if (mounted) {
                    setLoading(false);
                }
            } catch (err) {
                if (mounted) {
                    setError(
                        err instanceof Error ? err.message : t("explore.faction.detail.load_error")
                    );
                    setLoading(false);
                }
            }
        };

        loadFactionDetails();

        return () => {
            mounted = false;
        };
    }, [factionId, t, loc, getData]);

    if (loading) {
        return (
            <PageLayout title={t("explore.faction.detail.title")} description={t("common.loading")}>
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg">{t("common.loading")}</div>
                </div>
            </PageLayout>
        );
    }

    if (error || !faction) {
        return (
            <PageLayout title={t("explore.faction.detail.title")} description={t("common.error")}>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-red-500">
                            {error || t("explore.faction.detail.faction_not_found")}
                        </div>
                    </CardContent>
                </Card>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title={name || t("explore.faction.detail.faction", { factionId })}
            description={shortDescription}
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("explore.faction.detail.basic_info")}</CardTitle>
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
                            <div className="flex-1 space-y-4">
                                <div>
                                    <div className="text-2xl font-bold">{name}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {t("explore.faction.detail.faction_id")}: {factionId}
                                    </div>
                                </div>
                                {shortDescription && (
                                    <div>
                                        <h4 className="font-semibold mb-2">
                                            {t("explore.faction.detail.short_description")}
                                        </h4>
                                        <p className="text-muted-foreground">{shortDescription}</p>
                                    </div>
                                )}
                                {description && (
                                    <div>
                                        <h4 className="font-semibold mb-2">
                                            {t("explore.faction.detail.description")}
                                        </h4>
                                        <p className="text-muted-foreground">{description}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 属性信息 */}
                <AttributePanel>
                    <AttributeTitle>{t("explore.faction.detail.properties")}</AttributeTitle>
                    <AttributeContent>
                        <Attribute>
                            <AttributeName>{t("explore.faction.detail.size_factor")}</AttributeName>
                            <AttributeText>{faction.size_factor.toFixed(2)}</AttributeText>
                        </Attribute>

                        <Attribute>
                            <AttributeName>{t("explore.faction.detail.unique_name")}</AttributeName>
                            <AttributeText>
                                <Badge variant={faction.unique_name ? "default" : "secondary"}>
                                    {faction.unique_name ? t("common.yes") : t("common.no")}
                                </Badge>
                            </AttributeText>
                        </Attribute>

                        {faction.corporation_id && (
                            <Attribute>
                                <AttributeName>
                                    {t("explore.faction.detail.corporation_id")}
                                </AttributeName>
                                <AttributeText>
                                    <EmbeddedNpcCorporationCard
                                        className="mt-2"
                                        npcCorporationId={faction.corporation_id}
                                        onClick={() => {
                                            if (faction.corporation_id)
                                                navigateToNpcCorporationDetail(
                                                    faction.corporation_id
                                                );
                                        }}
                                    />
                                </AttributeText>
                            </Attribute>
                        )}

                        {faction.militia_corporation_id && (
                            <Attribute>
                                <AttributeName>
                                    {t("explore.faction.detail.militia_corporation_id")}
                                </AttributeName>
                                <AttributeText>{faction.militia_corporation_id}</AttributeText>
                            </Attribute>
                        )}

                        <Attribute>
                            <AttributeName>
                                {t("explore.faction.detail.solar_system_id")}
                            </AttributeName>
                            <AttributeText>
                                <EmbeddedUniverseObjectCard
                                    className="mt-2"
                                    obj={{
                                        type: "system",
                                        id: faction.solar_system_id,
                                    }}
                                    onClick={() => {
                                        navigateToUniverseSystem(faction.solar_system_id);
                                    }}
                                />
                            </AttributeText>
                        </Attribute>

                        <Attribute>
                            <AttributeName>{t("explore.faction.detail.icon_id")}</AttributeName>
                            <AttributeText>{faction.icon_id}</AttributeText>
                        </Attribute>
                    </AttributeContent>
                </AttributePanel>

                {/* 成员种族 */}
                {faction.member_races.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("explore.faction.detail.member_races")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {faction.member_races.map((raceId) => (
                                    <Badge key={raceId} variant="outline">
                                        {t("explore.faction.detail.race_id", { raceId })}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Logo 信息 */}
                {(faction.flat_logo || faction.flat_logo_with_name) && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("explore.faction.detail.logos")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-row gap-4">
                                {factionLogoUrl && faction.flat_logo && (
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground mb-2">
                                            {t("explore.faction.detail.flat_logo")}
                                        </div>
                                        <Image
                                            className="bg-muted p-2 rounded"
                                            src={factionLogoUrl}
                                            alt={faction.flat_logo}
                                            width={256}
                                            height={256}
                                        />
                                    </div>
                                )}
                                {factionLogoNameUrl && faction.flat_logo_with_name && (
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground mb-2">
                                            {t("explore.faction.detail.flat_logo_with_name")}
                                        </div>
                                        <Image
                                            className="bg-muted p-2 rounded"
                                            src={factionLogoNameUrl}
                                            alt={faction.flat_logo_with_name}
                                            width={256}
                                            height={256}
                                        />
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </PageLayout>
    );
};

export const FactionDetailPageWrapper: React.FC = () => {
    const { t } = useTranslation();
    const { navigate, useRouteParams } = useSPARouter();

    // Get parameters from the new router system
    const routeParams = useRouteParams("/explore/faction/detail");
    const factionId = routeParams?.factionId;

    useEffect(() => {
        // If no faction is selected, redirect to explore page
        if (!factionId) {
            navigate("/explore/faction");
        }
    }, [factionId, navigate]);

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

    return <FactionDetailPage factionId={factionId} />;
};
