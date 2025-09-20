import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { getMarketPrice } from "@/native/data";

export interface MarketRecord {
    typeID: number;
    sellMin: number | null;
    buyMax: number | null;
    lastUpdate: number;
}

// Query key factory for market data
export const marketQueryKeys = {
    all: ["market"] as const,
    price: (typeID: number) => [...marketQueryKeys.all, "price", typeID] as const,
    prices: (typeIDs: number[]) => [...marketQueryKeys.all, "prices", typeIDs] as const,
};

// Create query function for single market price
const createMarketPriceQuery = (typeID: number) => ({
    queryKey: marketQueryKeys.price(typeID),
    queryFn: async (): Promise<MarketRecord> => {
        const price = await getMarketPrice(typeID);
        return {
            typeID: price.type_id,
            sellMin: price.sell_min,
            buyMax: price.buy_max,
            lastUpdate: price.updated_at,
        };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
});

export const useMarketCache = () => {
    const queryClient = useQueryClient();

    const clearCache = useCallback(() => {
        queryClient.removeQueries({
            queryKey: marketQueryKeys.all,
        });
    }, [queryClient]);

    const clearTypeCache = useCallback(
        (typeID: number) => {
            queryClient.removeQueries({
                queryKey: marketQueryKeys.price(typeID),
            });
        },
        [queryClient]
    );

    return {
        clearCache,
        clearTypeCache,
    };
};

export const useMarketRecord = (
    typeID: number,
    shouldLoad: boolean = true
): MarketRecord & {
    isLoading: boolean;
    error: Error | null;
    refresh: () => void;
} => {
    const queryClient = useQueryClient();

    const query = useQuery({
        ...createMarketPriceQuery(typeID),
        enabled: shouldLoad,
    });

    const refresh = useCallback(() => {
        queryClient.invalidateQueries({
            queryKey: marketQueryKeys.price(typeID),
        });
    }, [queryClient, typeID]);

    return {
        typeID,
        sellMin: query.data?.sellMin ?? null,
        buyMax: query.data?.buyMax ?? null,
        lastUpdate: query.data?.lastUpdate ?? 0,
        isLoading: query.isLoading,
        error: query.error,
        refresh,
    };
};
