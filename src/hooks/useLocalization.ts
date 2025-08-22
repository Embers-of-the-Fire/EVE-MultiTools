import { useCallback } from "react";
import { useLocalizationStore } from "@/stores/localizationStore";
import { useLanguage } from "./useAppSettings";

export const useLocalization = () => {
    const { language } = useLanguage();

    const nativeLoc = useLocalizationStore();

    // biome-ignore lint/correctness/useExhaustiveDependencies: `nativeLoc` is never designed to change
    const loc = useCallback(
        (key: number) => {
            return nativeLoc.getLocalizationByLang(key, language);
        },
        [language]
    );

    return {
        loc,
    };
};
