import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { getMarketPrice } from "@/native/data";

export interface MarketRecord {
    typeID: number;
    sellMin: number | null;
    buyMax: number | null;
    lastUpdate: number;
}

interface MarketCacheState {
    marketCache: Map<number, MarketRecord>;
    requestedTypes: Set<number>; // 已请求的类型
    globalListener: UnlistenFn | null; // 全局事件监听器
}

interface MarketCacheActions {
    clearCache: () => void;
    clearTypeCache: (typeID: number) => void;

    updateCache: (typeID: number, record: MarketRecord) => void;
    updateCacheBulk: (records: MarketRecord[]) => void;

    requestMarketPrice: (typeID: number) => void;
    requestMarketPrices: (typeIDs: number[]) => void;

    initGlobalListener: () => Promise<void>;
    cleanupGlobalListener: () => void;
}

type MarketCacheStore = MarketCacheState & MarketCacheActions;

export const useMarketCacheStore = create<MarketCacheStore>()(
    devtools(
        (set, get) => ({
            marketCache: new Map(),
            requestedTypes: new Set(),
            globalListener: null,

            clearCache: () => {
                set({ marketCache: new Map(), requestedTypes: new Set() });
            },

            clearTypeCache: (typeID: number) => {
                set((state) => {
                    const newCache = new Map(state.marketCache);
                    const newRequested = new Set(state.requestedTypes);
                    newCache.delete(typeID);
                    newRequested.delete(typeID);
                    return { marketCache: newCache, requestedTypes: newRequested };
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

            requestMarketPrice: (typeID: number) => {
                const state = get();
                if (state.requestedTypes.has(typeID)) return; // 已经请求过了

                set((state) => ({
                    requestedTypes: new Set(state.requestedTypes).add(typeID),
                }));

                getMarketPrice(typeID).catch((error: unknown) => {
                    console.error(`Failed to request price for type ${typeID}:`, error);
                    set((state) => {
                        const newRequested = new Set(state.requestedTypes);
                        newRequested.delete(typeID);
                        return { requestedTypes: newRequested };
                    });
                });
            },

            requestMarketPrices: (typeIDs: number[]) => {
                const state = get();
                const toRequest = typeIDs.filter((id) => !state.requestedTypes.has(id));

                if (toRequest.length === 0) return;

                set((state) => {
                    const newRequested = new Set(state.requestedTypes);
                    toRequest.forEach((id) => newRequested.add(id));
                    return { requestedTypes: newRequested };
                });

                toRequest.forEach((typeID) => {
                    getMarketPrice(typeID).catch((error: unknown) => {
                        console.error(`Failed to request price for type ${typeID}:`, error);
                        set((state) => {
                            const newRequested = new Set(state.requestedTypes);
                            newRequested.delete(typeID);
                            return { requestedTypes: newRequested };
                        });
                    });
                });
            },

            initGlobalListener: async () => {
                const state = get();
                if (state.globalListener) return;

                try {
                    const unlisten = await listen<{
                        type_id: number;
                        sell_min: number | null;
                        buy_max: number | null;
                        updated_at: number;
                    }>("market_price_success", (event) => {
                        const price = event.payload;
                        get().updateCache(price.type_id, {
                            typeID: price.type_id,
                            sellMin: price.sell_min,
                            buyMax: price.buy_max,
                            lastUpdate: price.updated_at,
                        });
                    });

                    set({ globalListener: unlisten });
                } catch (error) {
                    console.error("Failed to initialize global market listener:", error);
                }
            },

            cleanupGlobalListener: () => {
                const state = get();
                if (state.globalListener) {
                    state.globalListener();
                    set({ globalListener: null });
                }
            },
        }),
        {
            name: "market-cache-store",
        }
    )
);
