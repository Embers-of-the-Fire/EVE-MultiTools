import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getRegionTypeNameKey } from "@/data/universe";
import { useLocalization } from "@/hooks/useLocalization";
import { getFaction, getRegionById } from "@/native/data";
import type { BadgeConfig, GenericData } from "../GenericCard";
import GenericCard from "../GenericCard";

function useRegionData(id: number): GenericData {
    const { loc } = useLocalization();
    const { t } = useTranslation();
    const [data, setData] = useState<GenericData>({
        imageComponent: <span>R</span>,
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
            const region = await getRegionById(id);
            if (!region) return;

            const name = (await loc(region.name_id)) || "";
            const description = "";

            const badges: BadgeConfig[] = [];

            if (region.faction_id) {
                const faction = await getFaction(region.faction_id);
                if (faction) {
                    const factionName = (await loc(faction.name_id)) || "";
                    badges.push({
                        text: factionName,
                        variant: "outline",
                        key: `faction-${region.faction_id}`,
                    });
                }
            }
            if (region.region_type) {
                badges.push({
                    text: t(getRegionTypeNameKey(region.region_type)),
                    variant: "default",
                    key: `region-type-${region.region_type}`,
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

interface RegionCardProps {
    id: number;
    title?: string;
    className?: string;
    compact?: boolean;
    showBadges?: boolean;
    onClick?: (id: number) => void;
    noBorder?: boolean;
}

export const RegionCard: React.FC<RegionCardProps> = ({
    id,
    title,
    className,
    compact = false,
    showBadges = true,
    onClick,
    noBorder = false,
}) => {
    const data = useRegionData(id);

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
