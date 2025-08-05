import Image from "next/image";
import type React from "react";
import { useTranslation } from "react-i18next";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TypeImageProps {
    iconUrl: string | null;
    alt: string;
    loading: boolean;
    onError?: () => void;
    metaGroupIconUrl?: string | null;
    metaGroupName?: string;
}

export const TypeImage: React.FC<TypeImageProps> = ({
    iconUrl,
    alt,
    loading,
    onError,
    metaGroupIconUrl,
    metaGroupName,
}) => {
    const { t } = useTranslation();
    return (
        <div className="w-16 h-16 shrink-0 bg-transparent rounded flex items-center justify-center overflow-hidden relative">
            {iconUrl && !loading ? (
                <Image
                    src={iconUrl}
                    alt={alt}
                    width={64}
                    height={64}
                    className="w-16 h-16 object-contain"
                    onError={onError}
                />
            ) : (
                <svg
                    width="64"
                    height="64"
                    viewBox="0 0 64 64"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-label={t("common.image_placeholder")}
                >
                    <title>{t("common.image_placeholder")}</title>
                    <rect width="64" height="64" rx="8" fill="#00000000" />
                    <text x="50%" y="45%" textAnchor="middle" fontSize="14" fill="gray">
                        <tspan x="50%" dy="0em">
                            {t("common.unknown")}
                        </tspan>
                        <tspan x="50%" dy="1.2em">
                            {t("common.image")}
                        </tspan>
                    </text>
                </svg>
            )}
            {metaGroupIconUrl && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="absolute left-0 top-0 w-6 h-6 cursor-pointer">
                            <Image
                                src={metaGroupIconUrl}
                                alt={t("common.category_icon")}
                                width={24}
                                height={24}
                                className="w-6 h-6 object-contain rounded"
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
