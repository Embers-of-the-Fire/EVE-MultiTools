import type React from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { EmbeddedFactionCard } from "@/components/card/FactionCard";
import { EmbeddedTypeCard } from "@/components/card/TypeCard";
import { DetailPageActions } from "@/components/common/DetailPageActions";
import { SearchBar } from "@/components/common/SearchBar";
import { CATEGORY_ID_BLUEPRINT } from "@/constant/eve";
import { useLanguage } from "@/hooks/useAppSettings";
import { useFactionExplore } from "@/hooks/useFactionExplore";
import { useSPARouter } from "@/hooks/useSPARouter";
import { useTypeExplore } from "@/hooks/useTypeExplore";
import type { Category, Group, MetaGroup, Type } from "@/native/data";
import {
    getCategory,
    getGroup,
    getLocalizationByLang,
    getMarketPrice,
    getMetaGroup,
    getSkinMaterialIdByLicense,
    getType,
    searchTypeByName,
} from "@/native/data";
import { GraphicType } from "@/types/data";
import { getGraphicUrl, getIconUrl, getSkinMaterialUrl } from "@/utils/image";
import { PageLayout } from "../../layout";
import { TypeImage } from "../../TypeImage";
import { Badge } from "../../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";

interface TypeDetailPageProps {
    typeId: number;
}

function TypeDetailPageActions() {
    const { history, setCurrentTypeID } = useTypeExplore();

    return (
        <DetailPageActions
            type="type"
            history={history}
            onItemClick={setCurrentTypeID}
            backRoute="/explore/type"
            emptyMessageKey="explore.type.history.empty"
            detailRoute="/explore/type/detail"
            detailTitleKey="explore.type.detail.title"
        />
    );
}

