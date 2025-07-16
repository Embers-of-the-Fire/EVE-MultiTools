"use client";

import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLayout } from "@/components/layout/PageLayout";

export function CharacterSkillsPage() {
    const { t } = useTranslation();

    return (
        <PageLayout title={t("nav.character.skills")}>
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
        </PageLayout>
    );
}

export function CharacterAssetsPage() {
    const { t } = useTranslation();

    return (
        <PageLayout title={t("nav.character.assets")}>
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
        </PageLayout>
    );
}

export function CharacterWalletPage() {
    const { t } = useTranslation();

    return (
        <PageLayout title={t("nav.character.wallet")}>
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
        </PageLayout>
    );
}
