import { useEffect, useState } from "react";
import { useLocalization } from "@/hooks/useLocalization";
import { useData } from "@/stores/dataStore";
import { getIconUrl, getTypeImageUrl } from "@/utils/image";
import type { BadgeConfig, GenericData } from "./GenericCard";
import GenericCard from "./GenericCard";

function useTypeData(typeId: number): GenericData {
    const { loc } = useLocalization();
    const [data, setData] = useState<GenericData>({
        name: "",
        description: "",
        badges: [],
        loading: true,
        id: typeId,
        metaGroupIconUrl: undefined,
        metaGroupName: undefined,
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
            iconUrl: null,
            metaGroupIconUrl: undefined,
            metaGroupName: undefined,
        }));
        getData("getType", typeId).then(async (type) => {
            if (!type) {
                if (mounted) setData((d) => ({ ...d, loading: false }));
                return;
            }

            let categoryId: number | null = null;
            const group = await getData("getGroup", type.group_id);
            if (group) {
                categoryId = group.category_id;
            }

            const [nameText, descText, iconPath] = await Promise.all([
                loc(type.type_name_id),
                type.description_id ? loc(type.description_id) : Promise.resolve(""),
                getTypeImageUrl(type, categoryId),
            ]);

            const badgeArr: BadgeConfig[] = [];
            if (categoryId) {
                const category = await getData("getCategory", categoryId);
                if (category) {
                    badgeArr.push({
                        text: (await loc(category.category_name_id)) ?? "",
                        variant: "secondary",
                        key: `category-${categoryId}`,
                    });
                }
            }
            if (type.meta_group_id) {
                const meta = await getData("getMetaGroup", type.meta_group_id);
                if (meta?.name_id) {
                    badgeArr.push({
                        text: (await loc(meta.name_id)) ?? "",
                        variant: "outline",
                        key: `meta-${type.meta_group_id}`,
                    });
                }
            }

            let mgIcon: string | null = null;
            let mgName: string | null = null;
            if (type.meta_group_id) {
                const meta = await getData("getMetaGroup", type.meta_group_id);
                if (meta?.icon_id) {
                    mgIcon = await getIconUrl(meta.icon_id);
                }
                if (meta?.name_id) {
                    mgName = await loc(meta.name_id);
                }
            }

            if (mounted) {
                setData({
                    name: nameText || "",
                    description: descText || "",
                    iconUrl: iconPath || undefined,
                    badges: badgeArr,
                    loading: false,
                    id: typeId,
                    metaGroupIconUrl: mgIcon || undefined,
                    metaGroupName: mgName || undefined,
                });
            }
        });
        return () => {
            mounted = false;
        };
    }, [typeId, loc, getData]);

    return data;
}

interface HoverTypeCardProps {
    typeId: number;
    className?: string;
}

export const HoverTypeCard: React.FC<HoverTypeCardProps> = ({ typeId, className }) => {
    const typeData = useTypeData(typeId);

    return <GenericCard.Hover data={typeData} className={className} />;
};

interface EmbeddedTypeCardProps {
    typeId: number;
    title?: string;
    className?: string;
    compact?: boolean;
    showBadges?: boolean;
    onClick?: (typeId: number) => void;
    noBorder?: boolean;
}

export const EmbeddedTypeCard: React.FC<EmbeddedTypeCardProps> = ({
    typeId,
    title,
    className,
    compact = false,
    showBadges = true,
    onClick,
    noBorder = false,
}) => {
    const typeData = useTypeData(typeId);

    return (
        <GenericCard.Embed
            data={typeData}
            title={title}
            className={className}
            compact={compact}
            showBadges={showBadges}
            onClick={onClick ? () => onClick(typeId) : undefined}
            noBorder={noBorder}
        />
    );
};

interface TypeCardProps {
    typeId: number;
    className?: string;
    onClick?: (typeId: number) => void;
}

export const TypeCard: React.FC<TypeCardProps> = ({ typeId, className, onClick }) => {
    const typeData = useTypeData(typeId);
    return (
        <GenericCard.Card
            data={typeData}
            className={className}
            onClick={onClick ? () => onClick(typeId) : undefined}
        />
    );
};
