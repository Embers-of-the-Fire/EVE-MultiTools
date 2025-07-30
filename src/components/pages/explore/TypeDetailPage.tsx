import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { ArrowLeft, History, Search, X } from "lucide-react";
import type React from "react";
import { Fragment, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CATEGORY_ID_BLUEPRINT } from "@/constant/eve";
import { useLanguage } from "@/hooks/useAppSettings";
import { useSPARouter } from "@/hooks/useSPARouter";
import { useTypeExplore } from "@/hooks/useTypeExplore";
import { cn } from "@/lib/utils";
import type { Category, Group, MetaGroup, Type } from "@/native/data";
import {
    getCategory,
    getGroup,
    getLocalizationByLang,
    getMetaGroup,
    getSkinMaterialIdByLicense,
    getType,
    searchTypeByName,
} from "@/native/data";
import { GraphicType } from "@/types/data";
import { getGraphicUrl, getIconUrl, getSkinMaterialUrl } from "@/utils/image";
import { PageLayout } from "../../layout";
import TypeImage from "../../TypeImage";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Input } from "../../ui/input";
import { ScrollArea, ScrollBar } from "../../ui/scroll-area";
import { Separator } from "../../ui/separator";

interface TypeDetailPageProps {
    typeId: number;
}

type SearchResult = { id: number; name: string };

function TypeHistoryButton() {
    const { t } = useTranslation();
    const { history, setCurrentTypeID } = useTypeExplore();
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [open]);

    return (
        <div className="relative inline-block mr-6" ref={dropdownRef}>
            <Button
                variant="default"
                size="icon"
                className="size-12 [&_svg]:size-5"
                onClick={() => setOpen(!open)}
            >
                <History size="64" />
            </Button>
            <div
                className={`absolute right-0 mt-2 rounded-md max-h-72 min-w-[180px] z-50 bg-white dark:bg-black shadow-lg
                    transition-all duration-200 ease-in-out
                    ${open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}`}
                style={{
                    transitionProperty: "opacity, transform",
                }}
            >
                <ScrollAreaPrimitive.Root className="relative overflow-hidden rounded-sm max-h-72 border-2">
                    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit] max-h-72">
                        <div className="my-1">
                            {history.length === 0 ? (
                                <div className="p-3">{t("explore.type.history.empty")}</div>
                            ) : (
                                history.map((id) => (
                                    <Fragment key={id}>
                                        <Button
                                            variant="ghost"
                                            className={`w-full text-left px-4 py-2 cursor-pointer transition-colors focus:outline-hidden hover:bg-gray-100 dark:hover:bg-gray-800`}
                                            onClick={() => {
                                                setCurrentTypeID(id);
                                                setOpen(false);
                                            }}
                                        >
                                            TypeID: {id}
                                        </Button>
                                        <Separator className="last:hidden" />
                                    </Fragment>
                                ))
                            )}
                        </div>
                    </ScrollAreaPrimitive.Viewport>
                    <ScrollBar />
                    <ScrollAreaPrimitive.Corner />
                </ScrollAreaPrimitive.Root>
            </div>
        </div>
    );
}

function BackToExploreButton() {
    const { t } = useTranslation();
    const { navigate } = useSPARouter();

    return (
        <Button
            variant="ghost"
            size="icon"
            className="size-12 [&_svg]:size-5"
            onClick={() => navigate("/explore/type", t("nav.explore.type"))}
        >
            <ArrowLeft size="64" />
        </Button>
    );
}

function DetailPageActions() {
    return (
        <div className="flex items-center gap-2">
            <BackToExploreButton />
            <TypeHistoryButton />
        </div>
    );
}

