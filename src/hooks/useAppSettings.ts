import { useSettingsStore } from '@/stores/settingsStore';
import { useEffect } from 'react';

export function useAppSettings() {
    const { settings, loading, error, setTheme, setLanguage, updateSettings, resetToDefault } =
        useSettingsStore();

    const isReady = !loading && !error && settings !== null;

    useEffect(() => {
        if (isReady) {
            // Apply theme to document
            const theme = settings?.theme === 'Dark' ? 'dark' : 'light';
            document.documentElement.classList.toggle('dark', theme === 'dark');

            // Apply language to document
            const language = settings?.language === 'zh' ? 'zh' : 'en';
            document.documentElement.setAttribute('lang', language);
        }
    }, [isReady, settings]);

    return {
        settings,
        loading,
        error,
        isReady,
        setTheme,
        setLanguage,
        updateSettings,
        resetToDefault,
    };
}

// Convenience hooks for specific settings
export function useTheme() {
    const { settings, setTheme } = useSettingsStore();
    return {
        theme: settings?.theme || 'Dark',
        setTheme,
    };
}

export function useLanguage() {
    const { settings, setLanguage } = useSettingsStore();
    return {
        language: settings?.language || 'en',
        setLanguage,
    };
}
