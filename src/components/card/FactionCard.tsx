import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getFaction, getLocalizationByLang } from "@/native/data";
import { getIconUrl } from "@/utils/image";
import GenericCard, { type BadgeConfig, type GenericData } from "./GenericCard";

interface EmbeddedFactionCardProps {
    factionId: number;
    title?: string;
    className?: string;
    compact?: boolean;
    onClick?: (factionId: number) => void;
    noBorder?: boolean;
}

export const EmbeddedFactionCard: React.FC<EmbeddedFactionCardProps> = ({
    factionId,
    title,
    className,
    compact = false,
    onClick,
    noBorder = false,
}) => {
    const { i18n, t } = useTranslation();
    const [data, setData] = useState<GenericData>({
        name: "",
        description: "",
        iconUrl: null,
        badges: [],
        loading: true,
        id: factionId,
    });

    useEffect(() => {
        let mounted = true;
        setData((d) => ({
            ...d,
            loading: true,
            badges: [],
            name: "",
            description: "",
            iconUrl: null,
        }));
        getFaction(factionId).then(async (f) => {
            if (!f) {
                if (mounted) setData((d) => ({ ...d, loading: false }));
                return;
            }
            const lang = i18n.language === "zh" ? "zh" : "en";
            const [nameText, descText] = await Promise.all([
                getLocalizationByLang(f.name_id, lang),
                f.description_id
                    ? getLocalizationByLang(f.description_id, lang)
                    : Promise.resolve(""),
            ]);
            const badgeArr: BadgeConfig[] = [];
            if (f.unique_name) {
                badgeArr.push({
                    text: t("faction.unique_name"),
                    key: "unique",
                    variant: "secondary",
                });
            }
            if (mounted) {
                setData({
                    name: nameText || "",
                    description: descText || "",
                    iconUrl: await getIconUrl(f.icon_id),
                    badges: badgeArr,
                    loading: false,
                    id: factionId,
                });
            }
        });
        return () => {
            mounted = false;
        };
    }, [factionId, i18n.language, t]);

    return (
        <GenericCard.Embed
            data={data}
            title={title}
            className={className}
            compact={compact}
            onClick={onClick ? () => onClick(factionId) : undefined}
            noBorder={noBorder}
        />
    );
};
