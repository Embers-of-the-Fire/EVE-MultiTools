import { useEffect, useState } from "react";
import Image from "next/image";
import { getType, getLocalizationByLang } from "@/native/data";
import { useLanguage } from "@/hooks/useAppSettings";
import { getGraphicUrl, getIconUrl } from "@/utils/image";

interface TypeCardProps {
    typeId: number;
    className?: string;
}

const TypeCard: React.FC<TypeCardProps> = ({ typeId, className }) => {
    const { language } = useLanguage();
    const [name, setName] = useState<string>("");
    const [desc, setDesc] = useState<string>("");
    const [iconUrl, setIconUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        getType(typeId).then(async (type) => {
            if (!type) {
                if (mounted) setLoading(false);
                return;
            }
            const [nameText, descText, iconPath] = await Promise.all([
                getLocalizationByLang(type.type_name_id, language),
                type.description_id
                    ? getLocalizationByLang(type.description_id, language)
                    : Promise.resolve(""),
                type.icon_id
                    ? getIconUrl(type.icon_id)
                    : type.graphic_id
                      ? getGraphicUrl(type.graphic_id)
                      : Promise.resolve(null),
            ]);
            if (mounted) {
                setName(nameText || "");
                setDesc(descText || "");
                setIconUrl(iconPath);
                setLoading(false);
            }
        });
        return () => {
            mounted = false;
        };
    }, [typeId, language]);

    return (
        <div
            className={`flex items-center gap-3 p-3 rounded shadow bg-white dark:bg-black min-w-[220px] max-w-full ${className || ""}`}
        >
            {/* 图片 */}
            <div className="w-16 h-16 flex-shrink-0 bg-transparent rounded flex items-center justify-center overflow-hidden">
                {iconUrl && !loading ? (
                    <Image
                        src={iconUrl}
                        alt={name}
                        width={64}
                        height={64}
                        className="w-16 h-16 object-contain"
                        onError={() => {
                            setIconUrl(null);
                        }}
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
                            <tspan x="50%" dy="0em">
                                未知
                            </tspan>
                            <tspan x="50%" dy="1.2em">
                                图像
                            </tspan>
                        </text>
                    </svg>
                )}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
                <div className="font-semibold text-base truncate">
                    {loading ? "加载中..." : name}
                </div>
                <div className="text-sm text-gray-500 mt-1 line-clamp-2">{loading ? "" : desc}</div>
            </div>
            <div className="flex-shrink-0 text-sm text-gray-500">ID {typeId}</div>
        </div>
    );
};

export default TypeCard;
