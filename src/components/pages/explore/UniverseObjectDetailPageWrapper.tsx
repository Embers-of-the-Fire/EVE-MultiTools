import type React from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSPARouter } from "@/hooks/useSPARouter";
import { PageLayout } from "../../layout";
import { Card, CardContent } from "../../ui/card";
import { ConstellationDetailPage } from "./universe-object-detail/ConstellationDetail";
import { RegionDetailPage } from "./universe-object-detail/RegionDetail";
import { SystemDetailPage } from "./universe-object-detail/SystemDetail";

export const UniverseObjectDetailPageWrapper: React.FC = () => {
    const { t } = useTranslation();
    const { navigate, useRouteParams } = useSPARouter();

    // Get parameters from the new router system
    const routeParams = useRouteParams("/explore/universe/detail");
    const universeObject = routeParams;

    useEffect(() => {
        // If no universe object is selected, redirect to explore page
        if (!universeObject) {
            navigate("/explore/universe");
        }
    }, [universeObject, navigate]);

    if (!universeObject) {
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

    switch (universeObject.type) {
        case "system":
            return <SystemDetailPage systemId={universeObject.id} />;
        case "constellation":
            return <ConstellationDetailPage constellationId={universeObject.id} />;
        case "region":
            return <RegionDetailPage regionId={universeObject.id} />;
        default:
            return (
                <PageLayout
                    title={t("explore.universe.detail.title")}
                    description={t("common.error")}
                >
                    <Card>
                        <CardContent className="p-6">
                            <div className="text-muted-foreground">
                                {t("explore.universe.detail.unsupported_object_type", {
                                    type: universeObject.type,
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </PageLayout>
            );
    }
};
