import { useSettingsStore } from "@/stores/settingsStore";

export function useSettings() {
    return useSettingsStore();
}
