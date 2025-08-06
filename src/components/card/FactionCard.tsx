import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getFaction, getLocalizationByLang } from "@/native/data";
import { getFactionIconUrl } from "@/utils/image";
import GenericCard, { type BadgeConfig, type GenericData } from "./GenericCard";

interface FactionData extends GenericData {
    uniqueName?: boolean;
}

function useFactionData(factionId: number): FactionData {
    const { i18n, t } = useTranslation();
    const [data, setData] = useState<FactionData>({
        name: "",
        description: "",
        iconUrl: null,
        badges: [],
        loading: true,
        id: factionId,
        uniqueName: false,
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
            uniqueName: false,
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
                    iconUrl: await getFactionIconUrl(factionId),
                    badges: badgeArr,
                    loading: false,
                    id: factionId,
                    uniqueName: f.unique_name,
                });
            }
        });
        return () => {
            mounted = false;
        };
    }, [factionId, i18n.language, t]);

    return data;
}

interface HoverFactionCardProps {
    factionId: number;
    className?: string;
}

export const HoverFactionCard: React.FC<HoverFactionCardProps> = ({ factionId, className }) => {
    const factionData = useFactionData(factionId);

    return <GenericCard.Hover data={factionData} className={className} />;
};

interface EmbeddedFactionCardProps {
    factionId: number;
    title?: string;
    className?: string;
    compact?: boolean;
    showBadges?: boolean;
    onClick?: (factionId: number) => void;
    noBorder?: boolean;
}

export const EmbeddedFactionCard: React.FC<EmbeddedFactionCardProps> = ({
    factionId,
    title,
    className,
    compact = false,
    showBadges = true,
    onClick,
    noBorder = false,
}) => {
    const factionData = useFactionData(factionId);

    return (
        <GenericCard.Embed
            data={factionData}
            title={title}
            className={className}
            compact={compact}
            showBadges={showBadges}
            onClick={onClick ? () => onClick(factionId) : undefined}
            noBorder={noBorder}
        />
    );
};

interface FactionCardProps {
    factionId: number;
    className?: string;
    onClick?: (factionId: number) => void;
}

export const FactionCard: React.FC<FactionCardProps> = ({ factionId, className, onClick }) => {
    const factionData = useFactionData(factionId);
    return (
        <GenericCard.Card
            data={factionData}
            className={className}
            onClick={onClick ? () => onClick(factionId) : undefined}
        />
    );
};
