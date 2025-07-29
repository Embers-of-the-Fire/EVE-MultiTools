import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { configManager } from '@/utils/config';
import type { GlobalSettings, Theme, Language } from '@/types/config';

interface SettingsState {
  settings: GlobalSettings | null;
  loading: boolean;
  error: string | null;
}

interface SettingsActions {
  setTheme: (theme: Theme) => Promise<void>;
  setLanguage: (language: Language) => Promise<void>;
  updateSettings: (settings: GlobalSettings) => Promise<void>;
  resetToDefault: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  loadSettings: () => Promise<void>;
  setSettings: (settings: GlobalSettings | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type SettingsStore = SettingsState & SettingsActions;

export const useSettingsStore = create<SettingsStore>()(
  devtools((set, get) => ({
    // 初始状态
    settings: null,
    loading: true,
    error: null,

    // Actions
    setSettings: (settings: GlobalSettings | null) => {
      set({ settings });
    },

    setLoading: (loading: boolean) => {
      set({ loading });
    },

    setError: (error: string | null) => {
      set({ error });
    },

    loadSettings: async () => {
      const { setLoading, setError, setSettings } = get();
      
      try {
        setLoading(true);
        setError(null);
        const currentSettings = await configManager.getConfig();
        setSettings(currentSettings);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load settings';
        setError(errorMessage);
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    },

    setTheme: async (theme: Theme) => {
      const { settings, setSettings, setError } = get();
      
      try {
        await configManager.setTheme(theme);
        if (settings) {
          setSettings({ ...settings, theme });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to set theme';
        setError(errorMessage);
        throw err;
      }
    },

    setLanguage: async (language: Language) => {
      const { settings, setSettings, setError } = get();
      
      try {
        await configManager.setLanguage(language);
        if (settings) {
          setSettings({ ...settings, language });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to set language';
        setError(errorMessage);
        throw err;
      }
    },

    updateSettings: async (newSettings: GlobalSettings) => {
      const { setSettings, setError } = get();
      
      try {
        await configManager.updateConfig(newSettings);
        setSettings(newSettings);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
        setError(errorMessage);
        throw err;
      }
    },

    resetToDefault: async () => {
      const { setSettings, setError } = get();
      
      try {
        const defaultSettings = await configManager.resetConfigToDefault();
        setSettings(defaultSettings);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to reset settings';
        setError(errorMessage);
        throw err;
      }
    },

    refreshSettings: async () => {
      const { loadSettings } = get();
      await loadSettings();
    },
  }), {
    name: 'settings-store',
  })
);
