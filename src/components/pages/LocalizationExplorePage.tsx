import { useTranslation } from "react-i18next";
import { PageLayout } from "../layout";

export function LocalizationExplorePage() {
    const { t } = useTranslation();
    return (
        <PageLayout
            title={t("explore.localization.title", "本地化/Localization")}
            description={t("explore.localization.desc", "探索本地化内容")}
        >
            <div>{t("explore.localization.content", "这里是本地化/Localization子页面")}</div>
        </PageLayout>
    );
}
