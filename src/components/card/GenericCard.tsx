import Image from "next/image";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface BadgeConfig {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
    className?: string;
    style?: React.CSSProperties;
    key?: string;
}

interface GenericData {
    name: string;
    description?: ReactNode;
    orientation?: "vertical" | "horizontal";
    iconUrl?: string;
    metaGroupIconUrl?: string;
    metaGroupName?: string;
    badges?: BadgeConfig[];
    actions?: ReactNode[];
    loading?: boolean;
    id?: string | number;
    imageComponent?: React.ReactNode;
}

// 通用图像组件，支持meta group角标
interface GenericImageProps {
    iconUrl?: string | null;
    alt: string;
    loading: boolean;
    metaGroupIconUrl?: string | null;
    metaGroupName?: string;
    width: number;
    height: number;
    className?: string;
    imageComponent?: React.ReactNode;
}

export const GenericImage: React.FC<GenericImageProps> = ({
    iconUrl,
    alt,
    loading,
    metaGroupIconUrl,
    metaGroupName,
    width,
    height,
    className,
    imageComponent,
}) => {
    const { t } = useTranslation();

    if (loading) {
        return (
            <div className={cn("bg-gray-200 dark:bg-gray-700 rounded animate-pulse", className)}>
                <div style={{ width, height }} />
            </div>
        );
    }

    return (
        <div
            className={cn("relative overflow-hidden rounded", className)}
            style={{ width, height }}
        >
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="transform origin-center">
                    {imageComponent ||
                        (iconUrl ? (
                            <Image
                                src={iconUrl}
                                alt={alt}
                                width={width}
                                height={height}
                                className="w-full h-full object-cover rounded"
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">N/A</span>
                            </div>
                        ))}
                </div>
            </div>
            {metaGroupIconUrl && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className="absolute left-0 top-0 cursor-pointer"
                            style={{
                                width: Math.max(16, width * 0.3),
                                height: Math.max(16, height * 0.3),
                            }}
                        >
                            <Image
                                src={metaGroupIconUrl}
                                alt={t("common.category_icon")}
                                width={Math.max(16, width * 0.3)}
                                height={Math.max(16, height * 0.3)}
                                className="w-full h-full object-contain rounded"
                                style={{ boxShadow: "0 0 4px rgba(0,0,0,0.2)" }}
                            />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                        {metaGroupName || t("common.unknown_group")}
                    </TooltipContent>
                </Tooltip>
            )}
        </div>
    );
};

interface HoverCardProps {
    data: GenericData;
    className?: string;
}

