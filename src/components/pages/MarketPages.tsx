"use client";

import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MarketAnalysisPage() {
    const { t } = useTranslation();
    
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">{t("nav.market.analysis")}</h1>
            </div>
            
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
        </div>
    );
}

export function MarketOrdersPage() {
    const { t } = useTranslation();
    
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">{t("nav.market.orders")}</h1>
            </div>
            
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
        </div>
    );
}

export function MarketHistoryPage() {
    const { t } = useTranslation();
    
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">{t("nav.market.history")}</h1>
            </div>
            
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
        </div>
    );
}

export function MarketCalculatorPage() {
    const { t } = useTranslation();
    
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">{t("nav.market.tools.calculator")}</h1>
            </div>
            
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
        </div>
    );
}

export function MarketPredictorPage() {
    const { t } = useTranslation();
    
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">{t("nav.market.tools.predictor")}</h1>
            </div>
            
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
        </div>
    );
}
