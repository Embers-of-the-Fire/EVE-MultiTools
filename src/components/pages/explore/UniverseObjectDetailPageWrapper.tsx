import type React from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSPARouter } from "@/hooks/useSPARouter";
import { useUniverseExplore } from "@/hooks/useUniverseExplore";
import { PageLayout } from "../../layout";
import { Card, CardContent } from "../../ui/card";
import { ConstellationDetailPage } from "./universe-object-detail/ConstellationDetail";
import { RegionDetailPage } from "./universe-object-detail/RegionDetail";
import { SystemDetailPage } from "./universe-object-detail/SystemDetail";

export const UniverseObjectDetailPageWrapper: React.FC = () => {
    const { t } = useTranslation();
    const { currentUniverseObject } = useUniverseExplore();
    const { navigate } = useSPARouter();

    useEffect(() => {
        // If no universe object is selected, redirect to explore page
        if (!currentUniverseObject) {
            navigate("/explore/universe", t("nav.explore.universe"));
        }
    }, [currentUniverseObject, navigate, t]);

    if (!currentUniverseObject) {
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

    switch (currentUniverseObject.type) {
        case "system":
            return <SystemDetailPage systemId={currentUniverseObject.id} />;
        case "constellation":
            return <ConstellationDetailPage constellationId={currentUniverseObject.id} />;
        case "region":
            return <RegionDetailPage regionId={currentUniverseObject.id} />;
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
                                    type: currentUniverseObject.type,
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </PageLayout>
            );
    }
};