export const TypeDetailPage: React.FC<TypeDetailPageProps> = ({ typeId }) => {
    const { t } = useTranslation();
    const { language } = useLanguage();
    const { setCurrentTypeID } = useTypeExplore();
    const { navigate } = useSPARouter();

    const [type, setType] = useState<Type | null>(null);
    const [group, setGroup] = useState<Group | null>(null);
    const [category, setCategory] = useState<Category | null>(null);
    const [metaGroup, setMetaGroup] = useState<MetaGroup | null>(null);

    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [groupName, setGroupName] = useState<string>("");
    const [categoryName, setCategoryName] = useState<string>("");
    const [metaGroupName, setMetaGroupName] = useState<string>("");

    const [iconUrl, setIconUrl] = useState<string | null>(null);
    const [metaGroupIconUrl, setMetaGroupIconUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [priceText, setPriceText] = useState<string | null>(null);

    const { setCurrentFactionID } = useFactionExplore();

    // Search helper functions
    const searchFunction = async (query: string, language: string) => {
        return await searchTypeByName(query, language === "zh" ? "zh" : "en");
    };

    const getItemName = async (id: number, language: string) => {
        const type = await getType(id);
        if (!type) return null;
        return await getLocalizationByLang(type.type_name_id, language === "zh" ? "zh" : "en");
    };

    const handleTypeSelect = (selectedTypeId: number) => {
        setCurrentTypeID(selectedTypeId);
    };

    const handleFactionSelect = () => {
        if (!type || !type.faction_id) return;

        setCurrentFactionID(type.faction_id);
        navigate("/explore/faction/detail", t("explore.faction.detail.title"));
    };

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);

        const loadTypeDetails = async () => {
            try {
                const typeData = await getType(typeId);
                if (!typeData) {
                    if (mounted) {
                        setError(t("explore.type.detail.type_not_found"));
                        setLoading(false);
                    }
                    return;
                }

                if (mounted) {
                    setType(typeData);
                }

                // 并行获取相关数据
                const [typeNameText, typeDescText, groupData, metaGroupData, iconPath] =
                    await Promise.all([
                        getLocalizationByLang(typeData.type_name_id, language),
                        typeData.description_id
                            ? getLocalizationByLang(typeData.description_id, language)
                            : Promise.resolve(""),
                        typeData.group_id ? getGroup(typeData.group_id) : Promise.resolve(null),
                        typeData.meta_group_id
                            ? getMetaGroup(typeData.meta_group_id)
                            : Promise.resolve(null),
                        typeData.icon_id
                            ? getIconUrl(typeData.icon_id)
                            : typeData.graphic_id
                              ? getGraphicUrl(
                                    typeData.graphic_id,
                                    typeData.group_id &&
                                        (await getGroup(typeData.group_id))?.category_id ===
                                            CATEGORY_ID_BLUEPRINT
                                        ? GraphicType.Blueprint
                                        : GraphicType.Icon
                                )
                              : (async () => {
                                    const skinMatId = await getSkinMaterialIdByLicense(
                                        typeData.type_id
                                    );
                                    if (skinMatId === null) return null;
                                    return getSkinMaterialUrl(skinMatId);
                                })(),
                    ]);

                if (!mounted) return;

                setName(typeNameText || "");
                setDescription(typeDescText || "");
                setGroup(groupData);
                setMetaGroup(metaGroupData);
                setIconUrl(iconPath);

                if (groupData) {
                    const [groupNameText, categoryData] = await Promise.all([
                        getLocalizationByLang(groupData.group_name_id, language),
                        getCategory(groupData.category_id),
                    ]);

                    if (mounted) {
                        setGroupName(groupNameText || "");
                        setCategory(categoryData);

                        if (categoryData) {
                            const categoryNameText = await getLocalizationByLang(
                                categoryData.category_name_id,
                                language
                            );
                            if (mounted) {
                                setCategoryName(categoryNameText || "");
                            }
                        }
                    }
                }

                if (metaGroupData) {
                    const [mgNameText, mgIcon] = await Promise.all([
                        metaGroupData.name_id
                            ? getLocalizationByLang(metaGroupData.name_id, language)
                            : Promise.resolve(""),
                        metaGroupData.icon_id
                            ? getIconUrl(metaGroupData.icon_id)
                            : Promise.resolve(null),
                    ]);

                    if (mounted) {
                        setMetaGroupName(mgNameText || "");
                        setMetaGroupIconUrl(mgIcon);
                    }
                }

                const marketPrice = await getMarketPrice(typeId);
                if (marketPrice) {
                    const priceText = `卖单：${marketPrice.sell_min} ISK / 买单：${marketPrice.buy_max} ISK`;
                    if (mounted) {
                        setPriceText(priceText);
                    }
                }

                if (mounted) {
                    setLoading(false);
                }
            } catch (err) {
                if (mounted) {
                    setError(
                        err instanceof Error ? err.message : t("explore.type.detail.load_error")
                    );
                    setLoading(false);
                }
            }
        };

        loadTypeDetails();

        return () => {
            mounted = false;
        };
    }, [typeId, language, t]);

    if (loading) {
        return (
            <PageLayout title={t("explore.type.detail.title")} description={t("common.loading")}>
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg">{t("common.loading")}</div>
                </div>
            </PageLayout>
        );
    }

    if (error || !type) {
        return (
            <PageLayout title={t("explore.type.detail.title")} description={t("common.error")}>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-red-500">
                            {error || t("explore.type.detail.type_not_found")}
                        </div>
                    </CardContent>
                </Card>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title={name || t("explore.type.detail.type", { typeId })}
            description=""
            actions={<TypeDetailPageActions />}
        >
            {/* Search Bar */}
            <div className="mb-6">
                <SearchBar
                    type="type"
                    onItemSelect={handleTypeSelect}
                    searchFunction={searchFunction}
                    getItemName={getItemName}
                    placeholder={t("explore.type.search.placeholder")}
                    noResultsMessage={t("explore.type.search.no_results")}
                    language={language}
                />
            </div>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("explore.type.detail.basic_info")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-start gap-6">
                            <div className="flex-shrink-0">
                                <TypeImage
                                    iconUrl={iconUrl}
                                    alt={name}
                                    loading={false}
                                    onError={() => setIconUrl(null)}
                                    metaGroupIconUrl={metaGroupIconUrl}
                                    metaGroupName={metaGroupName}
                                />
                            </div>

                            <div className="flex-1 space-y-4">
                                <div>
                                    <h2 className="text-2xl font-bold">{name}</h2>
                                    <p className="text-sm text-muted-foreground">
                                        ID: {type.type_id}
                                    </p>
                                </div>

                                {description && (
                                    <div>
                                        <h3 className="font-semibold mb-2">
                                            {t("explore.type.detail.description_label")}
                                        </h3>
                                        <p className="text-sm leading-relaxed">{description}</p>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-2">
                                    {type.published ? (
                                        <Badge variant="default">
                                            {t("explore.type.detail.published")}
                                        </Badge>
                                    ) : (
                                        <Badge variant="destructive">
                                            {t("explore.type.detail.unpublished")}
                                        </Badge>
                                    )}
                                    {type.is_dynamic_type && (
                                        <Badge variant="secondary">
                                            {t("explore.type.detail.dynamic_type")}
                                        </Badge>
                                    )}
                                    {type.tech_level !== null ? (
                                        <Badge variant="outline">
                                            {t("explore.type.detail.tech_level", {
                                                techLevel: type.tech_level,
                                            })}
                                        </Badge>
                                    ) : null}
                                    {type.meta_level !== null ? (
                                        <Badge variant="outline">
                                            {t("explore.type.detail.meta_level", {
                                                metaLevel: type.meta_level,
                                            })}
                                        </Badge>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t("explore.type.detail.category_info")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {category && (
                                <div>
                                    <h4 className="font-medium text-sm text-muted-foreground">
                                        {t("explore.type.detail.category")}
                                    </h4>
                                    <p>
                                        <span className="font-medium">
                                            {categoryName ||
                                                `${t("explore.type.detail.category")} ${category.category_id}`}
                                        </span>
                                        <span className="ml-2 text-sm text-muted-foreground">
                                            ID: {category.category_id}
                                        </span>
                                    </p>
                                </div>
                            )}

                            {group && (
                                <div>
                                    <h4 className="font-medium text-sm text-muted-foreground">
                                        {t("explore.type.detail.group")}
                                    </h4>
                                    <p>
                                        <span className="font-medium">
                                            {groupName ||
                                                `${t("explore.type.detail.group")} ${group.group_id}`}
                                        </span>
                                        <span className="ml-2 text-sm text-muted-foreground">
                                            ID: {group.group_id}
                                        </span>
                                    </p>
                                    {/* {JSON.stringify(group)} */}
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {group.anchorable && (
                                            <Badge variant="secondary" className="text-xs">
                                                {t("explore.type.detail.anchorable")}
                                            </Badge>
                                        )}
                                        {group.fittable_non_singleton && (
                                            <Badge variant="secondary" className="text-xs">
                                                {t("explore.type.detail.fittable")}
                                            </Badge>
                                        )}
                                        {group.anchored && (
                                            <Badge variant="secondary" className="text-xs">
                                                {t("explore.type.detail.anchored")}
                                            </Badge>
                                        )}
                                        {group.use_base_price && (
                                            <Badge variant="secondary" className="text-xs">
                                                {t("explore.type.detail.use_base_price")}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            )}

                            {metaGroup && (
                                <div>
                                    <h4 className="font-medium text-sm text-muted-foreground">
                                        {t("explore.type.detail.meta_group")}
                                    </h4>
                                    <p className="font-medium">
                                        {metaGroupName || t("explore.type.detail.meta_group")}
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t("explore.type.detail.attributes")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <h4 className="font-medium text-sm text-muted-foreground">
                                    {t("explore.type.detail.base_price")}
                                </h4>
                                <p className="font-mono">{type.base_price?.toLocaleString()} ISK</p>
                            </div>

                            <div>
                                <h4 className="font-medium text-sm text-muted-foreground">
                                    {t("explore.type.detail.volume")}
                                </h4>
                                <p className="font-mono">{type.volume?.toLocaleString()} m³</p>
                            </div>

                            <div>
                                <h4 className="font-medium text-sm text-muted-foreground">
                                    {t("explore.type.detail.capacity")}
                                </h4>
                                <p className="font-mono">{type.capacity?.toLocaleString()} m³</p>
                            </div>

                            <div>
                                <h4 className="font-medium text-sm text-muted-foreground">
                                    {t("explore.type.detail.radius")}
                                </h4>
                                <p className="font-mono">{type.radius?.toLocaleString()} m</p>
                            </div>

                            <div>
                                <h4 className="font-medium text-sm text-muted-foreground">
                                    {t("explore.type.detail.portion_size")}
                                </h4>
                                <p className="font-mono">{type.portion_size}</p>
                            </div>

                            {type.market_group_id && (
                                <div>
                                    <h4 className="font-medium text-sm text-muted-foreground">
                                        {t("explore.type.detail.market_group_id")}
                                    </h4>
                                    <p className="font-mono">{type.market_group_id}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {(type.faction_id ||
                    type.race_id ||
                    type.variation_parent_type_id ||
                    type.wreck_type_id) && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("explore.type.detail.other_info")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {type.faction_id && (
                                    <div>
                                        <h4 className="font-medium text-sm text-muted-foreground">
                                            {t("explore.type.detail.faction_id")}
                                        </h4>
                                        <EmbeddedFactionCard
                                            className="mt-2"
                                            factionId={type.faction_id}
                                            onClick={handleFactionSelect}
                                        />
                                    </div>
                                )}

                                {type.race_id && (
                                    <div>
                                        <h4 className="font-medium text-sm text-muted-foreground">
                                            {t("explore.type.detail.race_id")}
                                        </h4>
                                        <p className="font-mono">{type.race_id}</p>
                                    </div>
                                )}

                                {type.variation_parent_type_id && (
                                    <div>
                                        <h4 className="font-medium text-sm text-muted-foreground">
                                            {t("explore.type.detail.variation_parent_type_id")}
                                        </h4>
                                        <EmbeddedTypeCard
                                            className="mt-2"
                                            typeId={type.variation_parent_type_id}
                                            onClick={setCurrentTypeID}
                                        />
                                    </div>
                                )}

                                {type.wreck_type_id && (
                                    <div>
                                        <h4 className="font-medium text-sm text-muted-foreground">
                                            {t("explore.type.detail.wreck_type_id")}
                                        </h4>
                                        <EmbeddedTypeCard
                                            className="mt-2"
                                            typeId={type.wreck_type_id}
                                            onClick={setCurrentTypeID}
                                        />
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {priceText && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("explore.type.detail.market_price")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-semibold">{priceText}</div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </PageLayout>
    );
};
