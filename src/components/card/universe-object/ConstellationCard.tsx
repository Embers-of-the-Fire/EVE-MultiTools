import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getWormholeClassNameKey } from "@/data/universe";
import { useLocalization } from "@/hooks/useLocalization";
import { getConstellationById, getFaction } from "@/native/data";
import type { BadgeConfig, GenericData } from "../GenericCard";
import GenericCard from "../GenericCard";

function useConstellationData(id: number): GenericData {
    const { loc } = useLocalization();
    const { t } = useTranslation();
    const [data, setData] = useState<GenericData>({
        imageComponent: <span>C</span>,
        name: "",
        description: "",
        badges: [],
        loading: true,
        id,
        orientation: "horizontal",
    });

    useEffect(() => {
        let mounted = true;
        setData((d) => ({
            ...d,
            loading: true,
            badges: [],
            name: "",
            description: "",
        }));

        const fetchData = async () => {
            const constellation = await getConstellationById(id);
            if (!constellation) return;

            const name = (await loc(constellation.name_id)) || "";
            const description = "";

            const badges: BadgeConfig[] = [];

            if (constellation.faction_id) {
                const faction = await getFaction(constellation.faction_id);
                if (faction) {
                    const factionName = (await loc(faction.name_id)) || "";
                    badges.push({
                        text: factionName,
                        variant: "outline",
                        key: `faction-${constellation.faction_id}`,
                    });
                }
            }
            if (constellation.wormhole_class_id) {
                badges.push({
                    text: t(getWormholeClassNameKey(constellation.wormhole_class_id)),
                    variant: "default",
                    key: `wormhole-class-${constellation.wormhole_class_id}`,
                });
            }

            if (mounted) {
                setData((d) => ({
                    ...d,
                    name,
                    description,
                    badges,
                    loading: false,
                    id,
                    orientation: "horizontal",
                }));
            }
        };

        fetchData();

        return () => {
            mounted = false;
        };
    }, [id, loc, t]);

    return data;
}

interface ConstellationCardProps {
    id: number;
    title?: string;
    className?: string;
    compact?: boolean;
    showBadges?: boolean;
    onClick?: (id: number) => void;
    noBorder?: boolean;
}

export const ConstellationCard: React.FC<ConstellationCardProps> = ({
    id,
    title,
    className,
    compact = false,
    showBadges = true,
    onClick,
    noBorder = false,
}) => {
    const data = useConstellationData(id);

    return (
        <GenericCard.Embed
            data={data}
            title={title}
            className={className}
            compact={compact}
            showBadges={showBadges}
            onClick={onClick ? () => onClick(id) : undefined}
            noBorder={noBorder}
        />
    );
};
