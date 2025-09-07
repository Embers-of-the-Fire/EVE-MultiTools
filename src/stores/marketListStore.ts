import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface MarketListState {
    selectedGroupId: number | null;
    types: number[];
}

interface MarketListActions {
    setSelectedGroupId: (groupId: number | null, hasChild: boolean) => void;
    setTypes: (types: number[]) => void;
}

type MarketListStore = MarketListState & MarketListActions;

export const useMarketListStore = create<MarketListStore>()(
    devtools(
        (set) => ({
            selectedGroupId: null,
            types: [],

            setSelectedGroupId: (groupId, hasChild) =>
                !hasChild && set(() => ({ selectedGroupId: groupId })),

            setTypes: (types: number[]) => set(() => ({ types })),
        }),
        { name: "market-list-store" }
    )
);
