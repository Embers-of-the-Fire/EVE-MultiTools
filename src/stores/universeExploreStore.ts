import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type UniverseObjectType = "region" | "constellation" | "system";
export interface UniverseObject {
    id: number;
    type: UniverseObjectType;
}

interface UniverseExploreState {
    currentUniverseObject: UniverseObject | null;
    history: UniverseObject[];
}

interface UniverseExploreActions {
    setCurrentUniverseObject: (obj: UniverseObject) => void;

    clearCurrentUniverseObject: () => void;
    clearHistory: () => void;
}

type UniverseExploreStore = UniverseExploreState & UniverseExploreActions;

export const useUniverseExploreStore = create<UniverseExploreStore>()(
    devtools(
        (set, get) => ({
            currentUniverseObject: null,
            history: [],

            setCurrentUniverseObject: (obj: UniverseObject) => {
                const { history } = get();
                set({
                    currentUniverseObject: obj,
                    history: [
                        obj,
                        ...history.filter((o) => o.id !== obj.id || o.type !== obj.type),
                    ],
                });
            },

            clearCurrentUniverseObject: () => {
                set({ currentUniverseObject: null });
            },

            clearHistory: () => {
                set({
                    history: [],
                    currentUniverseObject: null,
                });
            },
        }),
        {
            name: "universe-explore-store",
        }
    )
);