const HoverCard: React.FC<HoverCardProps> = ({ data, className }) => {
    const isHorizontal = data.orientation === "horizontal";
    const description = data.description ? (
        typeof data.description === "string" ? (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-3">{data.description}</p>
        ) : (
            data.description
        )
    ) : null;

    if (data.loading) {
        return (
            <Card className={cn("w-80 shadow-lg py-0", className)}>
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

    if (isHorizontal) {
        // 横向布局：图标、名称+ID组合、描述、Badge 同行
        return (
            <Card className={cn("w-80 shadow-lg", className)}>
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        {/* 图标 */}
                        <div className="w-12 h-12 shrink-0">
                            <GenericImage
                                iconUrl={data.iconUrl}
                                alt={data.name}
                                loading={false}
                                metaGroupIconUrl={data.metaGroupIconUrl}
                                metaGroupName={data.metaGroupName}
                                width={48}
                                height={48}
                                className="w-12 h-12"
                                imageComponent={data.imageComponent}
                            />
                        </div>

                        {/* 名称+ID组合 */}
                        <div className="shrink-0">
                            <CardTitle className="text-lg">{data.name}</CardTitle>
                            {data.id && (
                                <div className="text-sm text-muted-foreground">ID: {data.id}</div>
                            )}
                        </div>

                        {/* 描述 */}
                        <div className="flex-1 min-w-0">{description}</div>

                        {/* Badge */}
                        <div className="shrink-0">
                            <div className="flex gap-2 flex-wrap">
                                {data.badges?.map((badge, index) => (
                                    <Badge
                                        key={badge.key || `badge-${index}`}
                                        variant={badge.variant || "secondary"}
                                        className={cn("text-xs", badge.className)}
                                        style={badge.style}
                                    >
                                        {badge.text}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        {data.actions && data.actions.length > 0 && (
                            <div className="shrink-0 flex gap-2 ml-2">
                                {data.actions.map((action, index) => (
                                    <div
                                        key={
                                            data.id
                                                ? `${data.id}-action-${index}`
                                                : `action-${index}`
                                        }
                                    >
                                        {action}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    // 纵向布局（默认）
    return (
        <Card className={cn("w-80 shadow-lg", className)}>
            <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 shrink-0">
                        <GenericImage
                            iconUrl={data.iconUrl}
                            alt={data.name}
                            loading={false}
                            metaGroupIconUrl={data.metaGroupIconUrl}
                            metaGroupName={data.metaGroupName}
                            width={48}
                            height={48}
                            className="w-12 h-12"
                            imageComponent={data.imageComponent}
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{data.name}</CardTitle>
                        {data.id && (
                            <div className="text-sm text-muted-foreground">ID: {data.id}</div>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                {data.description && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-3">
                        {data.description}
                    </p>
                )}
                <div className="flex items-center justify-between">
                    <div className="flex gap-2 flex-wrap">
                        {data.badges?.map((badge, index) => (
                            <Badge
                                key={badge.key || `badge-${index}`}
                                variant={badge.variant || "secondary"}
                                className={cn("text-xs", badge.className)}
                                style={badge.style}
                            >
                                {badge.text}
                            </Badge>
                        ))}
                    </div>

                    {/* Actions */}
                    {data.actions && data.actions.length > 0 && (
                        <div className="flex gap-2 ml-2">
                            {data.actions.map((action, index) => (
                                <div
                                    key={data.id ? `${data.id}-action-${index}` : `action-${index}`}
                                >
                                    {action}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

interface EmbedCardProps {
    data: GenericData;
    title?: string;
    className?: string;
    compact?: boolean;
    showBadges?: boolean;
    onClick?: (id: string | number | undefined) => void;
    noBorder?: boolean;
}

const EmbedCard: React.FC<EmbedCardProps> = ({
    data,
    title,
    className,
    compact = false,
    showBadges = true,
    onClick,
    noBorder = false,
}) => {
    const isHorizontal = data.orientation === "horizontal";
    const handleClick = () => onClick?.(data.id);
    const description = data.description ? (
        typeof data.description === "string" ? (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{data.description}</p>
        ) : (
            data.description
        )
    ) : null;

    if (data.loading) {
        return (
            <Card className={cn("w-full p-0", noBorder && "border-0 shadow-none", className)}>
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
                            <div
                                className={cn(
                                    "bg-gray-200 dark:bg-gray-700 rounded mb-1 animate-pulse",
                                    compact ? "h-3" : "h-4"
                                )}
                            />
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
                "w-full py-0 hover:bg-gray-50 dark:hover:bg-gray-900",
                onClick && "cursor-pointer transition-colors",
                noBorder && "border-0 shadow-none p-0 rounded-none",
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
                {isHorizontal ? (
                    <div className="flex items-center gap-3">
                        <div
                            className={cn(
                                "shrink-0 relative overflow-hidden rounded",
                                compact ? "w-8 h-8" : "w-12 h-12"
                            )}
                        >
                            <GenericImage
                                iconUrl={data.iconUrl}
                                alt={data.name}
                                loading={false}
                                metaGroupIconUrl={data.metaGroupIconUrl}
                                metaGroupName={data.metaGroupName}
                                width={compact ? 32 : 48}
                                height={compact ? 32 : 48}
                                className={cn(compact ? "w-8 h-8" : "w-12 h-12")}
                                imageComponent={data.imageComponent}
                            />
                        </div>

                        <div className="shrink-0">
                            <div
                                className={cn(
                                    "font-medium leading-tight",
                                    compact ? "text-sm" : "text-base"
                                )}
                            >
                                {data.name}
                            </div>
                            {data.id && (
                                <div className="text-xs text-muted-foreground leading-tight">
                                    ID: {data.id}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">{!compact && description}</div>

                        <div className="shrink-0">
                            <div className="flex gap-1 flex-wrap">
                                {showBadges &&
                                    data.badges &&
                                    data.badges.length > 0 &&
                                    data.badges?.map((badge, index) => (
                                        <Badge
                                            key={badge.key || `badge-${index}`}
                                            variant={badge.variant || "outline"}
                                            className={cn("text-xs", badge.className)}
                                            style={badge.style}
                                        >
                                            {badge.text}
                                        </Badge>
                                    ))}
                            </div>
                        </div>

                        {data.actions && data.actions.length > 0 && (
                            <div className="shrink-0 flex gap-2 ml-2">
                                {data.actions.map((action, index) => (
                                    <div
                                        key={
                                            data.id
                                                ? `${data.id}-action-${index}`
                                                : `action-${index}`
                                        }
                                    >
                                        {action}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <div
                            className={cn(
                                "shrink-0 relative overflow-hidden rounded",
                                compact ? "w-8 h-8" : "w-12 h-12"
                            )}
                        >
                            <GenericImage
                                iconUrl={data.iconUrl}
                                alt={data.name}
                                loading={false}
                                metaGroupIconUrl={data.metaGroupIconUrl}
                                metaGroupName={data.metaGroupName}
                                width={compact ? 32 : 48}
                                height={compact ? 32 : 48}
                                className={cn(compact ? "w-8 h-8" : "w-12 h-12")}
                                imageComponent={data.imageComponent}
                            />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div
                                className={cn(
                                    "font-medium truncate leading-tight",
                                    compact ? "text-sm" : "text-base"
                                )}
                            >
                                {data.name}
                            </div>
                            {data.id && (
                                <div className="text-xs text-muted-foreground leading-tight">
                                    ID: {data.id}
                                </div>
                            )}
                            {!compact && description}
                        </div>

                        <div className="flex gap-1 flex-wrap shrink-0">
                            {showBadges &&
                                data.badges &&
                                data.badges.length > 0 &&
                                data.badges?.map((badge, index) => (
                                    <Badge
                                        key={badge.key || `badge-${index}`}
                                        variant={badge.variant || "outline"}
                                        className={cn("text-xs", badge.className)}
                                        style={badge.style}
                                    >
                                        {badge.text}
                                    </Badge>
                                ))}
                        </div>

                        {data.actions && data.actions.length > 0 && (
                            <div className="shrink-0 flex gap-2 ml-2">
                                {data.actions.map((action, index) => (
                                    <div
                                        key={
                                            data.id
                                                ? `${data.id}-action-${index}`
                                                : `action-${index}`
                                        }
                                    >
                                        {action}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

interface BaseCardProps {
    data: GenericData;
    className?: string;
    onClick?: (id: string | number | undefined) => void;
}

const BaseCard: React.FC<BaseCardProps> = ({ data, className, onClick }) => {
    const { t } = useTranslation();
    const isHorizontal = data.orientation === "horizontal";

    const handleClick = () => onClick?.(data.id);
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick?.(data.id);
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

    const description = data.loading ? null : data.description ? (
        typeof data.description === "string" ? (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{data.description}</p>
        ) : (
            data.description
        )
    ) : null;

    if (isHorizontal) {
        return (
            <div
                className={cn(
                    "flex items-center gap-3 p-3 rounded shadow-sm bg-white dark:bg-black min-w-[220px] max-w-full py-0",
                    onClick
                        ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                        : "",
                    className
                )}
                {...containerProps}
            >
                <div className="w-12 h-12 shrink-0">
                    <GenericImage
                        iconUrl={data.iconUrl}
                        alt={data.name}
                        loading={data.loading || false}
                        metaGroupIconUrl={data.metaGroupIconUrl}
                        metaGroupName={data.metaGroupName}
                        width={48}
                        height={48}
                        className="w-12 h-12"
                        imageComponent={data.imageComponent}
                    />
                </div>

                <div className="shrink-0">
                    <div className="font-semibold text-base">
                        {data.loading ? t("common.loading") : data.name}
                    </div>
                    {data.id && <div className="text-sm text-gray-500">ID: {data.id}</div>}
                </div>

                <div className="flex-1 min-w-0">{description}</div>

                {/* Badge */}
                <div className="shrink-0">
                    {data.badges && data.badges.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {data.badges.map((badge, index) => (
                                <Badge
                                    key={badge.key || `badge-${index}`}
                                    variant={badge.variant || "secondary"}
                                    className={cn("text-xs", badge.className)}
                                    style={badge.style}
                                >
                                    {badge.text}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                {data.actions && data.actions.length > 0 && (
                    <div className="shrink-0 flex gap-2 ml-2">
                        {data.actions.map((action, index) => (
                            <div key={data.id ? `${data.id}-action-${index}` : `action-${index}`}>
                                {action}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className={cn(
                "flex items-center gap-3 p-3 rounded shadow-sm bg-white dark:bg-black min-w-[220px] max-w-full py-0",
                onClick
                    ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    : "",
                className
            )}
            {...containerProps}
        >
            {/* 图标 */}
            <div className="w-12 h-12 shrink-0">
                <GenericImage
                    iconUrl={data.iconUrl}
                    alt={data.name}
                    loading={data.loading || false}
                    metaGroupIconUrl={data.metaGroupIconUrl}
                    metaGroupName={data.metaGroupName}
                    width={48}
                    height={48}
                    className="w-12 h-12"
                    imageComponent={data.imageComponent}
                />
            </div>

            {/* 名称+ID组合与描述纵向排布 */}
            <div className="flex flex-col flex-1 min-w-0">
                <div className="font-semibold text-base truncate">
                    {data.loading ? t("common.loading") : data.name}
                </div>
                {data.id && <div className="text-sm text-gray-500">ID: {data.id}</div>}
                {description}
            </div>

            {/* Badge */}
            <div className="shrink-0">
                {data.badges && data.badges.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {data.badges.map((badge, index) => (
                            <Badge
                                key={badge.key || `badge-${index}`}
                                variant={badge.variant || "secondary"}
                                className={cn("text-xs", badge.className)}
                                style={badge.style}
                            >
                                {badge.text}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            {/* Actions */}
            {data.actions && data.actions.length > 0 && (
                <div className="shrink-0 flex gap-2 ml-2">
                    {data.actions.map((action, index) => (
                        <div key={data.id ? `${data.id}-action-${index}` : `action-${index}`}>
                            {action}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// 主要导出接口
const GenericCard = {
    Card: BaseCard,
    Hover: HoverCard,
    Embed: EmbedCard,
};

export default GenericCard;
export type {
    BadgeConfig,
    GenericData,
    HoverCardProps,
    EmbedCardProps,
    BaseCardProps,
    GenericImageProps,
};
