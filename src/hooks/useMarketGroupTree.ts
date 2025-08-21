import { useMarketGroupTreeStore } from "@/stores/marketGroupTreeStore";

export const useMarketGroupTree = () => {
    const {
        tree,
        filteredTree,
        isLoading,
        error,
        currentSearchQuery,
        searchLanguage,
        loadMarketGroupTree,
        filterTreeByName,
        clearFilter,
    } = useMarketGroupTreeStore();

    return {
        tree,
        filteredTree,
        isLoading,
        error,
        currentSearchQuery,
        searchLanguage,
        loadMarketGroupTree,
        filterTreeByName,
        clearFilter,
    };
};
