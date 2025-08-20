import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface MarketRecord {
    typeID: number;
    sellMin: number | null;
    buyMax: number | null;
    lastUpdate: number;
}

interface MarketCacheState {
    marketCache: Map<number, MarketRecord>;
    inFlight: Map<number, Promise<any>>;
}

interface MarketCacheActions {
    clearCache: () => void;
    clearTypeCache: (typeID: number) => void;

    updateCache: (typeID: number, record: MarketRecord) => void;
    updateCacheBulk: (records: MarketRecord[]) => void;

    setInFlight: (typeID: number, promise: Promise<any>) => void;
    getInFlight: (typeID: number) => Promise<any> | undefined;
    deleteInFlight: (typeID: number) => void;
    hasInFlight: (typeID: number) => boolean;
}

type MarketCacheStore = MarketCacheState & MarketCacheActions;

export const useMarketCacheStore = create<MarketCacheStore>()(
    devtools(
        (set, get) => ({
            marketCache: new Map(),
            inFlight: new Map(),

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

            setInFlight: (typeID: number, promise: Promise<any>) => {
                set((state) => {
                    const newInFlight = new Map(state.inFlight);
                    newInFlight.set(typeID, promise);
                    return { inFlight: newInFlight };
                });
            },

            getInFlight: (typeID: number) => {
                return get().inFlight.get(typeID);
            },

            deleteInFlight: (typeID: number) => {
                set((state) => {
                    const newInFlight = new Map(state.inFlight);
                    newInFlight.delete(typeID);
                    return { inFlight: newInFlight };
                });
            },

            hasInFlight: (typeID: number) => {
                return get().inFlight.has(typeID);
            },
        }),
        {
            name: "market-cache-store",
        }
    )
);
