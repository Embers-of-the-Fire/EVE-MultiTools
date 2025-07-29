"use client";

import { useSettings } from "@/hooks/useSettings";
import type { Theme, Language } from "@/types/config";
import { useTranslation } from "react-i18next";

export default function ConfigPanel() {
    const { settings, loading, error, setTheme, setLanguage, resetToDefault } = useSettings();
    const { t } = useTranslation();

    const handleThemeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        try {
            await setTheme(e.target.value as Theme);
        } catch (err) {
            console.error("Failed to set theme:", err);
        }
    };

    const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        try {
            await setLanguage(e.target.value as Language);
        } catch (err) {
            console.error("Failed to set language:", err);
        }
    };

    const handleReset = async () => {
        try {
            await resetToDefault();
        } catch (err) {
            console.error("Failed to reset config:", err);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-md mx-auto p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-red-600 dark:text-red-400">
                    {t("common.error_loading_config", { error })}
                </div>
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="max-w-md mx-auto p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>No configuration loaded</div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">App Configuration</h3>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="theme-select" className="block text-sm font-medium">
                        {t("settings.theme")}
                    </label>
                    <select
                        id="theme-select"
                        value={settings.theme}
                        onChange={handleThemeChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white"
                    >
                        <option value="Dark">{t("settings.theme.dark")}</option>
                        <option value="Light">Light</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label htmlFor="language-select" className="block text-sm font-medium">
                        {t("settings.language")}
                    </label>
                    <select
                        id="language-select"
                        value={settings.language}
                        onChange={handleLanguageChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white"
                    >
                        <option value="zh">Chinese</option>
                        <option value="en">English</option>
                    </select>
                </div>

                <div className="pt-4">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition-colors"
                    >
                        Reset to Default
                    </button>
                </div>

                <div className="pt-2 text-xs text-gray-500">
                    <p>Current Configuration:</p>
                    <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">
                        {JSON.stringify(settings, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    );
}
