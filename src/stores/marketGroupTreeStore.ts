import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { MarketGroup, MarketGroupCollection } from "@/data/schema";
import { getMarketGroupRaw } from "@/native/data";
import { mapSetDefault } from "@/utils/map";

interface MarketGroupTreeState {
    tree: MarketGroupNode[];
    isLoading: boolean;
    error: string | null;
}

export interface MarketGroupNode {
    marketGroupID: number;
    children?: MarketGroupNode[];
    marketGroupData: MarketGroup;
}

interface MarketGroupTreeActions {
    loadMarketGroupTree: () => Promise<void>;
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

export const useMarketGroupTreeStore = create<MarketGroupTreeStore>()(
    devtools(
        (set, get) => ({
            tree: [],
            isLoading: false,
            error: null,

            loadMarketGroupTree: async () => {
                if (get().isLoading) {
                    return; // Already loading, prevent duplicate calls
                }
                if (get().tree.length > 0) {
                    return; // Tree already loaded, no need to reload
                }

                set({ isLoading: true, error: null });

                setTimeout(() => {
                    if (get().isLoading) {
                        set({
                            error: "Market group tree loading timed out.",
                            isLoading: false,
                        });
                    }
                }, 5000); // 5 seconds timeout

                try {
                    const raw = await getMarketGroupRaw();
                    const tree = buildTree(raw);
                    set({ tree, isLoading: false });
                } catch (error) {
                    set({
                        isLoading: false,
                        error: `Failed to init market group tree: ${error}`,
                    });
                }
            },
        }),
        {
            name: "market-group-tree-store",
        }
    )
);
