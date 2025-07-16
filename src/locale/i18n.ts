"use client";

import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import localeEN from "@/locale/en.json";
import localeZH from "@/locale/zh.json";

// 创建全局i18n实例
export const i18n = createInstance();

// 立即初始化i18n实例
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

// 立即初始化
initI18n();

export default i18n;
