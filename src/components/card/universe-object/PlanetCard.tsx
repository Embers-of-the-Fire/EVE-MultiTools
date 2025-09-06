import { useEffect, useState } from "react";
import { useLocalization } from "@/hooks/useLocalization";
import { getPlanetById, getSystemById, getType } from "@/native/data";
import { getPlanetName } from "@/utils/name";
import type { BadgeConfig, GenericData } from "../GenericCard";
import GenericCard from "../GenericCard";

function usePlanetData(id: number): GenericData {
    const { loc } = useLocalization();
    const [data, setData] = useState<GenericData>({
        imageComponent: <span>P</span>,
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
            const planet = await getPlanetById(id);
            if (!planet) return;

            const system = await getSystemById(planet.system_id);
            const systemName = (await loc(system.name_id)) || "";

            const name = getPlanetName(
                planet.celestial_index,
                systemName,
                planet.planet_name_id ? await loc(planet.planet_name_id) : undefined
            );

            const badges: BadgeConfig[] = [];

            const typeNameId = (await getType(planet.type_id))?.type_name_id;
            if (typeNameId) {
                badges.push({
                    className: "pr-0 pt-0.5",
                    text: (await loc(typeNameId)) || "",
                    variant: "default",
                    key: `type-${planet.type_id}`,
                });
            }

            if (mounted) {
                setData((d) => ({
                    ...d,
                    name,
                    description: "",
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
    }, [id, loc]);

    return data;
}

interface PlanetCardProps {
    id: number;
    title?: string;
    className?: string;
    compact?: boolean;
    showBadges?: boolean;
    onClick?: (id: number) => void;
    noBorder?: boolean;
}

export const PlanetCard: React.FC<PlanetCardProps> = ({
    id,
    title,
    className,
    compact = false,
    showBadges = true,
    onClick,
    noBorder = false,
}) => {
    const data = usePlanetData(id);

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
