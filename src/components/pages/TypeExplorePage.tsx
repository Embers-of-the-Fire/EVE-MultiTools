import { useTranslation } from "react-i18next";
import { PageLayout } from "../layout";

export function TypeExplorePage() {
    const { t } = useTranslation();
    return (
        <PageLayout title={t("explore.type.title", "物品/Type")}
                    description={t("explore.type.desc", "探索所有物品类型")}
        >
            
            <div>{t("explore.type.content", "这里是物品/Type子页面")}</div>
        </PageLayout>
    );
}
