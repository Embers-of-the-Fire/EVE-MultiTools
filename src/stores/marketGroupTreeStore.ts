import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { MarketGroup, MarketGroupCollection } from "@/data/schema";
import { getMarketGroupRaw, searchTypeByName } from "@/native/data";
import { mapSetDefault } from "@/utils/map";

interface MarketGroupTreeState {
    tree: MarketGroupNode[];
    filteredTree: MarketGroupNode[];
    isLoading: boolean;
    error: string | null;
    currentSearchQuery: string;
    searchLanguage: "en" | "zh";
}

export interface MarketGroupNode {
    marketGroupID: number;
    children?: MarketGroupNode[];
    marketGroupData: MarketGroup;
}

interface MarketGroupTreeActions {
    loadMarketGroupTree: () => Promise<void>;
    filterTreeByName: (query: string, language: "en" | "zh") => Promise<void>;
    clearFilter: () => void;
}

type MarketGroupTreeStore = MarketGroupTreeState & MarketGroupTreeActions;

const buildTree = (rawData: MarketGroupCollection): MarketGroupNode[] => {
    // Key: parent market group ID
    const groupMap: Map<number | null, MarketGroupNode[]> = new Map();
    rawData.marketGroups.forEach((group) => {
        mapSetDefault(groupMap, group.marketGroupData?.parentGroupId ?? null, []).push({
            marketGroupID: group.marketGroupId,
            marketGroupData: group.marketGroupData!,
        });
    });

    const buildSubTree = (parentId: number | null): MarketGroupNode[] =>
        (groupMap.get(parentId) || []).map((node) => ({
            ...node,
            children: buildSubTree(node.marketGroupID),
        }));

    return buildSubTree(null);
};

const filterTreeByTypeIds = (
    tree: MarketGroupNode[],
    validTypeIds: Set<number>
): MarketGroupNode[] => {
    const filterNode = (node: MarketGroupNode): MarketGroupNode | null => {
        // Check if current node has any valid types
        const hasValidTypes = node.marketGroupData.types.some((typeId) => validTypeIds.has(typeId));

        // Recursively filter children
        const filteredChildren: MarketGroupNode[] = [];
        if (node.children) {
            for (const child of node.children) {
                const filteredChild = filterNode(child);
                if (filteredChild) {
                    filteredChildren.push(filteredChild);
                }
            }
        }

        // Keep node if it has valid types or valid children
        if (hasValidTypes || filteredChildren.length > 0) {
            return {
                ...node,
                children: filteredChildren.length > 0 ? filteredChildren : undefined,
            };
        }

        return null;
    };

    const filteredTree: MarketGroupNode[] = [];
    for (const node of tree) {
        const filteredNode = filterNode(node);
        if (filteredNode) {
            filteredTree.push(filteredNode);
        }
    }

    return filteredTree;
};

export const useMarketGroupTreeStore = create<MarketGroupTreeStore>()(
    devtools(
        (set, get) => ({
            tree: [],
            filteredTree: [],
            isLoading: false,
            error: null,
            currentSearchQuery: "",
            searchLanguage: "en",

            loadMarketGroupTree: async () => {
                if (get().isLoading) {
                    return; // Already loading, prevent duplicate calls
                }
                if (get().tree.length > 0) {
                    return; // Tree already loaded, no need to reload
                }

                set({ isLoading: true, error: null });

                try {
                    const raw = await getMarketGroupRaw();
                    const tree = buildTree(raw);
                    set({ tree, filteredTree: tree, isLoading: false });
                } catch (error) {
                    set({
                        isLoading: false,
                        error: `Failed to init market group tree: ${error}`,
                    });
                }
            },

            filterTreeByName: async (query: string, language: "en" | "zh") => {
                const state = get();

                // If query is empty, show all tree
                if (!query.trim()) {
                    set({
                        filteredTree: state.tree,
                        currentSearchQuery: "",
                        searchLanguage: language,
                    });
                    return;
                }

                set({ isLoading: true, error: null });

                try {
                    // Search for types matching the query
                    const matchingTypeIds = await searchTypeByName(query, language, 1000);
                    const validTypeIds = new Set(matchingTypeIds);

                    // Filter the tree to only include groups that contain matching types
                    const filteredTree = filterTreeByTypeIds(state.tree, validTypeIds);

                    set({
                        filteredTree,
                        currentSearchQuery: query,
                        searchLanguage: language,
                        isLoading: false,
                    });
                } catch (error) {
                    set({
                        isLoading: false,
                        error: `Failed to filter market group tree: ${error}`,
                    });
                }
            },

            clearFilter: () => {
                const state = get();
                set({
                    filteredTree: state.tree,
                    currentSearchQuery: "",
                });
            },
        }),
        {
            name: "market-group-tree-store",
        }
    )
);
