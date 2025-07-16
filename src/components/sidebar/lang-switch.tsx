"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages } from "lucide-react";
import clsx from "clsx";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";
import type { Language } from "@/types";

export interface LangSwitchProps {
    className?: string;
}

export const LangSwitch: FC<LangSwitchProps> = ({ className }) => {
    const { i18n, t } = useTranslation();
    const { setLanguage } = useSettings();

    const handleLanguageChange = async (newLang: Language) => {
        i18n.changeLanguage(newLang);

        try {
            await setLanguage(newLang);
        } catch (error) {
            console.error("Failed to update language in config:", error);
        }
    };

    const currentLang = i18n.language;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className={clsx("w-9 h-9 p-0", className)}>
                    <Languages className="h-4 w-4" />
                    <span className="sr-only">Change language</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={() => handleLanguageChange("en")}
                    className={currentLang === "en" ? "bg-accent" : ""}
                >
                    <span className="mr-2">🇺🇸</span>
                    {t("common.english")}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleLanguageChange("zh")}
                    className={currentLang === "zh" ? "bg-accent" : ""}
                >
                    <span className="mr-2">🇨🇳</span>
                    {t("common.chinese")}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
