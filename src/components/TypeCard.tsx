import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CATEGORY_ID_BLUEPRINT } from "@/constant/eve";
import { useLanguage } from "@/hooks/useAppSettings";
import { cn } from "@/lib/utils";
import {
    getCategory,
    getGroup,
    getLocalizationByLang,
    getMetaGroup,
    getSkinMaterialIdByLicense,
    getType,
} from "@/native/data";
import { GraphicType } from "@/types/data";
import { getGraphicUrl, getIconUrl, getSkinMaterialUrl } from "@/utils/image";
import TypeImage from "./TypeImage";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

// 共享的类型数据状态和逻辑
interface TypeData {
    name: string;
    description: string;
    iconUrl: string | null;
    categoryName: string | null;
    metaGroupName: string | null;
    metaGroupIconUrl: string | null;
    loading: boolean;
}

// 自定义钩子：获取类型数据
function useTypeData(typeId: number): TypeData {
    const { language } = useLanguage();
    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [iconUrl, setIconUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [metaGroupIconUrl, setMetaGroupIconUrl] = useState<string | null>(null);
    const [categoryName, setCategoryName] = useState<string | null>(null);
    const [metaGroupName, setMetaGroupName] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setMetaGroupIconUrl(null);

        getType(typeId).then(async (type) => {
            if (!type) {
                if (mounted) setLoading(false);
                return;
            }

            let categoryId: number | null = null;
            const group = await getGroup(type.group_id);
            if (group) {
                categoryId = group.category_id;
            }

            const [nameText, descText, iconPath] = await Promise.all([
                getLocalizationByLang(type.type_name_id, language),
                type.description_id
                    ? getLocalizationByLang(type.description_id, language)
                    : Promise.resolve(""),
                type.icon_id
                    ? getIconUrl(type.icon_id)
                    : type.graphic_id
                      ? getGraphicUrl(
                            type.graphic_id,
                            categoryId === CATEGORY_ID_BLUEPRINT
                                ? GraphicType.Blueprint
                                : GraphicType.Icon
                        )
                      : (async () => {
                            const skinMatId = await getSkinMaterialIdByLicense(type.type_id);
                            if (skinMatId === null) return null;
                            return getSkinMaterialUrl(skinMatId);
                        })(),
            ]);

            let catName: string | null = null;
            if (categoryId) {
                const category = await getCategory(categoryId);
                if (category) {
                    catName = `${categoryId}|${await getLocalizationByLang(category.category_name_id, language)}`;
                }
            }

            let mgIcon: string | null = null;
            let mgName: string | null = null;
            if (type.meta_group_id) {
                const meta = await getMetaGroup(type.meta_group_id);
                if (meta?.icon_id) {
                    mgIcon = await getIconUrl(meta.icon_id);
                }
                if (meta?.name_id) {
                    mgName = await getLocalizationByLang(meta.name_id, language);
                }
            }

            if (mounted) {
                setName(nameText || "");
                setDescription(descText || "");
                setIconUrl(iconPath);
                setMetaGroupIconUrl(mgIcon);
                setCategoryName(catName);
                setMetaGroupName(mgName || null);
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
        };
    }, [typeId, language]);

    return {
        name,
        description,
        iconUrl,
        categoryName,
        metaGroupName,
        metaGroupIconUrl,
        loading,
    };
}

// 1. 搜索栏形式 - 用于搜索结果列表
interface SearchTypeCardProps {
    typeId: number;
    className?: string;
    onClick?: (typeId: number) => void;
}

export const SearchTypeCard: React.FC<SearchTypeCardProps> = ({ typeId, className, onClick }) => {
    const { t } = useTranslation();
    const typeData = useTypeData(typeId);

    const handleClick = () => onClick?.(typeId);
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick?.(typeId);
        }
    };

    const containerProps = onClick
        ? {
              onClick: handleClick,
              onKeyDown: handleKeyDown,
              role: "button" as const,
              tabIndex: 0,
          }
        : {};

    return (
        <div
            className={cn(
                "flex items-center gap-3 p-3 rounded shadow-sm bg-white dark:bg-black min-w-[220px] max-w-full",
                onClick
                    ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    : "",
                className
            )}
            {...containerProps}
        >
            <TypeImage
                iconUrl={typeData.iconUrl}
                alt={typeData.name}
                loading={typeData.loading}
                onError={() => {}}
                metaGroupIconUrl={typeData.metaGroupIconUrl}
                metaGroupName={typeData.metaGroupName ?? undefined}
            />
            <div className="flex flex-col flex-1 min-w-0">
                <div className="font-semibold text-base truncate">
                    {typeData.loading ? t("common.loading") : typeData.name}
                </div>
                <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {typeData.loading ? "" : typeData.description}
                </div>
            </div>
            <div className="shrink-0 text-sm text-gray-500">
                ID {typeId}
                <br />
                {t("explore.type.category")}{" "}
                {typeData.categoryName ? typeData.categoryName : t("common.unknown")}
            </div>
        </div>
    );
};

