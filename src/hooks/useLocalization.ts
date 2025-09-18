import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { createLocalizationQuery, createUiLocalizationQuery } from "@/stores/localizationStore";
import { useLanguage } from "./useAppSettings";

export const useLocalization = () => {
    const { language } = useLanguage();
    const queryClient = useQueryClient();

    const loc = useCallback(
        async (key: number) => {
            const queryOptions = createLocalizationQuery(key, language);
            return await queryClient.ensureQueryData(queryOptions);
        },
        [language, queryClient]
    );

    const uiLoc = useCallback(
        async (key: string) => {
            const queryOptions = createUiLocalizationQuery(key, language);
            return await queryClient.ensureQueryData(queryOptions);
        },
        [language, queryClient]
    );

    return {
        loc,
        uiLoc,
    };
};

export type LocGetter = ReturnType<typeof useLocalization>["loc"];
export type UiLocGetter = ReturnType<typeof useLocalization>["uiLoc"];
