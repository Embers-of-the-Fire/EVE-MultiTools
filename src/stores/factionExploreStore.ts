import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { removeDuplicate } from "@/utils/iterator";

interface FactionExploreState {
    currentFactionID: number | null;
    history: number[];
}

interface FactionExploreActions {
    setCurrentFactionID: (factionID: number | null) => void;
    clearCurrentFaction: () => void;
    clearHistory: () => void;
}

type FactionExploreStore = FactionExploreState & FactionExploreActions;

export const useFactionExploreStore = create<FactionExploreStore>()(
    devtools(
        (set, get) => ({
            // 初始状态
            currentFactionID: null,
            history: [],

            // Actions
            setCurrentFactionID: (factionID: number | null) => {
                if (factionID === null) {
                    set({ currentFactionID: null });
                    return;
                }
                const { history } = get();
                set({
                    currentFactionID: factionID,
                    history: removeDuplicate([factionID, ...history]),
                });
            },

            clearCurrentFaction: () => {
                set({ currentFactionID: null });
            },

            clearHistory: () => {
                set({
                    history: [],
                    currentFactionID: null,
                });
            },
        }),
        {
            name: "faction-explore-store",
        }
    )
);