export const TypeDetailPage: React.FC<TypeDetailPageProps> = ({ typeId }) => {
    const { t } = useTranslation();
    const { language } = useLanguage();
    const { setCurrentTypeID } = useTypeExplore();

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

    // Search functionality
    const [search, setSearch] = useState("");
    const [focused, setFocused] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Handle type search
    useEffect(() => {
        let ignore = false;
        if (!search.trim()) {
            setResults([]);
            return;
        }
        setSearchLoading(true);
        (async () => {
            try {
                const ids = await searchTypeByName(search, language === "zh" ? "zh" : "en");
                const items: SearchResult[] = [];
                for (const id of ids) {
                    const type = await getType(id);
                    if (!type) continue;
                    const name = await getLocalizationByLang(
                        type.type_name_id,
                        language === "zh" ? "zh" : "en"
                    );
                    items.push({ id, name: name || String(id) });
                }
                if (!ignore) setResults(items);
            } finally {
                if (!ignore) setSearchLoading(false);
            }
        })();
        return () => {
            ignore = true;
        };
    }, [search, language]);

    const handleTypeSelect = (selectedTypeId: number) => {
        setCurrentTypeID(selectedTypeId);
        setSearch("");
        setResults([]);
        inputRef.current?.blur();
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
            actions={<DetailPageActions />}
        >
            {/* Search Bar */}
            <div className="mb-6">
                <div
                    className={cn(
                        "flex items-center w-full px-4 border-b-2 mb-4",
                        "transition-all duration-300",
                        focused ? "w-full border-black dark:border-white" : "w-48 md:w-64"
                    )}
                >
                    <Search />
                    <Input
                        ref={inputRef}
                        className={cn(
                            "px-2 h-14 w-full font-sans text-lg outline-hidden rounded-none",
                            "bg-transparent text-default-700 placeholder-default-500",
                            "dark:text-default-500 dark:placeholder:text-default-300",
                            "border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        )}
                        placeholder={t("explore.type.search.placeholder")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        autoComplete="off"
                        spellCheck={false}
                        style={{ minWidth: 0 }}
                    />
                    <Button
                        variant="ghost"
                        className="size-10"
                        size="icon"
                        onClick={() => {
                            setSearch("");
                            inputRef.current?.blur();
                        }}
                        tabIndex={-1}
                    >
                        <X />
                    </Button>
                </div>

                {/* Search Results */}
                {search && (
                    <div className="relative">
                        {searchLoading && <div className="p-2">{t("common.loading")}</div>}
                        {!searchLoading && results.length > 0 && (
                            <ScrollArea className="border rounded bg-white dark:bg-black/30 shadow-sm p-4 max-h-60">
                                <div className="flex flex-col gap-2">
                                    {results.map((item) => (
                                        <Button
                                            key={item.id}
                                            variant="ghost"
                                            className="w-full text-left px-4 py-2 cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                                            onClick={() => handleTypeSelect(item.id)}
                                        >
                                            <div className="flex justify-between w-full">
                                                <span>{item.name}</span>
                                                <span className="text-muted-foreground">
                                                    ID: {item.id}
                                                </span>
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                        {!searchLoading && search && results.length === 0 && (
                            <div className="p-2 text-muted-foreground">
                                {t("explore.type.search.no_results")}
                            </div>
                        )}
                    </div>
                )}
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
                                    {type.tech_level && (
                                        <Badge variant="outline">
                                            {t("explore.type.detail.tech_level", {
                                                techLevel: type.tech_level,
                                            })}
                                        </Badge>
                                    )}
                                    {type.meta_level && (
                                        <Badge variant="outline">
                                            {t("explore.type.detail.meta_level", {
                                                metaLevel: type.meta_level,
                                            })}
                                        </Badge>
                                    )}
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
                                    <p className="font-medium">
                                        {categoryName ||
                                            `${t("explore.type.detail.category")} ${category.category_id}`}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        ID: {category.category_id}
                                    </p>
                                </div>
                            )}

                            {group && (
                                <div>
                                    <h4 className="font-medium text-sm text-muted-foreground">
                                        {t("explore.type.detail.group")}
                                    </h4>
                                    <p className="font-medium">
                                        {groupName ||
                                            `${t("explore.type.detail.group")} ${group.group_id}`}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        ID: {group.group_id}
                                    </p>
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
                                        <p className="font-mono">{type.faction_id}</p>
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
                                        <p className="font-mono">{type.variation_parent_type_id}</p>
                                    </div>
                                )}

                                {type.wreck_type_id && (
                                    <div>
                                        <h4 className="font-medium text-sm text-muted-foreground">
                                            {t("explore.type.detail.wreck_type_id")}
                                        </h4>
                                        <p className="font-mono">{type.wreck_type_id}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </PageLayout>
    );
};
