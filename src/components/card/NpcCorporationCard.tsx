import { useEffect, useState } from "react";
import { useLocalization } from "@/hooks/useLocalization";
import { useData } from "@/stores/dataStore";
import { getIconUrl } from "@/utils/image";
import GenericCard, { type BadgeConfig, type GenericData } from "./GenericCard";

interface NpcCorporationData extends GenericData {}

function useNpcCorporationData(npcCorporationId: number): NpcCorporationData {
    const [data, setData] = useState<NpcCorporationData>({
        name: "",
        description: "",
        badges: [],
        loading: true,
        id: npcCorporationId,
    });

    const { loc } = useLocalization();
    const { getData } = useData();

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

        getData("getNpcCorporationById", npcCorporationId).then(async (f) => {
            if (!f) {
                if (mounted) setData((d) => ({ ...d, loading: false }));
                return;
            }
            const [nameText, descText] = await Promise.all([
                loc(f.name_id),
                f.description_id ? loc(f.description_id) : Promise.resolve(""),
            ]);
            const badgeArr: BadgeConfig[] = [];

            if (mounted) {
                setData({
                    name: nameText || "",
                    description: descText || "",
                    iconUrl: f.icon_id ? (await getIconUrl(f.icon_id)) || undefined : undefined,
                    badges: badgeArr,
                    loading: false,
                    id: npcCorporationId,
                });
            }
        });
        return () => {
            mounted = false;
        };
    }, [npcCorporationId, loc, getData]);

    return data;
}

interface HoverNpcCorporationCardProps {
    npcCorporationId: number;
    className?: string;
}

export const HoverFactionCard: React.FC<HoverNpcCorporationCardProps> = ({
    npcCorporationId,
    className,
}) => {
    const corpData = useNpcCorporationData(npcCorporationId);

    return <GenericCard.Hover data={corpData} className={className} />;
};

interface EmbeddedNpcCorporationCardProps {
    npcCorporationId: number;
    title?: string;
    className?: string;
    compact?: boolean;
    showBadges?: boolean;
    onClick?: (factionId: number) => void;
    noBorder?: boolean;
}

export const EmbeddedNpcCorporationCard: React.FC<EmbeddedNpcCorporationCardProps> = ({
    npcCorporationId,
    title,
    className,
    compact = false,
    showBadges = true,
    onClick,
    noBorder = false,
}) => {
    const corpData = useNpcCorporationData(npcCorporationId);

    return (
        <GenericCard.Embed
            data={corpData}
            title={title}
            className={className}
            compact={compact}
            showBadges={showBadges}
            onClick={onClick ? () => onClick(npcCorporationId) : undefined}
            noBorder={noBorder}
        />
    );
};

interface NpcCorporationCardProps {
    npcCorporationId: number;
    className?: string;
    onClick?: (factionId: number) => void;
}

export const NpcCorporationCard: React.FC<NpcCorporationCardProps> = ({
    npcCorporationId,
    className,
    onClick,
}) => {
    const corporationData = useNpcCorporationData(npcCorporationId);
    return (
        <GenericCard.Card
            data={corporationData}
            className={className}
            onClick={onClick ? () => onClick(npcCorporationId) : undefined}
        />
    );
};
