import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { useCallback, useEffect } from "react";
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
        // Trigger the native function to fetch market price
        // The actual data will come through the event listener
        await getMarketPrice(typeID);

        // Return a placeholder that will be updated by the event
        return {
            typeID,
            sellMin: null,
            buyMax: null,
            lastUpdate: Date.now() / 1000,
        };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
});

// biome-ignore lint/correctness/noUnusedVariables: Used in the event listener setup
let globalListener: UnlistenFn | null = null;
let isListenerInitialized = false;

// Initialize global event listener for market price updates
const initGlobalMarketListener = async (queryClient: ReturnType<typeof useQueryClient>) => {
    if (isListenerInitialized) return;

    try {
        globalListener = await listen<{
            type_id: number;
            sell_min: number | null;
            buy_max: number | null;
            updated_at: number;
        }>("market_price_success", (event) => {
            const price = event.payload;
            const queryKey = marketQueryKeys.price(price.type_id);

            // Update the query data with the received market price
            queryClient.setQueryData<MarketRecord>(queryKey, {
                typeID: price.type_id,
                sellMin: price.sell_min,
                buyMax: price.buy_max,
                lastUpdate: price.updated_at,
            });
        });

        isListenerInitialized = true;
    } catch (error) {
        console.error("Failed to initialize global market listener:", error);
    }
};

export const useMarketCache = () => {
    const queryClient = useQueryClient();

    // Initialize global listener
    useEffect(() => {
        initGlobalMarketListener(queryClient);
        return () => {
            // Don't cleanup on unmount since other components might still need it
            // Only cleanup when the app is shutting down
        };
    }, [queryClient]);

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

    // Initialize global listener if not already done
    useEffect(() => {
        initGlobalMarketListener(queryClient);
    }, [queryClient]);

    return {
        typeID,
        sellMin: query.data?.sellMin ?? 0,
        buyMax: query.data?.buyMax ?? 0,
        lastUpdate: query.data?.lastUpdate ?? 0,
        isLoading: query.isLoading,
        error: query.error,
        refresh,
    };
};
