"use client";

import { useIsSSR } from "@react-aria/ssr";
import clsx from "clsx";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSettings } from "@/hooks/useSettings";

export interface ThemeSwitchProps {
    className?: string;
}

export const ThemeSwitch: FC<ThemeSwitchProps> = ({ className }) => {
    const { theme: currentTheme, setTheme } = useTheme();
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

    const getCurrentIcon = () => {
        if (currentTheme === "light") return <Sun className="h-4 w-4" />;
        if (currentTheme === "dark") return <Moon className="h-4 w-4" />;
        return <Monitor className="h-4 w-4" />;
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className={clsx("w-9 h-9 p-0", className)}>
                    {getCurrentIcon()}
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="space-y-1">
                <DropdownMenuItem
                    onClick={() => handleThemeChange("light")}
                    className={currentTheme === "light" ? "bg-accent" : ""}
                >
                    <Sun className="h-4 w-4 mr-2" />
                    {t("settings.theme.light")}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleThemeChange("dark")}
                    className={currentTheme === "dark" ? "bg-accent" : ""}
                >
                    <Moon className="h-4 w-4 mr-2" />
                    {t("settings.theme.dark")}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleThemeChange("system")}
                    className={currentTheme === "system" ? "bg-accent" : ""}
                >
                    <Monitor className="h-4 w-4 mr-2" />
                    {t("settings.theme.system")}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
