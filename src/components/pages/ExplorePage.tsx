import { useTranslation } from "react-i18next";
import { PageLayout } from "../layout";
import { useSPARouter } from "@/contexts/SPARouterContext";
import { ShortcutCard } from "../ShortcutCard";
import { Box, Earth, Languages } from "lucide-react";

export function ExplorePage() {
    const { t } = useTranslation();
    const { navigate } = useSPARouter();

    return (
        <PageLayout title={t("nav.explore")} description={t("explore.description")}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <ShortcutCard
                    title={t("explore.type.title")}
                    description={t("explore.type.desc", "探索所有物品类型")}
                    icon={<Box />}
                    onClick={() => navigate("/explore/type")}
                />
                <ShortcutCard
                    title={t("explore.localization.title")}
                    description={t("explore.localization.desc", "探索本地化内容")}
                    icon={<Languages />}
                    onClick={() => navigate("/explore/localization")}
                />
                <ShortcutCard
                    title={t("explore.universe.title")}
                    description={t("explore.universe.desc", "探索宇宙相关内容")}
                    icon={<Earth />}
                    onClick={() => navigate("/explore/universe")}
                />
            </div>
        </PageLayout>
    );
}
