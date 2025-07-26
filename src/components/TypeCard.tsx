import { useEffect, useState } from "react";
import TypeImage from "./TypeImage";
import { getCategory, getGroup, getMetaGroup } from "@/native/data";
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
    const [metaGroupIconUrl, setMetagroupIconUrl] = useState<string | null>(null);
    const [categoryName, setCategoryName] = useState<string | null>(null);
    const [metaGroupName, setMetaGroupName] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setMetagroupIconUrl(null);
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
            let categoryId: number | null = null;
            const group = await getGroup(type.group_id);
            if (group) {
                categoryId = group.category_id;
            }
            let catName: string | null = null;
            if (categoryId) {
                const category = await getCategory(categoryId);
                if (category) {
                    catName = await getLocalizationByLang(category.category_name_id, language);
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
                setDesc(descText || "");
                setIconUrl(iconPath);
                setMetagroupIconUrl(mgIcon);
                setCategoryName(catName);
                setMetaGroupName(mgName || null);
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
            <TypeImage
                iconUrl={iconUrl}
                alt={name}
                loading={loading}
                onError={() => setIconUrl(null)}
                metaGroupIconUrl={metaGroupIconUrl}
                metaGroupName={metaGroupName ?? undefined}
            />
            <div className="flex flex-col flex-1 min-w-0">
                <div className="font-semibold text-base truncate">
                    {loading ? "加载中..." : name}
                </div>
                <div className="text-sm text-gray-500 mt-1 line-clamp-2">{loading ? "" : desc}</div>
            </div>
            <div className="flex-shrink-0 text-sm text-gray-500">
                ID {typeId}
                <br />
                Category {categoryName ? categoryName : "未知"}
            </div>
        </div>
    );
};

export default TypeCard;
