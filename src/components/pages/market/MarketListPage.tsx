import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { EmbeddedMarketTypeCard } from "@/components/card/MarketTypeCard";

import { PageLayout } from "@/components/layout";
import { type TreeDataItem, TreeView } from "@/components/tree-view";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useMarketGroupTree } from "@/hooks/useMarketGroupTree";
import { getLocalizationByLang, getMarketGroup } from "@/native/data";
import type { MarketGroupNode } from "@/stores/marketGroupTreeStore";
import { getIconUrl } from "@/utils/image";
import { useMarketList } from "@/hooks/useMarketList";

interface MarketGroupTreeViewStore {
    treeView: TreeDataItem[];
    currentLanguage: "zh" | "en";
    isLoading: boolean;
    error: string | null;

    initTreeView: (
        tree: MarketGroupNode[],
        language: "zh" | "en",
        onClick: (groupId: number) => void
    ) => Promise<void>;
}

const useMarketGroupTreeViewStore = create<MarketGroupTreeViewStore>()(
    devtools(
        (set, get) => ({
            treeView: [],
            currentLanguage: "en",
            isLoading: false,
            error: null,

            initTreeView: async (tree, language, onClick) => {
                const { treeView, currentLanguage } = get();
                if (treeView.length > 0 && currentLanguage === language) {
                    // If the tree is already initialized with the same language, skip re-initialization
                    return;
                }

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
                                (await getLocalizationByLang(
                                    node.marketGroupData?.nameId,
                                    language
                                )) || `ID: ${node.marketGroupID}`,
                            icon: iconUrl
                                ? () => (
                                      <Image
                                          className="mr-1"
                                          src={iconUrl}
                                          alt={iconUrl}
                                          width={16}
                                          height={16}
                                      />
                                  )
                                : undefined,
                            children: children.length > 0 ? children : undefined,
                            onClick: () => onClick(node.marketGroupID),
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
    const { i18n } = useTranslation();

    const language = i18n.language === "zh" ? "zh" : "en";

    const { selectedGroupId, setSelectedGroupId } = useMarketList();

    const { tree, isLoading, error, loadMarketGroupTree } = useMarketGroupTree();
    const { initTreeView, treeView, error: treeError } = useMarketGroupTreeViewStore();

    // Load market group tree on component mount
    useEffect(() => {
        loadMarketGroupTree().then(() => {
            if (tree && tree.length > 0) {
                initTreeView(tree, language, setSelectedGroupId);
            }
        });
    }, [loadMarketGroupTree, initTreeView, tree, language]);

    const [types, setTypes] = useState<number[]>([]);

    useEffect(() => {
        if (selectedGroupId === null) return;
        (async () => {
            const mg = await getMarketGroup(selectedGroupId);
            const types = mg?.types;
            if (types && types.length > 0) {
                setTypes(types);
            }
        })();
    }, [selectedGroupId]);

    return (
        <PageLayout
            title={t("market.market_list.title")}
            description={t("market.market_list.desc")}
        >
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
