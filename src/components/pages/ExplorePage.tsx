import { Box, Earth, Languages, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSPARouter } from "@/hooks/useSPARouter";
import { PageLayout } from "../layout";
import { ShortcutCard } from "../ShortcutCard";

export function ExplorePage() {
    const { t } = useTranslation();
    const { navigate } = useSPARouter();

    return (
        <PageLayout title={t("nav.explore")} description={t("explore.description")}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                <ShortcutCard
                    title={t("explore.type.title")}
                    description={t("explore.type.desc")}
                    icon={<Box />}
                    onClick={() => navigate("/explore/type", "Type Explorer")}
                />
                <ShortcutCard
                    title={t("explore.faction.title")}
                    description={t("explore.faction.desc")}
                    icon={<Shield />}
                    onClick={() => navigate("/explore/faction", "Faction Explorer")}
                />
                <ShortcutCard
                    title={t("explore.localization.title")}
                    description={t("explore.localization.desc")}
                    icon={<Languages />}
                    onClick={() => navigate("/explore/localization", "Localization Explorer")}
                />
                <ShortcutCard
                    title={t("explore.universe.title")}
                    description={t("explore.universe.desc")}
                    icon={<Earth />}
                    onClick={() => navigate("/explore/universe", "Universe Explorer")}
                />
            </div>
        </PageLayout>
    );
}
