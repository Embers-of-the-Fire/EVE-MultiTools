"use client";

import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLayout } from "@/components/layout/PageLayout";

export function IndustryManufacturingPage() {
    const { t } = useTranslation();

    return (
        <PageLayout title={t("nav.industry.manufacturing")}>
            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("industry.manufacturing.title")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{t("industry.manufacturing.description")}</p>
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    );
}

export function IndustryMiningPage() {
    const { t } = useTranslation();

    return (
        <PageLayout title={t("nav.industry.mining")}>
            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("industry.mining.title")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{t("industry.mining.description")}</p>
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    );
}

export function IndustryResearchPage() {
    const { t } = useTranslation();

    return (
        <PageLayout title={t("nav.industry.research")}>
            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("industry.research.title")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{t("industry.research.description")}</p>
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    );
}
