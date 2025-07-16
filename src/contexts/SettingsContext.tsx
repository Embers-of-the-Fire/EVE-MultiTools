"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { configManager } from "@/utils/config";
import type { GlobalSettings, Theme, Language } from "@/types/config";

interface SettingsContextType {
    settings: GlobalSettings | null;
    loading: boolean;
    error: string | null;
    setTheme: (theme: Theme) => Promise<void>;
    setLanguage: (language: Language) => Promise<void>;
    updateSettings: (settings: GlobalSettings) => Promise<void>;
    resetToDefault: () => Promise<void>;
    refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export interface SettingsProviderProps {
    children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
    const [settings, setSettings] = useState<GlobalSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadSettings = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const currentSettings = await configManager.getConfig();
            setSettings(currentSettings);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to load settings";
            setError(errorMessage);
            console.error("Error loading settings:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const setTheme = async (theme: Theme) => {
        try {
            await configManager.setTheme(theme);
            if (settings) {
                setSettings({ ...settings, theme });
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to set theme";
            setError(errorMessage);
            throw err;
        }
    };

    const setLanguage = async (language: Language) => {
        try {
            await configManager.setLanguage(language);
            if (settings) {
                setSettings({ ...settings, language });
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to set language";
            setError(errorMessage);
            throw err;
        }
    };

    const updateSettings = async (newSettings: GlobalSettings) => {
        try {
            await configManager.updateConfig(newSettings);
            setSettings(newSettings);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to update settings";
            setError(errorMessage);
            throw err;
        }
    };

    const resetToDefault = async () => {
        try {
            const defaultSettings = await configManager.resetConfigToDefault();
            setSettings(defaultSettings);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to reset settings";
            setError(errorMessage);
            throw err;
        }
    };

    const refreshSettings = async () => {
        await loadSettings();
    };

    const value: SettingsContextType = {
        settings,
        loading,
        error,
        setTheme,
        setLanguage,
        updateSettings,
        resetToDefault,
        refreshSettings,
    };

    return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextType {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
}
