import type React from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useFactionExplore } from "@/hooks/useFactionExplore";
import { useSPARouter } from "@/hooks/useSPARouter";
import { PageLayout } from "../../layout";
import { Card, CardContent } from "../../ui/card";
import { FactionDetailPage } from "./FactionDetailPage";

export const FactionDetailPageWrapper: React.FC = () => {
    const { t } = useTranslation();
    const { currentFactionID } = useFactionExplore();
    const { navigate } = useSPARouter();

    useEffect(() => {
        // If no type is selected, redirect to explore page
        if (!currentFactionID) {
            navigate("/explore/faction", t("nav.explore.faction"));
        }
    }, [currentFactionID, navigate, t]);

    if (!currentFactionID) {
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

    return <FactionDetailPage factionId={currentFactionID} />;
};