// 2. 悬浮卡片形式 - 用于悬浮提示
interface HoverTypeCardProps {
    typeId: number;
    className?: string;
}

export const HoverTypeCard: React.FC<HoverTypeCardProps> = ({ typeId, className }) => {
    const typeData = useTypeData(typeId);

    if (typeData.loading) {
        return (
            <Card className={cn("w-80 shadow-lg", className)}>
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn("w-80 shadow-lg", className)}>
            <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 shrink-0">
                        <TypeImage
                            iconUrl={typeData.iconUrl}
                            alt={typeData.name}
                            loading={false}
                            onError={() => {}}
                            metaGroupIconUrl={typeData.metaGroupIconUrl}
                            metaGroupName={typeData.metaGroupName ?? undefined}
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{typeData.name}</CardTitle>
                        <div className="text-sm text-muted-foreground">ID: {typeId}</div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                {typeData.description && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-3">
                        {typeData.description}
                    </p>
                )}
                <div className="flex gap-2 flex-wrap">
                    {typeData.categoryName && (
                        <Badge variant="secondary" className="text-xs">
                            {typeData.categoryName.split("|")[1] || typeData.categoryName}
                        </Badge>
                    )}
                    {typeData.metaGroupName && (
                        <Badge variant="outline" className="text-xs">
                            {typeData.metaGroupName}
                        </Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

// 3. 嵌入卡片形式 - 用于展示相关类型信息
interface EmbeddedTypeCardProps {
    typeId: number;
    title?: string;
    className?: string;
    compact?: boolean;
    onClick?: (typeId: number) => void;
}

export const EmbeddedTypeCard: React.FC<EmbeddedTypeCardProps> = ({
    typeId,
    title,
    className,
    compact = false,
    onClick,
}) => {
    const typeData = useTypeData(typeId);

    const handleClick = () => onClick?.(typeId);

    if (typeData.loading) {
        return (
            <Card className={cn("w-full", className)}>
                {title && (
                    <CardHeader className={cn("pb-2", compact && "py-2")}>
                        <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    </CardHeader>
                )}
                <CardContent className={cn("p-4", compact && "p-3")}>
                    <div className="flex items-center gap-3">
                        <div
                            className={cn(
                                "bg-gray-200 dark:bg-gray-700 rounded animate-pulse shrink-0",
                                compact ? "w-8 h-8" : "w-12 h-12"
                            )}
                        />
                        <div className="flex-1">
                            <div className={cn("bg-gray-200 dark:bg-gray-700 rounded mb-1 animate-pulse",
                                compact ? "h-3" : "h-4")} />
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card
            className={cn(
                "w-full",
                onClick &&
                    "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors",
                className
            )}
            onClick={onClick ? handleClick : undefined}
        >
            {title && (
                <CardHeader className={cn("pb-2", compact && "py-2")}>
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                </CardHeader>
            )}
            <CardContent className={cn("p-4", compact && "p-3")}>
                <div className="flex items-center gap-3">
                    <div className={cn("shrink-0 relative overflow-hidden rounded", 
                        compact ? "w-8 h-8" : "w-12 h-12")}>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className={cn("transform origin-center", compact ? "scale-50" : "scale-75")}>
                                <TypeImage
                                    iconUrl={typeData.iconUrl}
                                    alt={typeData.name}
                                    loading={false}
                                    onError={() => {}}
                                    metaGroupIconUrl={typeData.metaGroupIconUrl}
                                    metaGroupName={typeData.metaGroupName ?? undefined}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div
                            className={cn(
                                "font-medium truncate leading-tight",
                                compact ? "text-sm" : "text-base"
                            )}
                        >
                            {typeData.name}
                        </div>
                        <div className="text-xs text-muted-foreground leading-tight">ID: {typeId}</div>
                        {!compact && typeData.description && (
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-tight">
                                {typeData.description}
                            </div>
                        )}
                    </div>
                    {typeData.metaGroupName && (
                        <Badge variant="outline" className="text-xs shrink-0">
                            {typeData.metaGroupName}
                        </Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

// 保持原始接口以便向后兼容
interface TypeCardProps {
    typeId: number;
    className?: string;
    onClick?: (typeId: number) => void;
}

const TypeCard: React.FC<TypeCardProps> = (props) => {
    return <SearchTypeCard {...props} />;
};

export default TypeCard;
