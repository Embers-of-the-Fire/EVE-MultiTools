"use client";

import type { FC } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { useIsSSR } from "@react-aria/ssr";
import { Moon, Sun, Monitor } from "lucide-react";
import clsx from "clsx";

import { useSettings } from "@/hooks/useSettings";
import { useTranslation } from "react-i18next";

export interface ThemeSwitchProps {
    className?: string;
}

export const ThemeSwitch: FC<ThemeSwitchProps> = ({ className }) => {
    const { theme: _theme, setTheme } = useTheme();
    const { setTheme: setConfigTheme } = useSettings();
    const { t } = useTranslation();
    const isSSR = useIsSSR();

    const handleThemeChange = async (newTheme: string) => {
        setTheme(newTheme);

        // 只有当主题不是 system 时才更新配置
        if (newTheme !== "system") {
            const configTheme = newTheme === "light" ? "Light" : "Dark";
            try {
                await setConfigTheme(configTheme);
            } catch (error) {
                console.error("Failed to update theme in config:", error);
            }
        }
    };

    if (isSSR) {
        return (
            <Button variant="ghost" size="sm" className={clsx("w-9 h-9 p-0", className)} disabled>
                <Sun className="h-4 w-4" />
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className={clsx("w-9 h-9 p-0", className)}>
                    <Sun className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                    <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleThemeChange("light")}>
                    <Sun className="h-4 w-4 mr-2" />
                    {t("settings.theme.light")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
                    <Moon className="h-4 w-4 mr-2" />
                    {t("settings.theme.dark")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleThemeChange("system")}>
                    <Monitor className="h-4 w-4 mr-2" />
                    {t("settings.theme.system")}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
