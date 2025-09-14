import { ListFilter, Search } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { EmbeddedMarketTypeCard } from "@/components/card/MarketTypeCard";
import { SearchInput } from "@/components/common/SearchBar";
import { PageLayout } from "@/components/layout";
import { type TreeDataItem, TreeView } from "@/components/tree-view";
import { Button } from "@/components/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/hooks/useAppSettings";
import { useLocalization } from "@/hooks/useLocalization";
import { useMarketGroupTree } from "@/hooks/useMarketGroupTree";
import { useMarketList } from "@/hooks/useMarketList";
import type { Language } from "@/native";
import { useData } from "@/stores/dataStore";
import type { MarketGroupNode } from "@/stores/marketGroupTreeStore";
import { getIconUrl } from "@/utils/image";

interface MarketGroupTreeViewStore {
    treeView: TreeDataItem[];
    currentLanguage: "zh" | "en";
    isLoading: boolean;
    error: string | null;

    initTreeView: (
        tree: MarketGroupNode[],
        loc: (id: number) => Promise<string>,
        language: Language,
        onClick: (groupId: number, hasChild: boolean) => void
    ) => Promise<void>;
}

const useMarketGroupTreeViewStore = create<MarketGroupTreeViewStore>()(
    devtools(
        (set) => ({
            treeView: [],
            currentLanguage: "en",
            isLoading: false,
            error: null,

            initTreeView: async (tree, loc, language, onClick) => {
                // Always re-render if tree changes or language changes
                set({ isLoading: true, currentLanguage: language });
                try {
                    const renderTree = async (node: MarketGroupNode): Promise<TreeDataItem> => {
                        const children = await Promise.all(
                            node.children?.map((child: MarketGroupNode) => renderTree(child)) || []
                        );
                        const iconUrl =
                            node.marketGroupData.iconId !== undefined
                                ? await getIconUrl(node.marketGroupData.iconId)
                                : undefined;
                        return {
                            id: node.marketGroupID.toString(),
                            name:
                                (await loc(node.marketGroupData?.nameId)) ||
                                `ID: ${node.marketGroupID}`,
                            icon: iconUrl ? (
                                <Image
                                    className="mr-1"
                                    src={iconUrl}
                                    alt={iconUrl}
                                    width={16}
                                    height={16}
                                />
                            ) : undefined,
                            children: children.length > 0 ? children : undefined,
                            onClick: () => onClick(node.marketGroupID, children.length > 0),
                        };
                    };
                    const treeView = await Promise.all(tree.map((node) => renderTree(node)));
                    set({ treeView, isLoading: false, error: null });
                } catch (error) {
                    set({
                        isLoading: false,
                        error: error instanceof Error ? error.message : String(error),
                    });
                }
            },
        }),
        {
            name: "market-group-tree-view-store",
        }
    )
);

export const MarketListPage: React.FunctionComponent = () => {
    const { t } = useTranslation();
    const { language } = useLanguage();
    const { loc } = useLocalization();

    const { selectedGroupId, setSelectedGroupId } = useMarketList();

    const { filteredTree, isLoading, error, loadMarketGroupTree, filterTreeByName, clearFilter } =
        useMarketGroupTree();
    const { initTreeView, treeView, error: treeError } = useMarketGroupTreeViewStore();

    const [searchQuery, setSearchQuery] = useState<string>("");
    const [matchingTypeIds, setMatchingTypeIds] = useState<Set<number>>(new Set());

    const { getData } = useData();

    // Handle search query changes
    useEffect(() => {
        const delayTimeout = setTimeout(() => {
            if (searchQuery.trim()) {
                filterTreeByName(searchQuery, language, (query, language, limit) =>
                    getData("searchTypeByName", query, language, limit)
                );
                // Also get the matching type IDs for filtering the price list
                (async () => {
                    try {
                        const typeIds = await getData(
                            "searchTypeByName",
                            searchQuery,
                            language,
                            1000
                        );
                        setMatchingTypeIds(new Set(typeIds));
                    } catch (error) {
                        console.error("Failed to search types:", error);
                        setMatchingTypeIds(new Set());
                    }
                })();
            } else {
                clearFilter();
                setMatchingTypeIds(new Set());
            }
        }, 500); // Debounce search

        return () => clearTimeout(delayTimeout);
    }, [searchQuery, language, filterTreeByName, clearFilter, getData]);

    // Load market group tree on component mount
    useEffect(() => {
        loadMarketGroupTree().then(() => {
            if (filteredTree && filteredTree.length > 0) {
                initTreeView(filteredTree, loc, language, setSelectedGroupId);
            }
        });
    }, [loadMarketGroupTree, initTreeView, filteredTree, loc, language, setSelectedGroupId]);

    const [types, internalSetTypes] = useState<number[]>([]);

    const setTypes = (newTypes: number[]) => {
        // Sort types by ID for consistent order
        const sortedTypes = newTypes.sort((a, b) => a - b);
        internalSetTypes(sortedTypes);
    };

    // biome-ignore lint/correctness/useExhaustiveDependencies: `setTypes` is stable
    useEffect(() => {
        if (selectedGroupId === null) return;
        (async () => {
            const mg = await getData("getMarketGroup", selectedGroupId);
            const allTypes = mg?.types;
            if (allTypes && allTypes.length > 0) {
                // If there's a search query, filter types to only show matching ones
                if (matchingTypeIds.size > 0) {
                    const filteredTypes = allTypes.filter((typeId) => matchingTypeIds.has(typeId));
                    setTypes(filteredTypes);
                } else {
                    setTypes(allTypes);
                }
            } else {
                setTypes([]);
            }
        })();
    }, [selectedGroupId, matchingTypeIds]);

    return (
        <PageLayout
            title={t("market.market_list.title")}
            description={t("market.market_list.desc")}
        >
            <div className="flex flex-row w-full">
                <SearchInput
                    leading={<ListFilter />}
                    onValueChange={(value: string) => setSearchQuery(value)}
                    placeholder={t("market.market_list.search.placeholder")}
                />
                <span className="self-center ml-auto">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button size="icon" className="ml-2">
                                <Search />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent align="end">
                            {t("market.market_list.jump_to_search_page")}
                        </TooltipContent>
                    </Tooltip>
                </span>
            </div>
            <ResizablePanelGroup direction="horizontal" className="w-full h-full">
                <ResizablePanel defaultSize={20} minSize={10} maxSize={30}>
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800">
                            <h1 className="text-xl font-semibold">
                                {t("market.market_group_tree.title")}
                            </h1>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            {isLoading || treeView === undefined ? (
                                <div className="text-center text-gray-500">
                                    {t("common.loading")}
                                </div>
                            ) : error ? (
                                <div className="text-red-500">
                                    {t("common.error")}
                                    <br />
                                    {error}
                                </div>
                            ) : treeError ? (
                                <div className="text-red-500">
                                    {t("common.error")}
                                    <br />
                                    {treeError}
                                </div>
                            ) : (
                                <TreeView className="p-0" data={treeView} />
                            )}
                        </div>
                    </div>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={80}>
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800">
                            <h1 className="text-xl font-semibold">
                                {t("market.market_list.title")}
                            </h1>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {types.length > 0
                                ? types.map((typeId) => (
                                      <EmbeddedMarketTypeCard typeId={typeId} key={typeId} />
                                  ))
                                : null}
                        </div>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </PageLayout>
    );
};
