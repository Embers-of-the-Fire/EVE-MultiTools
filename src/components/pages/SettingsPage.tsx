"use client";

import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLayout } from "@/components/layout/PageLayout";

export function SettingsPage() {
    const { t } = useTranslation();

    return (
        <PageLayout title={t("nav.settings")}>
            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("settings.title")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{t("settings.description")}</p>
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    );
}
