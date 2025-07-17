import { useTranslation } from "react-i18next";
import { PageLayout } from "../layout";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export function ExplorePage() {
    const { t } = useTranslation();

    return (
        <PageLayout title={t("explore")}>
            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("explore")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{t("explore.description")}</p>
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    );
}
