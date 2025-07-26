"use client";

import { useState } from "react";
import {
    bundleCommands,
    type BundleMetadata,
    type ImportProgress,
    type ImportResult,
    ImportStage,
} from "@/native";
import { open } from "@tauri-apps/plugin-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { PageLayout } from "@/components/layout/PageLayout";
import { Loader2 } from "lucide-react";
import { useBundle } from "@/contexts/BundleContext";

export function BundlePage() {
    const { t, i18n } = useTranslation();
    const { bundles, activeBundle, switchingToBundleId, failedBundleIds, isLoading, switchBundle } =
        useBundle();

    const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [bundleToDelete, setBundleToDelete] = useState<BundleMetadata | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Helper function to get localized message from progress
    const getProgressMessage = (progress: ImportProgress): string => {
        if (progress.message_key) {
            return t(progress.message_key, progress.message_params);
        }
        return "";
    };

    // Helper function to get localized error message
    const getErrorMessage = (result: ImportResult): string => {
        if (result.error_type) {
            const errorKey = `bundle.errors.${result.error_type.toLowerCase()}`;
            return t(errorKey, result.error_params);
        }
        return t("bundle.errors.unknown");
    };

    const handleImport = async () => {
        try {
            const result = await open({
                title: t("bundle.import_button"),
                filters: [
                    {
                        name: "Bundle Files",
                        extensions: ["bundle"],
                    },
                ],
                multiple: false,
            });

            if (result && !Array.isArray(result)) {
                setIsImporting(true);
                setImportProgress({ stage: ImportStage.Start, current: 0, total: 100 });

                await bundleCommands.importBundleFile(result, (event) => {
                    if (event.event === "progress") {
                        setImportProgress(event.data);
                    } else if (event.event === "result") {
                        setIsImporting(false);
                        setImportProgress(null);

                        if (event.data.success) {
                            toast.success(t("bundle.toast.import_success"), {
                                description: t("bundle.toast.import_success_message", {
                                    name: event.data.bundle_name,
                                }),
                            });
                        } else {
                            toast.error(t("bundle.toast.import_failed"), {
                                description: t("bundle.toast.import_failed_message", {
                                    error: getErrorMessage(event.data),
                                }),
                            });
                        }
                    }
                });
            }
        } catch (error) {
            console.error("Import failed:", error);
            setIsImporting(false);
            setImportProgress(null);
            toast.error(t("bundle.toast.import_failed"));
        }
    };

    const handleEnable = async (bundle: BundleMetadata) => {
        try {
            await switchBundle(bundle);
        } catch (error) {
            console.error("Enable failed:", error);
            toast.error(t("bundle.toast.enable_failed"), {
                description: t("bundle.toast.enable_failed_message", {
                    error: error instanceof Error ? error.message : String(error),
                }),
            });
        }
    };

    const handleDelete = async () => {
        if (!bundleToDelete) return;

        setIsDeleting(true);
        try {
            await bundleCommands.removeBundle(bundleToDelete.serverID);
            toast.success(t("bundle.toast.delete_success"), {
                description: t("bundle.toast.delete_success_message", {
                    name:
                        bundleToDelete.serverName[
                            i18n.language as keyof typeof bundleToDelete.serverName
                        ] || bundleToDelete.serverName.en,
                }),
            });
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error(t("bundle.toast.delete_failed"), {
                description: t("bundle.toast.delete_failed_message", {
                    error: error instanceof Error ? error.message : String(error),
                }),
            });
        } finally {
            setIsDeleting(false);
            setBundleToDelete(null);
            setIsDialogOpen(false);
        }
    };

    const openDeleteDialog = (bundle: BundleMetadata) => {
        setBundleToDelete(bundle);
        setIsDialogOpen(true);
    };

    const closeDeleteDialog = () => {
        setBundleToDelete(null);
        setIsDialogOpen(false);
    };

    return (
        <PageLayout
            title={t("bundle.title")}
            description={t("bundle.description")}
            actions={
                <Button onClick={handleImport} disabled={isImporting} className="min-w-[200px]">
                    {isImporting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t("bundle.importing")}
                        </>
                    ) : (
                        t("bundle.import_button")
                    )}
                </Button>
            }
        >
            {/* Import Progress */}
            {importProgress && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t("bundle.importing")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Progress value={(importProgress.current / importProgress.total) * 100} />
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{getProgressMessage(importProgress)}</span>
                            <span>
                                {importProgress.current} / {importProgress.total}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Bundles List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : bundles.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-8">
                            <p className="text-muted-foreground">{t("bundle.no_data")}</p>
                        </CardContent>
                    </Card>
                ) : (
                    bundles.map((bundle) => {
                        const isEnabled = activeBundle?.serverID === bundle.serverID;
                        const isEnabling = switchingToBundleId === bundle.serverID;
                        const isFailed = failedBundleIds.has(bundle.serverID);
                        const serverName =
                            bundle.serverName[i18n.language as keyof typeof bundle.serverName] ||
                            bundle.serverName.en;

                        return (
                            <Card key={bundle.serverID}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <span className={isFailed ? "text-red-600" : ""}>
                                                    {serverName}
                                                </span>
                                                {isEnabled && !isEnabling && (
                                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                                        {t("bundle.enabled")}
                                                    </span>
                                                )}
                                                {isFailed && (
                                                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                                        {t("bundle.enable_failed")}
                                                    </span>
                                                )}
                                            </CardTitle>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {t("bundle.server_id")}: {bundle.serverID}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            {!isEnabled && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEnable(bundle)}
                                                    disabled={
                                                        isEnabling || switchingToBundleId !== null
                                                    }
                                                >
                                                    {isEnabling ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            {t("common.enabling")}
                                                        </>
                                                    ) : (
                                                        t("bundle.enable")
                                                    )}
                                                </Button>
                                            )}
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => openDeleteDialog(bundle)}
                                                disabled={
                                                    isEnabling || switchingToBundleId !== null
                                                }
                                            >
                                                {t("bundle.delete")}
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="font-medium">
                                                {t("bundle.created")}:
                                            </span>
                                            <span className="ml-2 text-muted-foreground">
                                                {new Date(bundle.created).toLocaleString()}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="font-medium">
                                                {t("bundle.game_version")}:
                                            </span>
                                            <span className="ml-2 text-muted-foreground">
                                                {bundle.gameInfo.version}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="font-medium">
                                                {t("bundle.game_build")}:
                                            </span>
                                            <span className="ml-2 text-muted-foreground">
                                                {bundle.gameInfo.build}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("bundle.delete_confirm_title")}</DialogTitle>
                        <DialogDescription>
                            {bundleToDelete &&
                                t("bundle.delete_confirm_message", {
                                    name:
                                        bundleToDelete.serverName[
                                            i18n.language as keyof typeof bundleToDelete.serverName
                                        ] || bundleToDelete.serverName.en,
                                })}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeDeleteDialog} disabled={isDeleting}>
                            {t("common.cancel")}
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t("bundle.deleting")}
                                </>
                            ) : (
                                t("bundle.delete")
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PageLayout>
    );
}
