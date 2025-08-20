import { ClockAlert, Info, SquareArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CATEGORY_ID_BLUEPRINT } from "@/constant/eve";
import { useLanguage } from "@/hooks/useAppSettings";
import { useMarketRecord } from "@/hooks/useMarketCache";
import { useSPARouter } from "@/hooks/useSPARouter";
import { useTypeExplore } from "@/hooks/useTypeExplore";
import {
    getGroup,
    getLinkUrl,
    getLocalizationByLang,
    getMetaGroup,
    getSkinMaterialIdByLicense,
    getType,
    LinkKey,
} from "@/native/data";
import { GraphicType } from "@/types/data";
import { getGraphicUrl, getIconUrl, getSkinMaterialUrl } from "@/utils/image";
import { OutdatedNote } from "../common/OutdatedNote";
import { ExternalLink } from "../ExternalLink";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import type { GenericData } from "./GenericCard";
import GenericCard from "./GenericCard";

interface TypeData extends GenericData {
    metaGroupIconUrl?: string | null;
    metaGroupName?: string | null;
}

const useMarketTypeData = (typeId: number) => {
    const { language } = useLanguage();
    const { t } = useTranslation();

    const [staticData, setStaticData] = useState<
        Omit<TypeData, "loading" | "orientation" | "badges" | "id">
    >({
        name: "",
        description: "",
        iconUrl: null,
        metaGroupIconUrl: null,
        metaGroupName: null,
    });

    const [staticDataLoaded, setStaticDataLoaded] = useState(false);
    const [shouldLoadMarketData, setShouldLoadMarketData] = useState(false);

    const marketRecord = useMarketRecord(typeId, shouldLoadMarketData);

    const [links, setLinks] = useState<{ url: string; name: string }[]>([]);

    useEffect(() => {
        console.log("加载类型静态数据", typeId, language);
        let mounted = true;

        setStaticDataLoaded(false);
        (async () => {
            const type = await getType(typeId);

            if (!type) {
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
            console.log("Loaded static data for type", typeId);

            if (mounted) {
                setStaticData({
                    name: nameText || "",
                    description: descText || "",
                    iconUrl: iconPath,
                    metaGroupIconUrl: mgIcon,
                    metaGroupName: mgName,
                });
                setStaticDataLoaded(true);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [typeId, language]);

    useEffect(() => {
        if (staticDataLoaded && !shouldLoadMarketData) {
            setShouldLoadMarketData(true);
        }
    }, [staticDataLoaded, shouldLoadMarketData]);

    useEffect(() => {
        (async () => {
            const newLinks = [];
            newLinks.push({
                url:
                    language === "zh"
                        ? await getLinkUrl(LinkKey.MarketEveC3qCc, { typeId: typeId.toString() })
                        : await getLinkUrl(LinkKey.MarketEveC3qCcEn, { typeId: typeId.toString() }),
                name: t("market.link.eve_c3q_cc"),
            });
            newLinks.push({
                url: await getLinkUrl(LinkKey.MarketEveTycoon, { typeId: typeId.toString() }),
                name: t("market.link.eve_tycoon"),
            });
            setLinks(
                newLinks.filter((link): link is { url: string; name: string } => link.url !== null)
            );
        })();
    }, [typeId, language, t]);

    const isMarketDataLoading = marketRecord.state === "missing";
    const isMarketDataOutdated = marketRecord.state === "outdated";

    const { setCurrentTypeID } = useTypeExplore();
    const { navigate } = useSPARouter();

    // 构建最终的 data 对象，将 loading 状态与数据分离
    const data: TypeData = {
        ...staticData,
        loading: !staticDataLoaded,
        orientation: "horizontal",
        id: typeId,
        actions: [
            <Button
                size="icon"
                variant="secondary"
                className="size-8"
                key="info-button"
                onClick={() => {
                    setCurrentTypeID(typeId);
                    navigate("/explore/type/detail", t("explore.type.detail.title"));
                }}
            >
                <Info size="32" />
            </Button>,
            <Popover key="external-link-popover">
                <PopoverTrigger asChild>
                    <Button size="icon" variant="default" className="size-8" key="market-button">
                        <SquareArrowUpRight size="32" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="end">
                    {links.map((link) => (
                        <ExternalLink
                            key={link.url}
                            link={link.url}
                            text={link.name}
                            className="w-full justify-start"
                        />
                    ))}
                </PopoverContent>
            </Popover>,
        ],
        description: (
            <div className="flex flex-col items-end">
                <div className="flex space-x-4 mt-2">
                    {isMarketDataOutdated && <OutdatedNote />}
                    <div>
                        <p className="text-xs text-muted-foreground">{t("market.sell_min")}</p>
                        {isMarketDataLoading ? (
                            <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        ) : (
                            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                                {marketRecord.sellMin && marketRecord.sellMin > 0
                                    ? marketRecord.sellMin.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })
                                    : "N/A"}
                            </p>
                        )}
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">{t("market.buy_max")}</p>
                        {isMarketDataLoading ? (
                            <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        ) : (
                            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                                {marketRecord.buyMax && marketRecord.buyMax > 0
                                    ? marketRecord.buyMax.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })
                                    : "N/A"}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        ),
    };

    return data;
};

interface EmbeddedMarketTypeCardProps {
    typeId: number;
    title?: string;
    className?: string;
    compact?: boolean;
    showBadges?: boolean;
    onClick?: (typeId: number) => void;
    noBorder?: boolean;
}

export const EmbeddedMarketTypeCard: React.FC<EmbeddedMarketTypeCardProps> = ({
    typeId,
    title,
    className,
    compact = false,
    showBadges = true,
    onClick,
    noBorder = false,
}) => {
    const typeData = useMarketTypeData(typeId);

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
