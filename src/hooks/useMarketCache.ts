import { useCallback, useEffect, useState } from "react";
import { getMarketPrice, getMarketPrices } from "@/native/data";
import {
    type MarketRecord as BMarketRecord,
    useMarketCacheStore,
} from "@/stores/marketCacheStore";

const STALE_TIME = 5 * 60 * 1000; // 5 minutes

export const useMarketCache = () => {
    const {
        clearCache,
        clearTypeCache,
        setInFlight,
        getInFlight,
        deleteInFlight,
        hasInFlight,
    } = useMarketCacheStore();

    const preloadMarketPrices = useCallback(
        async (typeIDs: number[], force = false) => {
            if (!typeIDs || typeIDs.length === 0) return;

            const uniqueIds = Array.from(new Set(typeIDs));

            const { marketCache } = useMarketCacheStore.getState();
            let toLoad = uniqueIds;
            if (!force) {
                toLoad = uniqueIds.filter((id) => {
                    const rec = marketCache.get(id);
                    if (!rec) return true;
                    const timeDiff = Date.now() - rec.lastUpdate * 1000;
                    return timeDiff >= STALE_TIME;
                });
            }
            if (toLoad.length === 0) return;

            const pending = toLoad.filter((id) => !hasInFlight(id));
            if (pending.length === 0) {
                await Promise.all(uniqueIds.map((id) => getInFlight(id)!));
                return;
            }

            const batchPromise = getMarketPrices(pending);
            pending.forEach((id) => {
                const p = batchPromise.then((prices) => {
                    const found = prices.find((p) => p.type_id === id) || null;
                    if (found) {
                        useMarketCacheStore.getState().updateCache(id, {
                            typeID: found.type_id,
                            sellMin: found.sell_min,
                            buyMax: found.buy_max,
                            lastUpdate: found.updated_at,
                        });
                        return found;
                    } else {
                        useMarketCacheStore.getState().clearTypeCache(id);
                        return null;
                    }
                }).finally(() => {
                    deleteInFlight(id);
                });
                setInFlight(id, p);
            });

            await Promise.all(pending.map((id) => getInFlight(id)!));
        },
        [setInFlight, getInFlight, deleteInFlight, hasInFlight],
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

export const useMarketRecord = (
    typeID: number,
    shouldLoad: boolean,
): MarketRecord => {
    const { marketCache, setInFlight, getInFlight, deleteInFlight } =
        useMarketCacheStore();
    const [isLoading, setIsLoading] = useState(false);
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
            if (isLoading) {
                return;
            }
            if (force || state === "missing" || state === "outdated") {
                setIsLoading(true);

                const existing = getInFlight(typeID);
                const promise = existing ?? (getMarketPrice(typeID)
                    .then((data) => {
                        if (data) {
                            useMarketCacheStore.getState().updateCache(typeID, {
                                typeID: data.type_id,
                                sellMin: data.sell_min,
                                buyMax: data.buy_max,
                                lastUpdate: data.updated_at,
                            });
                            return data;
                        } else {
                            useMarketCacheStore.getState().clearTypeCache(
                                typeID,
                            );
                            return null;
                        }
                    })
                    .finally(() => {
                        deleteInFlight(typeID);
                    }));

                if (!existing) setInFlight(typeID, promise);

                promise.finally(() => {
                    setIsLoading(false);
                });
            }
        },
        [isLoading, state, typeID, getInFlight, setInFlight, deleteInFlight],
    );

    useEffect(() => {
        if (shouldLoad && state === "missing" && !isLoading) {
            refresh();
        }
    }, [shouldLoad, state, refresh, isLoading]);

    return {
        state,
        typeID: typeID,
        sellMin: record?.sellMin ?? 0,
        buyMax: record?.buyMax ?? 0,
        lastUpdate: record?.lastUpdate ?? 0,
        refresh,
    };
};
