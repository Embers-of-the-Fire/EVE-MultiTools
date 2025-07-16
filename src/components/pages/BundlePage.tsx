"use client";

import { useState, useEffect, useCallback } from "react";
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

export function BundlePage() {
    const { t, i18n } = useTranslation();
    const [bundles, setBundles] = useState<BundleMetadata[]>([]);
    const [loading, setLoading] = useState(false);
    const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [bundleToDelete, setBundleToDelete] = useState<BundleMetadata | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [enabledBundleId, setEnabledBundleId] = useState<string | null>(null);
    const [enablingBundleId, setEnablingBundleId] = useState<string | null>(null);
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

    // Load bundles on component mount
    const loadBundles = useCallback(async () => {
        setLoading(true);
        try {
            const bundlesData = await bundleCommands.getBundles();
            setBundles(bundlesData);
        } catch (error) {
            console.error("Failed to load bundles:", error);
            toast.error(t("bundle.toast.load_failed"));
        } finally {
            setLoading(false);
        }
    }, [t]);

    const loadEnabledBundleId = useCallback(async () => {
        try {
            const id = await bundleCommands.getEnabledBundleId();
            setEnabledBundleId(id);
        } catch (error) {
            console.error("Failed to load enabled bundle ID:", error);
        }
    }, []);

    useEffect(() => {
        loadBundles();
        loadEnabledBundleId();
    }, [loadBundles, loadEnabledBundleId]);

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
            });

            if (result && !Array.isArray(result)) {
                setIsImporting(true);
                setImportProgress({ stage: ImportStage.Start, current: 0, total: 100 });

                await bundleCommands.importBundleFileAsync(
                    result,
                    (progress) => {
                        setImportProgress(progress);
                    },
                    (importResult) => {
                        setIsImporting(false);
                        setImportProgress(null);

                        if (importResult.success) {
                            toast.success(t("bundle.toast.import_success"), {
                                description: t("bundle.toast.import_success_message", {
                                    name: importResult.bundle_name,
                                }),
                            });
                            loadBundles();
                            loadEnabledBundleId(); // 导入成功后立即更新启用的bundle状态
                        } else {
                            toast.error(t("bundle.toast.import_failed"), {
                                description: t("bundle.toast.import_failed_message", {
                                    error: getErrorMessage(importResult),
                                }),
                            });
                        }
                    }
                );
            }
        } catch (error) {
            console.error("Import failed:", error);
            setIsImporting(false);
            setImportProgress(null);
            toast.error(t("bundle.toast.import_failed"));
        }
    };

    const handleEnable = async (serverId: string) => {
        setEnablingBundleId(serverId);
        try {
            await bundleCommands.enableBundle(serverId);
            setEnabledBundleId(serverId);
            toast.success(t("bundle.toast.enable_success"), {
                description: t("bundle.toast.enable_success_message"),
            });
        } catch (error) {
            console.error("Enable failed:", error);
            toast.error(t("bundle.toast.enable_failed"), {
                description: t("bundle.toast.enable_failed_message", {
                    error: error instanceof Error ? error.message : String(error),
                }),
            });
        } finally {
            setEnablingBundleId(null);
        }
    };

    const handleDelete = async () => {
        if (!bundleToDelete) return;

        setIsDeleting(true);
        try {
            await bundleCommands.removeBundle(bundleToDelete.serverID);
            setBundles(bundles.filter((b) => b.serverID !== bundleToDelete.serverID));

            // If this was the enabled bundle, clear the enabled state
            if (enabledBundleId === bundleToDelete.serverID) {
                setEnabledBundleId(null);
            }

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
                    {isImporting ? t("bundle.importing") : t("bundle.import_button")}
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
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="text-muted-foreground">{t("common.loading")}</div>
                    </div>
                ) : bundles.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-8">
                            <p className="text-muted-foreground">{t("bundle.no_data")}</p>
                        </CardContent>
                    </Card>
                ) : (
                    bundles.map((bundle) => {
                        const isEnabled = enabledBundleId === bundle.serverID;
                        const isEnabling = enablingBundleId === bundle.serverID;
                        const serverName =
                            bundle.serverName[i18n.language as keyof typeof bundle.serverName] ||
                            bundle.serverName.en;

                        return (
                            <Card key={bundle.serverID}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                {serverName}
                                                {isEnabled && (
                                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                                        {t("bundle.enabled")}
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
                                                    onClick={() => handleEnable(bundle.serverID)}
                                                    disabled={isEnabling}
                                                >
                                                    {isEnabling
                                                        ? t("common.loading")
                                                        : t("bundle.enable")}
                                                </Button>
                                            )}
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => openDeleteDialog(bundle)}
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
                                                {bundle.created}
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
                            {bundleToDelete && (
                                <>
                                    {t("bundle.delete_confirm_message", {
                                        name:
                                            bundleToDelete.serverName[
                                                i18n.language as keyof typeof bundleToDelete.serverName
                                            ] || bundleToDelete.serverName.en,
                                    })}
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeDeleteDialog} disabled={isDeleting}>
                            {t("common.cancel")}
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? t("bundle.deleting") : t("bundle.delete")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PageLayout>
    );
}
