import type React from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { EmbeddedFactionCard } from "@/components/card/FactionCard";
import { EmbeddedTypeCard } from "@/components/card/TypeCard";
import { SearchBar } from "@/components/common/SearchBar";
import { useLanguage } from "@/hooks/useAppSettings";
import { useLocalization } from "@/hooks/useLocalization";
import { useSPARouter } from "@/hooks/useSPARouter";
import type { Language } from "@/native";
import { useData } from "@/stores/dataStore";
import type { Category, Group, MetaGroup, Type } from "@/types/data";
import { getIconUrl, getTypeImageUrl } from "@/utils/image";
import {
    Attribute,
    AttributeContent,
    AttributeName,
    AttributePanel,
    AttributeText,
    AttributeTitle,
} from "../../common/AttributePanel";
import { PageLayout } from "../../layout";
import { TypeImage } from "../../TypeImage";
import { Badge } from "../../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { ScrollArea } from "../../ui/scroll-area";

interface TypeDetailPageProps {
    typeId: number;
}

export const TypeDetailPage: React.FC<TypeDetailPageProps> = ({ typeId }) => {
    const { t } = useTranslation();
    const { loc } = useLocalization();
    const { language } = useLanguage();

    const { navigateToTypeDetail, navigateToFactionDetail } = useSPARouter();

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

    const { getData } = useData();

    const searchFunction = async (query: string, language: Language) => {
        return await getData("searchTypeByName", query, language);
    };

    const handleTypeSelect = (selectedTypeId: number) => {
        navigateToTypeDetail(selectedTypeId, t("explore.type.detail.title"));
    };

    const handleFactionSelect = () => {
        if (!type || !type.faction_id) return;

        navigateToFactionDetail(type.faction_id, t("explore.faction.detail.title"));
    };

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);

        const loadTypeDetails = async () => {
            try {
                const typeData = await getData("getType", typeId);
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

                const [typeNameText, typeDescText, groupData, metaGroupData] = await Promise.all([
                    loc(typeData.type_name_id),
                    typeData.description_id ? loc(typeData.description_id) : Promise.resolve(""),
                    typeData.group_id
                        ? getData("getGroup", typeData.group_id)
                        : Promise.resolve(null),
                    typeData.meta_group_id
                        ? getData("getMarketGroup", typeData.meta_group_id)
                        : Promise.resolve(null),
                ]);

                if (!mounted) return;

                setName(typeNameText || "");
                setDescription(typeDescText || "");
                setGroup(groupData);
                setMetaGroup(metaGroupData);

                const iconPath = await getTypeImageUrl(typeData, groupData?.category_id || null);
                setIconUrl(iconPath);

                if (groupData) {
                    const [groupNameText, categoryData] = await Promise.all([
                        loc(groupData.group_name_id),
                        getData("getCategory", groupData.category_id),
                    ]);

                    if (mounted) {
                        setGroupName(groupNameText || "");
                        setCategory(categoryData);

                        if (categoryData) {
                            const categoryNameText = await loc(categoryData.category_name_id);
                            if (mounted) {
                                setCategoryName(categoryNameText || "");
                            }
                        }
                    }
                }

                if (metaGroupData) {
                    const [mgNameText, mgIcon] = await Promise.all([
                        metaGroupData.name_id ? loc(metaGroupData.name_id) : Promise.resolve(""),
                        metaGroupData.icon_id
                            ? getIconUrl(metaGroupData.icon_id)
                            : Promise.resolve(null),
                    ]);

                    if (mounted) {
                        setMetaGroupName(mgNameText || "");
                        setMetaGroupIconUrl(mgIcon);
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
    }, [typeId, loc, t, getData]);

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
        <PageLayout title={name || t("explore.type.detail.type", { typeId })} description="">
            {/* Search Bar */}
            <div className="mb-6">
                <SearchBar
                    onItemSelect={handleTypeSelect}
                    searchFunction={searchFunction}
                    placeholder={t("explore.type.search.placeholder")}
                    noResultsMessage={t("common.no_results")}
                    language={language}
                >
                    {({ results, loading, query, onSelect, noResultsMessage }) => (
                        <div className="pr-0 flex flex-col flex-1 min-h-0 w-full max-w-none">
                            {loading && <div className="p-2">{t("common.loading")}</div>}
                            {!loading && results.length > 0 && (
                                <ScrollArea className="max-h-72 border rounded-md bg-white dark:bg-black/30 shadow-sm p-0 my-2 flex-1 min-h-0 flex flex-col">
                                    <div className="flex flex-col min-h-0 w-full max-w-none flex-1">
                                        {results.map((item, idx) => (
                                            <div key={item}>
                                                <EmbeddedTypeCard
                                                    typeId={item}
                                                    compact={true}
                                                    noBorder
                                                    onClick={onSelect}
                                                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-black/30 transition-colors rounded-none px-4 py-2 w-full"
                                                />
                                                {idx !== results.length - 1 && (
                                                    <div className="w-full h-px bg-gray-200 dark:bg-gray-700 mx-0" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                            {!loading && query && results.length === 0 && (
                                <div className="text-center text-muted-foreground mt-8">
                                    <p>{noResultsMessage}</p>
                                </div>
                            )}
                        </div>
                    )}
                </SearchBar>
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
                                    <p className="text-sm leading-relaxed">{description}</p>
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

                <AttributePanel>
                    <AttributeTitle>{t("explore.type.detail.category_info")}</AttributeTitle>
                    <AttributeContent>
                        {category && (
                            <Attribute>
                                <AttributeName>{t("explore.type.detail.category")}</AttributeName>
                                <AttributeText>
                                    <span className="font-medium">
                                        {categoryName ||
                                            `${t("explore.type.detail.category")} ${category.category_id}`}
                                    </span>
                                    <span className="ml-2 text-sm text-muted-foreground">
                                        ID: {category.category_id}
                                    </span>
                                </AttributeText>
                            </Attribute>
                        )}

                        {group && (
                            <Attribute>
                                <AttributeName>{t("explore.type.detail.group")}</AttributeName>
                                <AttributeText>
                                    <span className="font-medium">
                                        {groupName ||
                                            `${t("explore.type.detail.group")} ${group.group_id}`}
                                    </span>
                                    <span className="ml-2 text-sm text-muted-foreground">
                                        ID: {group.group_id}
                                    </span>
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
                                </AttributeText>
                            </Attribute>
                        )}

                        {metaGroup && (
                            <Attribute>
                                <AttributeName>{t("explore.type.detail.meta_group")}</AttributeName>
                                <AttributeText>
                                    {metaGroupName || t("explore.type.detail.meta_group")}
                                </AttributeText>
                            </Attribute>
                        )}
                    </AttributeContent>
                </AttributePanel>

                <AttributePanel>
                    <AttributeTitle>{t("explore.type.detail.attributes")}</AttributeTitle>
                    <AttributeContent>
                        <Attribute>
                            <AttributeName>{t("explore.type.detail.base_price")}</AttributeName>
                            <AttributeText className="font-mono">
                                {type.base_price?.toLocaleString()} ISK
                            </AttributeText>
                        </Attribute>

                        <Attribute>
                            <AttributeName>{t("explore.type.detail.volume")}</AttributeName>
                            <AttributeText className="font-mono">
                                {type.volume?.toLocaleString()} m³
                            </AttributeText>
                        </Attribute>

                        <Attribute>
                            <AttributeName>{t("explore.type.detail.capacity")}</AttributeName>
                            <AttributeText className="font-mono">
                                {type.capacity?.toLocaleString()} m³
                            </AttributeText>
                        </Attribute>

                        <Attribute>
                            <AttributeName>{t("terms.radius")}</AttributeName>
                            <AttributeText className="font-mono">
                                {type.radius?.toLocaleString()} m
                            </AttributeText>
                        </Attribute>

                        <Attribute>
                            <AttributeName>{t("explore.type.detail.portion_size")}</AttributeName>
                            <AttributeText className="font-mono">{type.portion_size}</AttributeText>
                        </Attribute>

                        {type.market_group_id && (
                            <Attribute>
                                <AttributeName>
                                    {t("explore.type.detail.market_group_id")}
                                </AttributeName>
                                <AttributeText className="font-mono">
                                    {type.market_group_id}
                                </AttributeText>
                            </Attribute>
                        )}
                    </AttributeContent>
                </AttributePanel>

                {(type.faction_id ||
                    type.race_id ||
                    type.variation_parent_type_id ||
                    type.wreck_type_id) && (
                    <AttributePanel>
                        <AttributeTitle>{t("explore.type.detail.other_info")}</AttributeTitle>
                        <AttributeContent>
                            {type.faction_id && (
                                <Attribute>
                                    <AttributeName>
                                        {t("explore.type.detail.faction_id")}
                                    </AttributeName>
                                    <AttributeText>
                                        <EmbeddedFactionCard
                                            className="mt-2"
                                            factionId={type.faction_id}
                                            onClick={handleFactionSelect}
                                        />
                                    </AttributeText>
                                </Attribute>
                            )}

                            {type.race_id && (
                                <Attribute>
                                    <AttributeName>
                                        {t("explore.type.detail.race_id")}
                                    </AttributeName>
                                    <AttributeText className="font-mono">
                                        {type.race_id}
                                    </AttributeText>
                                </Attribute>
                            )}

                            {type.variation_parent_type_id && (
                                <Attribute>
                                    <AttributeName>
                                        {t("explore.type.detail.variation_parent_type_id")}
                                    </AttributeName>
                                    <AttributeText>
                                        <EmbeddedTypeCard
                                            className="mt-2"
                                            typeId={type.variation_parent_type_id}
                                            onClick={() =>
                                                type.variation_parent_type_id &&
                                                handleTypeSelect(type.variation_parent_type_id)
                                            }
                                        />
                                    </AttributeText>
                                </Attribute>
                            )}

                            {type.wreck_type_id && (
                                <Attribute>
                                    <AttributeName>
                                        {t("explore.type.detail.wreck_type_id")}
                                    </AttributeName>
                                    <AttributeText>
                                        <EmbeddedTypeCard
                                            className="mt-2"
                                            typeId={type.wreck_type_id}
                                            onClick={() =>
                                                type.wreck_type_id &&
                                                handleTypeSelect(type.wreck_type_id)
                                            }
                                        />
                                    </AttributeText>
                                </Attribute>
                            )}
                        </AttributeContent>
                    </AttributePanel>
                )}
            </div>
        </PageLayout>
    );
};

export const TypeDetailPageWrapper: React.FC = () => {
    const { t } = useTranslation();
    const { navigate, useRouteParams } = useSPARouter();

    // Get parameters from the new router system
    const routeParams = useRouteParams("/explore/type/detail");
    const typeId = routeParams?.typeId;

    useEffect(() => {
        // If no type is selected, redirect to explore page
        if (!typeId) {
            navigate("/explore/type");
        }
    }, [typeId, navigate]);

    if (!typeId) {
        return (
            <PageLayout title={t("explore.type.detail.title")} description={t("common.error")}>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-muted-foreground">
                            {t("explore.type.detail.no_type_selected")}
                        </div>
                    </CardContent>
                </Card>
            </PageLayout>
        );
    }

    return <TypeDetailPage typeId={typeId} />;
};
