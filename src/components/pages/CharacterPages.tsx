"use client";

import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CharacterSkillsPage() {
    const { t } = useTranslation();
    
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">{t("nav.character.skills")}</h1>
            </div>
            
            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("character.skills.title")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{t("character.skills.description")}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export function CharacterAssetsPage() {
    const { t } = useTranslation();
    
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">{t("nav.character.assets")}</h1>
            </div>
            
            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("character.assets.title")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{t("character.assets.description")}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export function CharacterWalletPage() {
    const { t } = useTranslation();
    
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">{t("nav.character.wallet")}</h1>
            </div>
            
            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("character.wallet.title")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{t("character.wallet.description")}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
