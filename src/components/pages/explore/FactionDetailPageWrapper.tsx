import type React from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSPARouter } from "@/hooks/useSPARouter";
import { PageLayout } from "../../layout";
import { Card, CardContent } from "../../ui/card";
import { FactionDetailPage } from "./FactionDetailPage";

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
