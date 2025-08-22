import { LRUCache } from "lru-cache";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Language } from "@/native";
import { getLocalizationByLang } from "@/native/data";

interface LocalizationStoreState {
    cache: LRUCache<[number, Language], string>;
}

interface LocalizationStoreActions {
    getLocalizationByLang: (id: number, language: Language) => Promise<string>;
    clearCache: () => void;
}

type LocalizationStore = LocalizationStoreState & LocalizationStoreActions;

export const useLocalizationStore = create<LocalizationStore>()(
    devtools((_, get) => ({
        cache: new LRUCache({
            max: 500,
        }),

        getLocalizationByLang: async (id, language) => {
            const cacheKey: [number, Language] = [id, language];
            const cachedValue = get().cache.get(cacheKey);
            if (cachedValue) {
                return cachedValue;
            }

            const localization = await getLocalizationByLang(id, language);
            if (localization) {
                get().cache.set(cacheKey, localization);
                return localization;
            }
            console.warn(`Localization not found for id ${id} in language ${language}`);
            return "";
        },

        clearCache: () => {
            get().cache.clear();
            console.log("Localization cache cleared");
        },
    }))
);
