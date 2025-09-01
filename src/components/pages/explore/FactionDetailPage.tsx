import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { EmbeddedFactionCard } from "@/components/card/FactionCard";
import { DetailPageActions } from "@/components/common/DetailPageActions";
import { useFactionExplore } from "@/hooks/useFactionExplore";
import { useLocalization } from "@/hooks/useLocalization";
import { useSPARouter } from "@/hooks/useSPARouter";
import { getFaction } from "@/native/data";
import type { Faction } from "@/types/data";
import { getFactionIconUrl, getFactionLogoUrl } from "@/utils/image";
import { PageLayout } from "../../layout";
import { Badge } from "../../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";

interface FactionDetailPageProps {
    factionId: number;
}

function FactionDetailPageActions() {
    const { history, setCurrentFactionID } = useFactionExplore();
    const { navigate } = useSPARouter();
    const { t } = useTranslation();

    const renderItem = (id: number, onClick: () => void) => (
        <EmbeddedFactionCard
            compact={true}
            showBadges={false}
            factionId={id}
            className="w-full px-2 py-1 bg-transparent hover:bg-gray-100 dark:hover:bg-black/30 transition-colors rounded-none"
            noBorder
            onClick={onClick}
        />
    );

    return (
        <DetailPageActions
            history={history}
            onItemClick={(id) => {
                setCurrentFactionID(id);
                navigate("/explore/faction/detail", t("explore.faction.detail.title"));
            }}
            backRoute="/explore/faction"
            emptyMessageKey="explore.faction.history.empty"
            detailRoute="/explore/faction/detail"
            detailTitleKey="explore.faction.detail.title"
            renderItem={renderItem}
        />
    );
}

export const FactionDetailPage: React.FC<FactionDetailPageProps> = ({ factionId }) => {
    const { t } = useTranslation();
    const { loc } = useLocalization();

    const [faction, setFaction] = useState<Faction | null>(null);
    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [shortDescription, setShortDescription] = useState<string>("");
    const [iconUrl, setIconUrl] = useState<string | null>(null);
    const [factionLogoUrl, setFactionLogoUrl] = useState<string | null>(null);
    const [factionLogoNameUrl, setFactionLogoNameUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);

        const loadFactionDetails = async () => {
            try {
                const factionData = await getFaction(factionId);
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
    }, [factionId, t, loc]);

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
            actions={<FactionDetailPageActions />}
        >
            <div className="space-y-6">
                {/* 基本信息 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            {iconUrl && (
                                <div
                                    className="w-12 h-12 bg-center bg-contain bg-no-repeat rounded"
                                    style={{ backgroundImage: `url(${iconUrl})` }}
                                    title={name}
                                />
                            )}
                            <div>
                                <div className="text-2xl font-bold">{name}</div>
                                <div className="text-sm text-muted-foreground">
                                    {t("explore.faction.detail.faction_id")}: {factionId}
                                </div>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
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
                    </CardContent>
                </Card>

                {/* 属性信息 */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t("explore.faction.detail.properties")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-muted-foreground">
                                    {t("explore.faction.detail.size_factor")}
                                </div>
                                <div>{faction.size_factor.toFixed(2)}</div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-sm font-medium text-muted-foreground">
                                    {t("explore.faction.detail.unique_name")}
                                </div>
                                <Badge variant={faction.unique_name ? "default" : "secondary"}>
                                    {faction.unique_name ? t("common.yes") : t("common.no")}
                                </Badge>
                            </div>

                            {faction.corporation_id && (
                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-muted-foreground">
                                        {t("explore.faction.detail.corporation_id")}
                                    </div>
                                    <div>{faction.corporation_id}</div>
                                </div>
                            )}

                            {faction.militia_corporation_id && (
                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-muted-foreground">
                                        {t("explore.faction.detail.militia_corporation_id")}
                                    </div>
                                    <div>{faction.militia_corporation_id}</div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="text-sm font-medium text-muted-foreground">
                                    {t("explore.faction.detail.solar_system_id")}
                                </div>
                                <div>{faction.solar_system_id}</div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-sm font-medium text-muted-foreground">
                                    {t("explore.faction.detail.icon_id")}
                                </div>
                                <div>{faction.icon_id}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

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
