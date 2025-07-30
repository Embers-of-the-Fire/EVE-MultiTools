import { useEffect } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import {
    useBundleStore,
    initializeBundleListeners,
    cleanupBundleListeners,
} from "@/stores/bundleStore";

export function useStoreInitializer() {
    const loadSettings = useSettingsStore((state) => state.loadSettings);
    const loadBundles = useBundleStore((state) => state.loadBundles);

    useEffect(() => {
        // 初始化 Settings Store
        loadSettings();

        // 初始化 Bundle Store 和事件监听器
        const initializeBundles = async () => {
            await initializeBundleListeners();
            await loadBundles(true); // 允许自动启用
        };

        initializeBundles();

        // 清理函数
        return () => {
            cleanupBundleListeners();
        };
    }, [loadSettings, loadBundles]);
}
