"use client";

import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLayout } from "@/components/layout/PageLayout";

export function MarketAnalysisPage() {
    const { t } = useTranslation();

    return (
        <PageLayout title={t("nav.market.analysis")}>
            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("market.analysis.title")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{t("market.analysis.description")}</p>
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    );
}

export function MarketOrdersPage() {
    const { t } = useTranslation();

    return (
        <PageLayout title={t("nav.market.orders")}>
            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("market.orders.title")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{t("market.orders.description")}</p>
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    );
}

export function MarketHistoryPage() {
    const { t } = useTranslation();

    return (
        <PageLayout title={t("nav.market.history")}>
            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("market.history.title")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{t("market.history.description")}</p>
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    );
}

export function MarketCalculatorPage() {
    const { t } = useTranslation();

    return (
        <PageLayout title={t("nav.market.tools.calculator")}>
            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("market.calculator.title")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{t("market.calculator.description")}</p>
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    );
}

export function MarketPredictorPage() {
    const { t } = useTranslation();

    return (
        <PageLayout title={t("nav.market.tools.predictor")}>
            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("market.predictor.title")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{t("market.predictor.description")}</p>
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    );
}
