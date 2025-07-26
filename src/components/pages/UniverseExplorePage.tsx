import { useTranslation } from "react-i18next";
import { PageLayout } from "../layout";

export function UniverseExplorePage() {
    const { t } = useTranslation();
    return (
        <PageLayout
            title={t("explore.universe.title", "宇宙/Universe")}
            description={t("explore.universe.desc", "探索宇宙相关内容")}
        >
            <div>{t("explore.universe.content", "这里是宇宙/Universe子页面")}</div>
        </PageLayout>
    );
}
