import { tauriInvoke } from "./base";
import type { GlobalSettings, Language, Theme } from "@/types/config";

/**
 * Get configuration
 */
export async function getConfig(): Promise<GlobalSettings> {
    return await tauriInvoke<GlobalSettings>("get_config");
}

/**
 * Set theme
 */
export async function setTheme(theme: Theme): Promise<void> {
    return await tauriInvoke<void>("set_theme", { theme });
}

/**
 * Set language
 */
export async function setLanguage(language: Language): Promise<void> {
    return await tauriInvoke<void>("set_language", { language });
}

/**
 * Update configuration
 */
export async function updateConfig(config: GlobalSettings): Promise<void> {
    return await tauriInvoke<void>("update_config", { newConfig: config });
}

/**
 * Reset configuration to default values
 */
export async function resetConfigToDefault(): Promise<GlobalSettings> {
    return await tauriInvoke<GlobalSettings>("reset_config_to_default");
}

/**
 * Get configuration file path
 */
export async function getConfigFilePath(): Promise<string> {
    return await tauriInvoke<string>("get_config_file_path");
}

/**
 * Set enabled bundle ID
 */
export async function setEnabledBundleId(bundleId: string | null): Promise<void> {
    return await tauriInvoke<void>("set_enabled_bundle_id", { bundleId });
}

// Export convenient object-style interface
export const configCommands = {
    getConfig,
    setTheme,
    setLanguage,
    updateConfig,
    resetConfigToDefault,
    getConfigFilePath,
    setEnabledBundleId,
} as const;
