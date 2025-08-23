"use client";

import { AlertCircle, ChevronsUpDown, Database, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { useLanguage } from "@/hooks/useAppSettings";
import { useBundle } from "@/hooks/useBundle";
import { cn } from "@/lib/utils";
import type { BundleMetadata } from "@/native/bundle";

export function BundleSwitcher() {
    const { t } = useTranslation();
    const { language } = useLanguage();
    const { isMobile } = useSidebar();
    const { bundles, activeBundle, switchingToBundleId, error, switchBundle, clearError } =
        useBundle();

    const getLocalizedServerName = (bundle: BundleMetadata) => {
        return bundle.serverName[language] || bundle.serverName.en;
    };

    const noActiveBundle = activeBundle === null;
    const isSwitching = switchingToBundleId !== null;

    const handleErrorClick = () => {
        clearError();
    };

    return (
        <SidebarMenu>
            {error && (
                <Alert variant="destructive" className="mb-2" onClick={handleErrorClick}>
                    <AlertTitle>{t("common.error")}</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild disabled={isSwitching}>
                        <SidebarMenuButton
                            size="lg"
                            className={cn(
                                "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                                noActiveBundle &&
                                    !isSwitching &&
                                    "bg-destructive/20 text-destructive-foreground hover:bg-destructive/30"
                            )}
                        >
                            <div
                                className={cn(
                                    "bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg",
                                    noActiveBundle &&
                                        !isSwitching &&
                                        "bg-destructive text-destructive-foreground"
                                )}
                            >
                                {isSwitching ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : noActiveBundle ? (
                                    <AlertCircle className="size-4" />
                                ) : (
                                    <Database className="size-4" />
                                )}
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                {activeBundle ? (
                                    <>
                                        <span className="truncate font-medium">
                                            {getLocalizedServerName(activeBundle)}
                                        </span>
                                        <span className="truncate text-xs">
                                            {t("bundle.version", {
                                                version: activeBundle.gameInfo.version,
                                            })}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <span className="truncate font-medium">
                                            {t("bundle.no_active")}
                                        </span>
                                        <span className="truncate text-xs">
                                            {t("bundle.please_select")}
                                        </span>
                                    </>
                                )}
                            </div>
                            <ChevronsUpDown className="ml-auto" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        align="start"
                        side={isMobile ? "bottom" : "right"}
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="text-muted-foreground text-xs">
                            {t("bundle.available_bundles")}
                        </DropdownMenuLabel>

                        {bundles.length === 0 ? (
                            <DropdownMenuItem disabled className="p-2 opacity-50">
                                {t("bundle.no_bundles_available")}
                            </DropdownMenuItem>
                        ) : (
                            bundles.map((bundle) => (
                                <DropdownMenuItem
                                    key={bundle.serverID}
                                    onClick={() => switchBundle(bundle)}
                                    disabled={isSwitching}
                                    className="gap-2 p-2 justify-between group"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="flex size-6 items-center justify-center rounded-md border">
                                            <Database className="size-3.5 shrink-0" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span>{getLocalizedServerName(bundle)}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {t("bundle.version", {
                                                    version: bundle.gameInfo.version,
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                    {switchingToBundleId === bundle.serverID && (
                                        <Loader2 className="size-4 animate-spin" />
                                    )}
                                </DropdownMenuItem>
                            ))
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
