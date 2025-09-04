import { Info, SquareArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useAppSettings";
import { useLocalization } from "@/hooks/useLocalization";
import { useMarketRecord } from "@/hooks/useMarketCache";
import { useSPARouter } from "@/hooks/useSPARouter";
import { getGroup, getLinkUrl, getMetaGroup, getType } from "@/native/data";
import { LinkKey } from "@/types/data";
import { getIconUrl, getTypeImageUrl } from "@/utils/image";
import { ExternalLink } from "../Links";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import type { GenericData } from "./GenericCard";
import GenericCard from "./GenericCard";

const useMarketTypeData = (typeId: number) => {
    const { loc } = useLocalization();
    const { t } = useTranslation();
    const { language } = useLanguage();

    const [staticData, setStaticData] = useState<
        Omit<GenericData, "loading" | "orientation" | "badges" | "id">
    >({
        name: "",
        description: "",
    });

    const [staticDataLoaded, setStaticDataLoaded] = useState(false);

    const marketRecord = useMarketRecord(typeId, true);

    const [links, setLinks] = useState<{ url: string; name: string }[]>([]);

    useEffect(() => {
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
                loc(type.type_name_id),
                type.description_id ? loc(type.description_id) : Promise.resolve(""),
                getTypeImageUrl(type, categoryId),
            ]);

            let mgIcon: string | null = null;
            let mgName: string | null = null;
            if (type.meta_group_id) {
                const meta = await getMetaGroup(type.meta_group_id);
                if (meta?.icon_id) {
                    mgIcon = await getIconUrl(meta.icon_id);
                }
                if (meta?.name_id) {
                    mgName = await loc(meta.name_id);
                }
            }

            if (mounted) {
                setStaticData({
                    name: nameText || "",
                    description: descText || "",
                    iconUrl: iconPath || undefined,
                    metaGroupIconUrl: mgIcon || undefined,
                    metaGroupName: mgName || undefined,
                });
                setStaticDataLoaded(true);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [typeId, loc]);

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

    const isMarketDataLoading = marketRecord.isLoading;

    const { navigateToTypeDetail } = useSPARouter();

    const data: GenericData = {
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
                    navigateToTypeDetail(typeId);
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
                            className="w-full justify-start"
                        >
                            {link.name}
                        </ExternalLink>
                    ))}
                </PopoverContent>
            </Popover>,
        ],
        description: (
            <div className="flex flex-col items-end">
                <div className="flex space-x-4 mt-2">
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
