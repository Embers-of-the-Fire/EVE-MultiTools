import { useMarketGroupTreeStore } from "@/stores/marketGroupTreeStore";

export const useMarketGroupTree = () => {
    const { tree, isLoading, error, loadMarketGroupTree } = useMarketGroupTreeStore();

    return {
        tree,
        isLoading,
        error,
        loadMarketGroupTree,
    };
};
