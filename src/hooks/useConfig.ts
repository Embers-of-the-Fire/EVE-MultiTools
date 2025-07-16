import { useState, useEffect, useCallback } from "react";
import { configManager } from "@/utils/config";
import type { GlobalSettings, Theme, Language } from "@/types/config";

interface UseConfigReturn {
    config: GlobalSettings | null;
    loading: boolean;
    error: string | null;
    setTheme: (theme: Theme) => Promise<void>;
    setLanguage: (language: Language) => Promise<void>;
    updateConfig: (config: GlobalSettings) => Promise<void>;
    resetToDefault: () => Promise<void>;
    reload: () => Promise<void>;
}

export function useConfig(): UseConfigReturn {
    const [config, setConfig] = useState<GlobalSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadConfig = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const currentConfig = await configManager.getConfig();
            setConfig(currentConfig);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load configuration");
            console.error("Error loading configuration:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    const setTheme = useCallback(
        async (theme: Theme) => {
            try {
                await configManager.setTheme(theme);
                if (config) {
                    setConfig({ ...config, theme });
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to set theme");
                throw err;
            }
        },
        [config]
    );

    const setLanguage = useCallback(
        async (language: Language) => {
            try {
                await configManager.setLanguage(language);
                if (config) {
                    setConfig({ ...config, language });
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to set language");
                throw err;
            }
        },
        [config]
    );

    const updateConfig = useCallback(async (newConfig: GlobalSettings) => {
        try {
            await configManager.updateConfig(newConfig);
            setConfig(newConfig);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update configuration");
            throw err;
        }
    }, []);

    const resetToDefault = useCallback(async () => {
        try {
            const defaultConfig = await configManager.resetConfigToDefault();
            setConfig(defaultConfig);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to reset configuration");
            throw err;
        }
    }, []);

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    return {
        config,
        loading,
        error,
        setTheme,
        setLanguage,
        updateConfig,
        resetToDefault,
        reload: loadConfig,
    };
}
