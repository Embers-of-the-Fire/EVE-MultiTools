import type React from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSPARouter } from "@/hooks/useSPARouter";
import { useTypeExplore } from "@/hooks/useTypeExplore";
import { PageLayout } from "../../layout";
import { Card, CardContent } from "../../ui/card";
import { TypeDetailPage } from "./TypeDetailPage";

export const TypeDetailPageWrapper: React.FC = () => {
    const { t } = useTranslation();
    const { currentTypeID } = useTypeExplore();
    const { navigate } = useSPARouter();

    useEffect(() => {
        // If no type is selected, redirect to explore page
        if (!currentTypeID) {
            navigate("/explore/type", t("nav.explore.type"));
        }
    }, [currentTypeID, navigate, t]);

    if (!currentTypeID) {
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

    return <TypeDetailPage typeId={currentTypeID} />;
};
