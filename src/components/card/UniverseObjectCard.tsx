import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SECONDARY_COLOR } from "@/constant/color";
import { getRegionTypeNameKey, getWormholeClassNameKey } from "@/data/universe";
import { useLocalization } from "@/hooks/useLocalization";
import { getConstellationById, getFaction, getRegionById, getSystemById } from "@/native/data";
import type { UniverseObject, UniverseObjectType } from "@/stores/universeExploreStore";
import { getSecurityStatusColor } from "@/utils/color";
import type { BadgeConfig, GenericData } from "./GenericCard";
import GenericCard from "./GenericCard";

const getIconFromUniverseObjectType = (type: UniverseObjectType): string => {
    switch (type) {
        case "region":
            return "R";
        case "constellation":
            return "C";
        case "system":
            return "S";
    }
};

function useUniverseObjectData(obj: UniverseObject): GenericData {
    const { loc } = useLocalization();
    const { t } = useTranslation();
    const [data, setData] = useState<GenericData>({
        imageComponent: <span>{getIconFromUniverseObjectType(obj.type)}</span>,
        name: "",
        description: "",
        badges: [],
        loading: true,
        id: obj.id,
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
            let name = "";
            let description = "";
            const badges: BadgeConfig[] = [];

            if (obj.type === "region") {
                const region = await getRegionById(obj.id);
                if (!region) return;

                name = (await loc(region.name_id)) || "";
                description = "";

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
            } else if (obj.type === "constellation") {
                const constellation = await getConstellationById(obj.id);
                if (!constellation) return;

                name = (await loc(constellation.name_id)) || "";
                description = ""; // Constellations may not have descriptions

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
            } else if (obj.type === "system") {
                const system = await getSystemById(obj.id);
                if (!system) return;

                name = (await loc(system.name_id)) || "";
                description = ""; // Systems may not have descriptions

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
            }

            if (mounted) {
                setData((d) => ({
                    ...d,
                    name,
                    description,
                    badges,
                    loading: false,
                    id: obj.id,
                    orientation: "horizontal",
                }));
            }
        };

        fetchData();

        return () => {
            mounted = false;
        };
    }, [obj, loc, t]);

    return data;
}

interface EmbeddedUniverseObjectCardProps {
    obj: UniverseObject;
    title?: string;
    className?: string;
    compact?: boolean;
    showBadges?: boolean;
    onClick?: (obj: UniverseObject) => void;
    noBorder?: boolean;
}

export const EmbeddedUniverseObjectCard: React.FC<EmbeddedUniverseObjectCardProps> = ({
    obj,
    title,
    className,
    compact = false,
    showBadges = true,
    onClick,
    noBorder = false,
}) => {
    const data = useUniverseObjectData(obj);

    return (
        <GenericCard.Embed
            data={data}
            title={title}
            className={className}
            compact={compact}
            showBadges={showBadges}
            onClick={onClick ? () => onClick(obj) : undefined}
            noBorder={noBorder}
        />
    );
};
