import { useMarketListStore } from "@/stores/marketListStore";

export const useMarketList = () => {
    const { selectedGroupId, types, setSelectedGroupId, setTypes } = useMarketListStore();

    return {
        selectedGroupId,
        types,
        setSelectedGroupId,
        setTypes,
    };
};
