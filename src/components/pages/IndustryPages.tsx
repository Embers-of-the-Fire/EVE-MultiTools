"use client";

import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function IndustryManufacturingPage() {
    const { t } = useTranslation();
    
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">{t("nav.industry.manufacturing")}</h1>
            </div>
            
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
        </div>
    );
}

export function IndustryMiningPage() {
    const { t } = useTranslation();
    
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">{t("nav.industry.mining")}</h1>
            </div>
            
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
        </div>
    );
}

export function IndustryResearchPage() {
    const { t } = useTranslation();
    
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">{t("nav.industry.research")}</h1>
            </div>
            
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
        </div>
    );
}
