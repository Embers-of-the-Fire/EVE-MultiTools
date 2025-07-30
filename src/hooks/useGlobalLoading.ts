import {
    useGlobalLoadingStore,
    useIsLoading,
    useLoadingMessage,
    useLoadingProgress,
} from "@/stores/globalLoadingStore";

export function useGlobalLoading() {
    const { showLoading, hideLoading, updateProgress } = useGlobalLoadingStore();
    const isLoading = useIsLoading();
    const loadingMessage = useLoadingMessage();
    const loadingProgress = useLoadingProgress();

    return {
        isLoading,
        loadingMessage,
        loadingProgress,
        showLoading,
        hideLoading,
        updateProgress,
    };
}
