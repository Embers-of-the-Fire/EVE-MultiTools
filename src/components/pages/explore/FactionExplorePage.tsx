import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { EmbeddedFactionCard } from "@/components/card/FactionCard";
import { HistoryButton } from "@/components/common/HistoryButton";
import { useFactionExplore } from "@/hooks/useFactionExplore";
import { useLocalization } from "@/hooks/useLocalization";
import { useSPARouter } from "@/hooks/useSPARouter";
import { getFaction, getFactionIds } from "@/native/data";
import { PageLayout } from "../../layout";
import { ScrollArea } from "../../ui/scroll-area";

type FactionData = { id: number; name: string; shortDescription?: string };

export function FactionHistoryButton() {
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
        <HistoryButton
            history={history}
            onItemClick={(id) => {
                setCurrentFactionID(id);
                navigate("/explore/faction/detail", t("explore.faction.detail.title"));
            }}
            emptyMessageKey="explore.faction.history.empty"
            detailRoute="/explore/faction/detail"
            detailTitleKey="explore.faction.detail.title"
            renderItem={renderItem}
        />
    );
}

export function FactionExplorePage() {
    const { t } = useTranslation();
    const { loc } = useLocalization();

    const { setCurrentFactionID } = useFactionExplore();
    const { navigate } = useSPARouter();

    const [factions, setFactions] = useState<FactionData[]>([]);
    const [loading, setLoading] = useState(true);

    // Handle faction card click event
    const handleFactionClick = (factionId: number) => {
        setCurrentFactionID(factionId);
        navigate("/explore/faction/detail", t("explore.faction.detail.title"));
    };

    useEffect(() => {
        let ignore = false;
        setLoading(true);

        (async () => {
            try {
                const factionIds = await getFactionIds();
                const items: FactionData[] = [];

                const factionPromises = factionIds.map(async (id) => {
                    try {
                        const faction = await getFaction(id);
                        if (!faction) return null;

                        const name = await loc(faction.name_id);
                        const shortDesc = faction.short_description_id
                            ? await loc(faction.short_description_id)
                            : undefined;

                        return {
                            id,
                            name: name || String(id),
                            shortDescription: shortDesc || undefined,
                        };
                    } catch {
                        return null;
                    }
                });

                const results = await Promise.all(factionPromises);

                // 过滤掉 null 值并按名称排序
                for (const result of results) {
                    if (result) {
                        items.push(result);
                    }
                }

                if (!ignore) {
                    setFactions(items);
                }
            } catch (error) {
                console.error("Failed to load factions:", error);
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            ignore = true;
        };
    }, [loc]);

    return (
        <PageLayout
            title={t("explore.faction.title")}
            description={t("explore.faction.desc")}
            actions={<FactionHistoryButton />}
        >
            <div className="pr-0 flex flex-col flex-1 min-h-0 w-full max-w-none">
                {loading && (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-lg">{t("common.loading")}</div>
                    </div>
                )}
                {!loading && factions.length > 0 && (
                    <ScrollArea className="border rounded-md bg-white dark:bg-black/30 shadow-sm p-4 my-2 flex-1 min-h-0 flex flex-col">
                        <div className="font-bold mb-4">
                            {t("explore.faction.all_factions")} ({factions.length})
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {factions.map((faction) => (
                                <EmbeddedFactionCard
                                    key={faction.id}
                                    factionId={faction.id}
                                    onClick={handleFactionClick}
                                />
                            ))}
                        </div>
                    </ScrollArea>
                )}
                {!loading && factions.length === 0 && (
                    <div className="text-center text-muted-foreground mt-8">
                        <p>{t("explore.faction.no_factions")}</p>
                    </div>
                )}
            </div>
        </PageLayout>
    );
}
