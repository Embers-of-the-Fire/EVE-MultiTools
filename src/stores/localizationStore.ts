import type { Language } from "@/native";
import { getLocalizationByLang, getUiLocalizationByLang } from "@/native/data";

export const localizationKeys = {
    all: ["localization"] as const,
    byLang: (id: number, language: Language) =>
        [...localizationKeys.all, "by-lang", id, language] as const,
};

export const createLocalizationQuery = (id: number, language: Language) => ({
    queryKey: localizationKeys.byLang(id, language),
    queryFn: async (): Promise<string> => {
        const localization = await getLocalizationByLang(id, language);
        if (localization) {
            return localization;
        }
        console.warn(`Localization not found for id ${id} in language ${language}`);
        return "";
    },

    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 1000 * 60 * 601,
});

export const localizationUiKeys = {
    all: ["localization-ui"] as const,
    byLang: (id: string, language: Language) =>
        [...localizationUiKeys.all, "by-lang", id, language] as const,
};

export const createUiLocalizationQuery = (id: string, language: Language) => ({
    queryKey: localizationUiKeys.byLang(id, language),
    queryFn: async (): Promise<string> => {
        const localization = await getUiLocalizationByLang(id, language);
        if (localization) {
            return localization;
        }
        console.warn(`UI Localization not found for id ${id} in language ${language}`);
        return "";
    },

    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 1000 * 60 * 60,
});
