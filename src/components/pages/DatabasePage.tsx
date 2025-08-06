"use client";

import { useTranslation } from "react-i18next";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DatabasePage() {
    const { t } = useTranslation();

    return (
        <PageLayout title={t("nav.database")}>
            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("database.title")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{t("database.description")}</p>
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    );
}
