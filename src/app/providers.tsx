"use client";

import type { ThemeProviderProps } from "next-themes";
import type * as React from "react";
import { useEffect, useState, useCallback } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { I18nextProvider } from "react-i18next";
import { Toaster } from "@/components/ui/sonner";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { BundleProvider } from "@/contexts/BundleContext";
import { GlobalLoadingProvider, useGlobalLoading } from "@/contexts/GlobalLoadingContext";
import { AppInitializer } from "@/components/AppInitializer";
import { globalConfig } from "@/lib/global-config";
import { i18n } from "@/locale/i18n";
import { TypeExploreProvider } from "@/contexts/TypeExploreContext";

export interface ProvidersProps {
    children: React.ReactNode;
    themeProps?: ThemeProviderProps;
}

// 全局配置初始化组件
function GlobalConfigInitializer({ children }: { children: React.ReactNode }) {
    const [isInitialized, setIsInitialized] = useState(false);
    const { showLoading, hideLoading } = useGlobalLoading();

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
    const { showLoading, hideLoading } = useGlobalLoading();

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

export function Providers({ children, themeProps }: ProvidersProps) {
    return (
        <NextThemesProvider {...themeProps}>
            <GlobalLoadingProvider>
                <GlobalConfigInitializer>
                    <SettingsProvider>
                        <BundleProvider>
                            <TypeExploreProvider>
                                <I18nInitializer>
                                    <AppInitializer>{children}</AppInitializer>
                                    <Toaster />
                                </I18nInitializer>
                            </TypeExploreProvider>
                        </BundleProvider>
                    </SettingsProvider>
                </GlobalConfigInitializer>
            </GlobalLoadingProvider>
        </NextThemesProvider>
    );
}
