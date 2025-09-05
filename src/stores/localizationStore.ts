import { useQuery } from "@tanstack/react-query";
import type { Language } from "@/native";
import { getLocalizationByLang } from "@/native/data";

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
    // 本地化文本不会改变，设置为永不过期
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 1000 * 60 * 60 * 24, // 24小时后从内存中清除未使用的缓存
});

export const useLocalizationQuery = (id: number, language: Language) => {
    return useQuery(createLocalizationQuery(id, language));
};
