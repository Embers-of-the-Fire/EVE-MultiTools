export type Theme = "Dark" | "Light";
export type Language = "zh" | "en";

export interface GlobalSettings {
    theme: Theme;
    language: Language;
    enabled_bundle_id?: string | null;
}

export interface ConfigAPI {
    getConfig(): Promise<GlobalSettings>;
    setTheme(theme: Theme): Promise<void>;
    setLanguage(language: Language): Promise<void>;
    updateConfig(config: GlobalSettings): Promise<void>;
    resetConfigToDefault(): Promise<GlobalSettings>;
    getConfigFilePath(): Promise<string>;
    setEnabledBundleId(bundleId: string | null): Promise<void>;
}
