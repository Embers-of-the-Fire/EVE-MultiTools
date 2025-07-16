"use client";

import { useEffect, useState, useCallback } from "react";
import { globalConfig, type AppSettings } from "@/lib/global-config";
import type { i18n as I18nType } from "i18next";

interface UseGlobalConfigReturn {
    settings: AppSettings | null;
    i18n: I18nType | null;
    isInitialized: boolean;
    updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
    initialize: (settings?: AppSettings) => Promise<void>;
}

export function useGlobalConfig(): UseGlobalConfigReturn {
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [i18n, setI18n] = useState<I18nType | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // 更新本地状态
    const updateLocalState = useCallback(() => {
        setSettings(globalConfig.getSettings());
        setI18n(globalConfig.getI18n());
        setIsInitialized(globalConfig.isInitialized());
    }, []);

    // 初始化函数
    const initialize = useCallback(
        async (settings?: AppSettings) => {
            try {
                await globalConfig.initialize(settings);
                updateLocalState();
            } catch (error) {
                console.error("Error initializing global config:", error);
                throw error;
            }
        },
        [updateLocalState]
    );

    // 更新设置函数
    const updateSettings = useCallback(
        async (newSettings: Partial<AppSettings>) => {
            try {
                await globalConfig.updateSettings(newSettings);
                updateLocalState();
            } catch (error) {
                console.error("Error updating settings:", error);
                throw error;
            }
        },
        [updateLocalState]
    );

    // 监听配置变化
    useEffect(() => {
        // 初始化本地状态
        updateLocalState();

        // 添加监听器
        const unsubscribe = globalConfig.addListener(updateLocalState);

        // 清理函数
        return unsubscribe;
    }, [updateLocalState]);

    return {
        settings,
        i18n,
        isInitialized,
        updateSettings,
        initialize,
    };
}

// 便捷的hooks
export function useGlobalSettings(): AppSettings | null {
    const { settings } = useGlobalConfig();
    return settings;
}

export function useGlobalI18n(): I18nType | null {
    const { i18n } = useGlobalConfig();
    return i18n;
}
