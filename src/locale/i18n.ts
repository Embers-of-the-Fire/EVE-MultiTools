"use client";

import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import localeEN from "@/locale/en.json";
import localeZH from "@/locale/zh.json";

export const i18n = createInstance();

const initI18n = async () => {
    if (!i18n.isInitialized) {
        await i18n.use(initReactI18next).init({
            resources: {
                en: {
                    translation: localeEN,
                },
                zh: {
                    translation: localeZH,
                },
            },
            lng: "zh",
            fallbackLng: "zh",
            interpolation: {
                escapeValue: false,
            },
            debug: process.env.NODE_ENV === "development",
            react: {
                useSuspense: false,
            },
        });
    }
};

initI18n();

export default i18n;
