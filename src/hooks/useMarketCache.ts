import { useCallback, useEffect, useState } from "react";
import { getMarketPrice } from "@/native/data";
import { type MarketRecord as BMarketRecord, useMarketCacheStore } from "@/stores/marketCacheStore";

export const useMarketCache = () => {
    const { clearCache, clearTypeCache } = useMarketCacheStore();

    return {
        clearCache,
        clearTypeCache,
    };
};

export type MarketRecordState = "missing" | "outdated" | "now";

export type MarketRecord = BMarketRecord & {
    state: MarketRecordState;
    refresh: (force?: boolean) => void;
};

const STALE_TIME = 5 * 60 * 1000; // 5 minutes

// 支持延迟加载的市场记录 hook，成为正式实现
export const useMarketRecord = (typeID: number, shouldLoad: boolean): MarketRecord => {
    const { marketCache } = useMarketCacheStore();
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
                console.log("Refreshing market data for typeID:", typeID);
                setIsLoading(true);
                getMarketPrice(typeID)
                    .then((data) => {
                        if (data) {
                            useMarketCacheStore.getState().updateCache(typeID, {
                                typeID: data.type_id,
                                sellMin: data.sell_min,
                                buyMax: data.buy_max,
                                lastUpdate: data.updated_at,
                            });
                        } else {
                            useMarketCacheStore.getState().clearTypeCache(typeID);
                        }
                    })
                    .finally(() => {
                        console.log("Market data refresh completed for typeID:", typeID);
                        setIsLoading(false);
                    });
            }
        },
        [isLoading, state, typeID]
    );

    // 只有在 shouldLoad 为 true 时才自动加载
    useEffect(() => {
        if (shouldLoad && state === "missing" && !isLoading) {
            const animationFrameId = requestAnimationFrame(() => {
                refresh();
            });
            return () => cancelAnimationFrame(animationFrameId);
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
