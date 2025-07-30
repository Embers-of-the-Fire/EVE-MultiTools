"use client";

import type { ThemeProviderProps } from "next-themes";
import type * as React from "react";
import { useEffect, useState, useCallback } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { I18nextProvider } from "react-i18next";
import { Toaster } from "@/components/ui/sonner";
import { AppInitializer } from "@/components/AppInitializer";
import { globalConfig } from "@/lib/global-config";
import { i18n } from "@/locale/i18n";
import {
    useGlobalLoadingStore,
    useIsLoading,
    useLoadingMessage,
    useLoadingProgress,
} from "@/stores/globalLoadingStore";
import { useSettingsStore } from "@/stores/settingsStore";
import {
    useBundleStore,
    initializeBundleListeners,
    cleanupBundleListeners,
} from "@/stores/bundleStore";

export interface ProvidersProps {
    children: React.ReactNode;
    themeProps?: ThemeProviderProps;
}

// 全局配置初始化组件
function GlobalConfigInitializer({ children }: { children: React.ReactNode }) {
    const [isInitialized, setIsInitialized] = useState(false);
    const { showLoading, hideLoading } = useGlobalLoadingStore();

    const startGlobalConfigLoading = useCallback(() => {
        showLoading("global-config", "Initializing global configuration...");
    }, [showLoading]);

    const stopGlobalConfigLoading = useCallback(() => {
        hideLoading("global-config");
    }, [hideLoading]);

    useEffect(() => {
        if (!globalConfig.isInitialized() && !isInitialized) {
            const initializeConfig = async () => {
                startGlobalConfigLoading();
                try {
                    await globalConfig.initialize();
                    setIsInitialized(true);
                    console.log("Global configuration initialized");
                } catch (error) {
                    console.error("Error initializing global config:", error);
                } finally {
                    stopGlobalConfigLoading();
                }
            };
            initializeConfig();
        } else if (globalConfig.isInitialized()) {
            setIsInitialized(true);
        }
    }, [isInitialized, startGlobalConfigLoading, stopGlobalConfigLoading]);

    if (!isInitialized) {
        return null;
    }

    return <>{children}</>;
}

// I18n初始化组件
function I18nInitializer({ children }: { children: React.ReactNode }) {
    const [isReady, setIsReady] = useState(false);
    const { showLoading, hideLoading } = useGlobalLoadingStore();

    const startI18nLoading = useCallback(() => {
        showLoading("i18n", "Loading language settings...");
    }, [showLoading]);

    const stopI18nLoading = useCallback(() => {
        hideLoading("i18n");
    }, [hideLoading]);

    useEffect(() => {
        const initializeI18n = async () => {
            startI18nLoading();
            try {
                // 等待i18n初始化完成
                while (!i18n.isInitialized) {
                    await new Promise((resolve) => setTimeout(resolve, 50));
                }
                setIsReady(true);
            } catch (error) {
                console.error("Error initializing i18n:", error);
            } finally {
                stopI18nLoading();
            }
        };

        initializeI18n();
    }, [startI18nLoading, stopI18nLoading]);

    if (!isReady) {
        return null;
    }

    return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

// Store初始化组件
function StoreInitializer({ children }: { children: React.ReactNode }) {
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

    return <>{children}</>;
}

// 全局加载UI组件
function GlobalLoadingUI({ message, progress }: { message: string; progress?: number }) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const displayMessage = isMounted ? message : "Loading...";

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center">
            <div className="bg-background border border-border rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4 mx-auto"></div>
                    <p className="text-default-600 mb-2">{displayMessage}</p>
                    {progress !== undefined && (
                        <div className="w-full bg-default-200 rounded-full h-2 mb-2">
                            <div
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                            ></div>
                        </div>
                    )}
                    {progress !== undefined && (
                        <p className="text-xs text-default-500">{Math.round(progress)}%</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// 全局加载组件管理器
function GlobalLoadingManager({ children }: { children: React.ReactNode }) {
    const isLoading = useIsLoading();
    const loadingMessage = useLoadingMessage();
    const loadingProgress = useLoadingProgress();
    const { showLoadingUI, setShowLoadingUI } = useGlobalLoadingStore();
    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

    // 防抖逻辑：500ms后才显示加载UI
    useEffect(() => {
        if (isLoading && !showLoadingUI) {
            // 开始加载，设置500ms延迟
            const timer = setTimeout(() => {
                setShowLoadingUI(true);
            }, 500);
            setDebounceTimer(timer);
        } else if (!isLoading && showLoadingUI) {
            // 停止加载，清除定时器并隐藏UI
            if (debounceTimer) {
                clearTimeout(debounceTimer);
                setDebounceTimer(null);
            }
            // 添加一个小延迟确保UI平滑过渡
            setTimeout(() => {
                setShowLoadingUI(false);
            }, 100);
        }

        // 清理定时器
        return () => {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
        };
    }, [isLoading, showLoadingUI, debounceTimer, setShowLoadingUI]);

    return (
        <>
            {children}
            {/* 全局加载UI - 只在需要时显示 */}
            {showLoadingUI && isLoading && (
                <GlobalLoadingUI message={loadingMessage} progress={loadingProgress} />
            )}
        </>
    );
}

export function Providers({ children, themeProps }: ProvidersProps) {
    return (
        <NextThemesProvider {...themeProps}>
            <GlobalLoadingManager>
                <GlobalConfigInitializer>
                    <StoreInitializer>
                        <I18nInitializer>
                            <AppInitializer>{children}</AppInitializer>
                            <Toaster />
                        </I18nInitializer>
                    </StoreInitializer>
                </GlobalConfigInitializer>
            </GlobalLoadingManager>
        </NextThemesProvider>
    );
}
