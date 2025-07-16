"use client";

import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DatabasePage() {
    const { t } = useTranslation();
    
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">{t("nav.database")}</h1>
            </div>
            
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
        </div>
    );
}
