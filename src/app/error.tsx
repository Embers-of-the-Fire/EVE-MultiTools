"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";

// biome-ignore lint/suspicious/noShadowRestrictedNames: Project specified.
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
    const { t } = useTranslation();

    useEffect(() => {
        // Log the error to an error reporting service
        /* eslint-disable no-console */
        console.error(error);
    }, [error]);

    return (
        <div>
            <h2>{t("error.something_went_wrong")}</h2>
            <button type="button" onClick={() => reset()}>
                {t("error.try_again")}
            </button>
        </div>
    );
}
