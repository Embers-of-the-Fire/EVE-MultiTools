import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SECONDARY_COLOR } from "@/constant/color";
import { getRegionTypeNameKey, getWormholeClassNameKey } from "@/data/universe";
import { useLocalization } from "@/hooks/useLocalization";
import { useData } from "@/stores/dataStore";
import type { UniverseObject, UniverseObjectType } from "@/types/universe";
import { getSecurityStatusColor } from "@/utils/color";
import { getMoonName, getPlanetName, getStationName } from "@/utils/name";
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
        case "planet":
            return "P";
        case "moon":
            return "M";
        case "npc-station":
            return "NS";
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

    const { getData } = useData();

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
                const region = await getData("getRegionById", obj.id);
                if (!region) return;

                name = (await loc(region.name_id)) || "";
                description = "";

                if (region.region_type) {
                    badges.push({
                        text: t(getRegionTypeNameKey(region.region_type)),
                        variant: "default",
                        key: `region-type-${region.region_type}`,
                    });
                }
            } else if (obj.type === "constellation") {
                const constellation = await getData("getConstellationById", obj.id);
                if (!constellation) return;

                name = (await loc(constellation.name_id)) || "";
                description = "";

                if (constellation.wormhole_class_id) {
                    badges.push({
                        text: t(getWormholeClassNameKey(constellation.wormhole_class_id)),
                        variant: "default",
                        key: `wormhole-class-${constellation.wormhole_class_id}`,
                    });
                }
            } else if (obj.type === "system") {
                const system = await getData("getSystemById", obj.id);

                name = (await loc(system.name_id)) || "";
                description = "";

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
            } else if (obj.type === "planet") {
                const planet = await getData("getPlanetById", obj.id);

                const system = await getData("getSystemById", planet.system_id);
                const systemName = (await loc(system.name_id)) || "";

                name = getPlanetName(
                    planet.celestial_index,
                    systemName,
                    planet.planet_name_id ? await loc(planet.planet_name_id) : undefined
                );

                const typeNameId = (await getData("getType", planet.type_id))?.type_name_id;
                if (typeNameId) {
                    badges.push({
                        className: "pr-0 pt-0.5",
                        text: (await loc(typeNameId)) || "",
                        variant: "default",
                        key: `type-${planet.type_id}`,
                    });
                }
            } else if (obj.type === "moon") {
                const moon = await getData("getMoonById", obj.id);

                const planet = await getData("getPlanetById", moon.planet_id);
                const system = await getData("getSystemById", planet.system_id);
                const systemName = (await loc(system.name_id)) || "";

                name = getMoonName(systemName, planet.celestial_index, moon.celestial_index, t);
            } else if (obj.type === "npc-station") {
                name = await getStationName(obj.id, getData, loc, t);
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
    }, [obj, loc, t, getData]);

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
