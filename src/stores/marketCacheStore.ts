import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface MarketRecord {
    typeID: number;
    sellMin: number;
    buyMax: number;
    lastUpdate: number;
}

interface MarketCacheState {
    marketCache: Map<number, MarketRecord>;
}

interface MarketCacheActions {
    clearCache: () => void;
    clearTypeCache: (typeID: number) => void;

    updateCache: (typeID: number, record: MarketRecord) => void;
    updateCacheBulk: (records: MarketRecord[]) => void;
}

type MarketCacheStore = MarketCacheState & MarketCacheActions;

export const useMarketCacheStore = create<MarketCacheStore>()(
    devtools(
        (set) => ({
            marketCache: new Map(),

            clearCache: () => {
                set({ marketCache: new Map() });
            },

            clearTypeCache: (typeID: number) => {
                set((state) => {
                    const newCache = new Map(state.marketCache);
                    newCache.delete(typeID);
                    return { marketCache: newCache };
                });
            },

            updateCache: (typeID: number, record: MarketRecord) => {
                set((state) => {
                    const newCache = new Map(state.marketCache);
                    newCache.set(typeID, record);
                    return { marketCache: newCache };
                });
            },

            updateCacheBulk: (records: MarketRecord[]) => {
                set((state) => {
                    const newCache = new Map(state.marketCache);
                    records.forEach((record) => {
                        newCache.set(record.typeID, record);
                    });
                    return { marketCache: newCache };
                });
            },
        }),
        {
            name: "market-cache-store",
        }
    )
);
