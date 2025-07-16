"use client";

import { useEffect, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { useSettings } from "@/contexts/SettingsContext";
import { useGlobalConfig } from "@/hooks/useGlobalConfig";
import { useTranslation } from "react-i18next";
import { useGlobalLoading } from "@/contexts/GlobalLoadingContext";

interface InitializerProps {
    children: React.ReactNode;
}

const APP_LOADING_ID = "app-initializer";

export function AppInitializer({ children }: InitializerProps) {
    const { setTheme } = useTheme();
    const { settings, loading, error } = useSettings();
    const { updateSettings, isInitialized } = useGlobalConfig();
    const [syncCompleted, setSyncCompleted] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const { t } = useTranslation();
    
    // 使用全局加载系统
    const { showLoading, hideLoading, updateProgress } = useGlobalLoading();

    // 稳定的加载方法
    const startAppLoading = useCallback((message: string) => {
        showLoading(APP_LOADING_ID, message);
    }, [showLoading]);

    const stopAppLoading = useCallback(() => {
        hideLoading(APP_LOADING_ID);
    }, [hideLoading]);

    const setAppProgress = useCallback((progress: number) => {
        updateProgress(APP_LOADING_ID, progress);
    }, [updateProgress]);

    // 确保只在客户端渲染时使用翻译
    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        // 如果正在加载设置或全局配置未初始化，显示加载状态
        if (loading || !isInitialized) {
            const message = isMounted
                ? t("common.loading_app_config")
                : "Loading app configuration...";
            startAppLoading(message);
        }

        // 只有当全局配置已初始化且用户设置加载完成时，才进行同步
        if (isInitialized && !loading && settings && !syncCompleted) {
            const syncSettings = async () => {
                try {
                    setAppProgress(50);

                    // 应用主题设置
                    const nextTheme = settings.theme === "Dark" ? "dark" : "light";
                    setTheme(nextTheme);

                    setAppProgress(80);

                    // 同步到全局配置（不会触发重新初始化）
                    await updateSettings({
                        theme: settings.theme,
                        language: settings.language === "zh" ? "zh" : "en",
                    });

                    setAppProgress(100);
                    setSyncCompleted(true);
                    console.log("Settings synchronized with global config:", settings);

                    // 完成后停止加载
                    stopAppLoading();
                } catch (error) {
                    console.error("Error synchronizing settings:", error);
                    stopAppLoading();
                }
            };

            syncSettings();
        }

        // 如果所有条件都满足，停止加载
        if (isInitialized && !loading && syncCompleted && isMounted) {
            stopAppLoading();
        }
    }, [
        loading,
        settings,
        syncCompleted,
        setTheme,
        updateSettings,
        isInitialized,
        isMounted,
        t,
        startAppLoading,
        stopAppLoading,
        setAppProgress,
    ]);

    // 显示错误状态
    if (error) {
        stopAppLoading();

        const errorText = isMounted
            ? t("common.error_loading_config", { error })
            : `Error loading config: ${error}`;
        const reloadText = isMounted ? t("common.reload") : "Reload";

        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="text-red-500 mb-4">
                        <div className="text-6xl mb-4">⚠️</div>
                    </div>
                    <p className="text-default-600 mb-4">{errorText}</p>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
                    >
                        {reloadText}
                    </button>
                </div>
            </div>
        );
    }

    // 所有加载完成后显示子组件
    if (isInitialized && !loading && syncCompleted && isMounted) {
        return <>{children}</>;
    }

    // 其他情况下返回null，让全局加载UI处理显示
    return null;
}
