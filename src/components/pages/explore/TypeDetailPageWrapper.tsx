import type React from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSPARouter } from "@/hooks/useSPARouter";
import { PageLayout } from "../../layout";
import { Card, CardContent } from "../../ui/card";
import { TypeDetailPage } from "./TypeDetailPage";

export const TypeDetailPageWrapper: React.FC = () => {
    const { t } = useTranslation();
    const { navigate, useRouteParams } = useSPARouter();

    // Get parameters from the new router system
    const routeParams = useRouteParams("/explore/type/detail");
    const typeId = routeParams?.typeId;

    useEffect(() => {
        // If no type is selected, redirect to explore page
        if (!typeId) {
            navigate("/explore/type");
        }
    }, [typeId, navigate]);

    if (!typeId) {
        return (
            <PageLayout title={t("explore.type.detail.title")} description={t("common.error")}>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-muted-foreground">
                            {t("explore.type.detail.no_type_selected")}
                        </div>
                    </CardContent>
                </Card>
            </PageLayout>
        );
    }

    return <TypeDetailPage typeId={typeId} />;
};
