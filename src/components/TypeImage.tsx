
import Image from "next/image";
import type React from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TypeImageProps {
    iconUrl: string | null;
    alt: string;
    loading: boolean;
    onError?: () => void;
    metaGroupIconUrl?: string | null;
    metaGroupName?: string;
}

const TypeImage: React.FC<TypeImageProps> = ({ iconUrl, alt, loading, onError, metaGroupIconUrl, metaGroupName }) => {
    return (
        <div className="w-16 h-16 flex-shrink-0 bg-transparent rounded flex items-center justify-center overflow-hidden relative">
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
                    aria-label="物品图片占位"
                >
                    <title>物品图片占位</title>
                    <rect width="64" height="64" rx="8" fill="#00000000" />
                    <text x="50%" y="45%" textAnchor="middle" fontSize="14" fill="gray">
                        <tspan x="50%" dy="0em">未知</tspan>
                        <tspan x="50%" dy="1.2em">图像</tspan>
                    </text>
                </svg>
            )}
            {metaGroupIconUrl && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="absolute left-0 top-0 w-6 h-6 cursor-pointer">
                            <Image
                                src={metaGroupIconUrl}
                                alt="分类图标"
                                width={24}
                                height={24}
                                className="w-6 h-6 object-contain rounded"
                                style={{ boxShadow: "0 0 4px rgba(0,0,0,0.2)" }}
                            />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                        {metaGroupName || "未知分组"}
                    </TooltipContent>
                </Tooltip>
            )}
        </div>
    );
};

export default TypeImage;
