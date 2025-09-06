import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SECONDARY_COLOR } from "@/constant/color";
import { getWormholeClassNameKey } from "@/data/universe";
import { useLocalization } from "@/hooks/useLocalization";
import { getFaction, getSystemById } from "@/native/data";
import { getSecurityStatusColor } from "@/utils/color";
import type { BadgeConfig, GenericData } from "../GenericCard";
import GenericCard from "../GenericCard";

function useSystemData(id: number): GenericData {
    const { loc } = useLocalization();
    const { t } = useTranslation();
    const [data, setData] = useState<GenericData>({
        imageComponent: <span>S</span>,
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
            const system = await getSystemById(id);
            if (!system) return;

            const name = (await loc(system.name_id)) || "";
            const description = "";

            const badges: BadgeConfig[] = [];

            if (system.faction_id) {
                const faction = await getFaction(system.faction_id);
                if (faction) {
                    const factionName = (await loc(faction.name_id)) || "";
                    badges.push({
                        text: factionName,
                        variant: "outline",
                        key: `faction-${system.faction_id}`,
                    });
                }
            }
            if (system.wormhole_class_id) {
                badges.push({
                    text: t(getWormholeClassNameKey(system.wormhole_class_id)),
                    variant: "default",
                    key: `wormhole-class-${system.wormhole_class_id}`,
                });
            }

            const security = system.security_status;
            badges.push({
                text: `${security.toFixed(2)}`,
                variant: "secondary",
                style: {
                    backgroundColor: SECONDARY_COLOR,
                    color: getSecurityStatusColor(security),
                },
                key: `security-${security}`,
            });

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

interface SystemCardProps {
    id: number;
    title?: string;
    className?: string;
    compact?: boolean;
    showBadges?: boolean;
    onClick?: (id: number) => void;
    noBorder?: boolean;
}

export const SystemCard: React.FC<SystemCardProps> = ({
    id,
    title,
    className,
    compact = false,
    showBadges = true,
    onClick,
    noBorder = false,
}) => {
    const data = useSystemData(id);

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
