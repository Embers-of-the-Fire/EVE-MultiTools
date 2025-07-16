import { configCommands } from "@/native";
import type { ConfigAPI, GlobalSettings, Language, Theme } from "@/types/config";

class ConfigManager implements ConfigAPI {
    async getConfig(): Promise<GlobalSettings> {
        return await configCommands.getConfig();
    }

    async setTheme(theme: Theme): Promise<void> {
        await configCommands.setTheme(theme);
    }

    async setLanguage(language: Language): Promise<void> {
        await configCommands.setLanguage(language);
    }

    async updateConfig(config: GlobalSettings): Promise<void> {
        await configCommands.updateConfig(config);
    }

    async resetConfigToDefault(): Promise<GlobalSettings> {
        return await configCommands.resetConfigToDefault();
    }

    async getConfigFilePath(): Promise<string> {
        return await configCommands.getConfigFilePath();
    }

    async setEnabledBundleId(bundleId: string | null): Promise<void> {
        await configCommands.setEnabledBundleId(bundleId);
    }
}

export const configManager = new ConfigManager();

export type { ConfigAPI, GlobalSettings, Language, Theme };
export { ConfigManager };
