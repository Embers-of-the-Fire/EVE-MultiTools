import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { removeDuplicate } from "@/utils/iterator";

interface TypeExploreState {
    currentTypeID: number | null;
    history: number[];
}

interface TypeExploreActions {
    setCurrentTypeID: (typeID: number | null) => void;
    clearCurrentType: () => void;
    clearHistory: () => void;
}

type TypeExploreStore = TypeExploreState & TypeExploreActions;

export const useTypeExploreStore = create<TypeExploreStore>()(
    devtools(
        (set, get) => ({
            // 初始状态
            currentTypeID: null,
            history: [],

            // Actions
            setCurrentTypeID: (typeID: number | null) => {
                if (typeID === null) {
                    set({ currentTypeID: null });
                    return;
                }
                const { history } = get();
                set({
                    currentTypeID: typeID,
                    history: removeDuplicate([typeID, ...history]),
                });
            },

            clearCurrentType: () => {
                set({ currentTypeID: null });
            },

            clearHistory: () => {
                set({
                    history: [],
                    currentTypeID: null,
                });
            },
        }),
        {
            name: "type-explore-store",
        }
    )
);
