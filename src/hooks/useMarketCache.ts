import { useCallback, useEffect, useState } from "react";
import { type MarketRecord as BMarketRecord, useMarketCacheStore } from "@/stores/marketCacheStore";

const STALE_TIME = 5 * 60 * 1000; // 5 minutes

export const useMarketCache = () => {
    const {
        clearCache,
        clearTypeCache,
        requestMarketPrices,
        initGlobalListener,
        cleanupGlobalListener,
    } = useMarketCacheStore();

    // 初始化全局监听器
    useEffect(() => {
        initGlobalListener();
        return () => cleanupGlobalListener();
    }, [initGlobalListener, cleanupGlobalListener]);

    const preloadMarketPrices = useCallback(
        async (typeIDs: number[], force = false) => {
            if (!typeIDs || typeIDs.length === 0) return;

            const uniqueIds = Array.from(new Set(typeIDs));

            const { marketCache, requestedTypes } = useMarketCacheStore.getState();
            let toLoad = uniqueIds;

            if (!force) {
                toLoad = uniqueIds.filter((id) => {
                    const rec = marketCache.get(id);
                    if (rec) {
                        const timeDiff = Date.now() - rec.lastUpdate * 1000;
                        if (timeDiff < STALE_TIME) return false;
                    }
                    return !requestedTypes.has(id);
                });
            }

            if (toLoad.length === 0) return;

            requestMarketPrices(toLoad);
        },
        [requestMarketPrices]
    );

    return {
        clearCache,
        clearTypeCache,
        preloadMarketPrices,
    };
};

export type MarketRecordState = "missing" | "outdated" | "now";

export type MarketRecord = BMarketRecord & {
    state: MarketRecordState;
    refresh: (force?: boolean) => void;
};

export const useMarketRecord = (typeID: number, shouldLoad: boolean): MarketRecord => {
    const { marketCache, requestMarketPrice } = useMarketCacheStore();
    const [state, setState] = useState<MarketRecordState>("missing");
    const [record, setRecord] = useState<BMarketRecord | null>(null);

    useEffect(() => {
        const getInitialState = () => {
            const cachedRecord = marketCache.get(typeID);
            if (!cachedRecord) {
                return "missing";
            }
            const timeDiff = Date.now() - cachedRecord.lastUpdate * 1000;
            return timeDiff < STALE_TIME ? "now" : "outdated";
        };

        setRecord(marketCache.get(typeID) || null);
        setState(getInitialState());
    }, [typeID, marketCache]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: marketCache is too heavy to directly watch
    useEffect(() => {
        if (state === "now") {
            const cachedRecord = marketCache.get(typeID);
            if (cachedRecord) {
                const timeDiff = Date.now() - cachedRecord.lastUpdate * 1000;
                if (timeDiff >= STALE_TIME) {
                    setState("outdated");
                    return;
                }
                const timer = setTimeout(() => {
                    setState("outdated");
                }, STALE_TIME - timeDiff);
                return () => clearTimeout(timer);
            }
        }
    }, [state, typeID]);

    const refresh = useCallback(
        (force = false) => {
            if (force || state === "missing" || state === "outdated") {
                requestMarketPrice(typeID);
            }
        },
        [state, typeID, requestMarketPrice]
    );

    useEffect(() => {
        if (shouldLoad && state === "missing") {
            refresh();
        }
    }, [shouldLoad, state, refresh]);

    return {
        state,
        typeID: typeID,
        sellMin: record?.sellMin ?? 0,
        buyMax: record?.buyMax ?? 0,
        lastUpdate: record?.lastUpdate ?? 0,
        refresh,
    };
};
