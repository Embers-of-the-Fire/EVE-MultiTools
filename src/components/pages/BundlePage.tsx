"use client";

import { useState, useEffect, useCallback } from "react";
import {
    bundleCommands,
    type BundleMetadata,
    type ImportProgress,
    type ImportResult,
} from "@/native";
import { open } from "@tauri-apps/plugin-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter,
    DialogClose 
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export function BundlePage() {
    const { t } = useTranslation();
    const [bundles, setBundles] = useState<BundleMetadata[]>([]);
    const [loading, setLoading] = useState(false);
    const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [bundleToDelete, setBundleToDelete] = useState<BundleMetadata | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const loadBundles = useCallback(async () => {
        try {
            const result = await bundleCommands.getBundles();
            setBundles(result);
        } catch (err) {
            toast.error(t("bundle.toast.load_failed"), {
                description: t("bundle.toast.load_failed_message", { error: String(err) }),
            });
        }
    }, [t]);

    useEffect(() => {
        loadBundles();
    }, [loadBundles]);

    const handleImportBundle = async () => {
        try {
            setLoading(true);
            setImportProgress(null);
            setIsImporting(true);

            const selected = await open({
                multiple: false,
                filters: [
                    {
                        name: "Bundle Files",
                        extensions: ["bundle"],
                    },
                ],
            });

            if (!selected) {
                setLoading(false);
                setIsImporting(false);
                return;
            }

            // 使用异步导入
            await bundleCommands.importBundleFileAsync(
                selected as string,
                (progress: ImportProgress) => {
                    setImportProgress(progress);
                },
                (result: ImportResult) => {
                    setIsImporting(false);
                    setImportProgress(null);

                    if (result.success) {
                        toast.success(t("bundle.toast.import_success"), {
                            description: t("bundle.toast.import_success_message", { name: result.bundle_name }),
                        });
                        // 重新加载bundles列表
                        loadBundles();
                    } else {
                        toast.error(t("bundle.toast.import_failed"), {
                            description: result.error_type || t("bundle.toast.import_failed_message", { error: "Unknown error" }),
                        });
                    }
                },
            );
        } catch (err) {
            toast.error(t("bundle.toast.import_failed"), {
                description: t("bundle.toast.import_failed_message", { error: String(err) }),
            });
            setIsImporting(false);
            setImportProgress(null);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBundle = async () => {
        if (!bundleToDelete) return;

        setIsDeleting(true);

        try {
            await bundleCommands.removeBundle(bundleToDelete.serverID);
            toast.success(t("bundle.toast.delete_success"), {
                description: t("bundle.toast.delete_success_message", { 
                    name: bundleToDelete.serverName.zh || bundleToDelete.serverName.en 
                }),
            });
            loadBundles();
        } catch (err) {
            toast.error(t("bundle.toast.delete_failed"), {
                description: t("bundle.toast.delete_failed_message", { error: String(err) }),
            });
        } finally {
            setIsDeleting(false);
            setBundleToDelete(null);
            setDeleteDialogOpen(false);
        }
    };

    const confirmDeleteBundle = (bundle: BundleMetadata) => {
        setBundleToDelete(bundle);
        setDeleteDialogOpen(true);
    };

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold">{t("nav.bundle")}</h1>
                    <p className="text-muted-foreground">{t("bundle.description")}</p>
                </div>
                <Button 
                    onClick={handleImportBundle}
                    disabled={loading || isImporting}
                >
                    {isImporting ? t("bundle.importing") : t("bundle.import_button")}
                </Button>
            </div>

            {/* 导入进度显示 */}
            {importProgress && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                    {importProgress.message_key 
                                        ? t(importProgress.message_key, importProgress.message_params)
                                        : "Processing..."
                                    }
                                </span>
                                <Badge variant="outline">
                                    {Math.round((importProgress.current / importProgress.total) * 100)}%
                                </Badge>
                            </div>
                            <Progress 
                                value={importProgress.current} 
                                max={importProgress.total}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{importProgress.stage}</span>
                                <span>{importProgress.current}/{importProgress.total}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {bundles.map((bundle) => (
                    <Card key={bundle.serverID}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-base">
                                    {bundle.serverName.zh || bundle.serverName.en}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    {bundle.serverID}
                                </p>
                            </div>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => confirmDeleteBundle(bundle)}
                                disabled={isDeleting}
                            >
                                {t("bundle.delete")}
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t("bundle.game_version")}:</span>
                                    <span>{bundle.gameInfo.version}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t("bundle.game_build")}:</span>
                                    <span>{bundle.gameInfo.build}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t("bundle.created")}:</span>
                                    <span>{new Date(bundle.created).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            
            {/* 空状态 */}
            {bundles.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground">{t("bundle.no_data")}</p>
                </div>
            )}

            {/* 删除确认对话框 */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("bundle.delete_confirm.title")}</DialogTitle>
                        <DialogDescription>
                            {t("bundle.delete_confirm.message", { 
                                name: bundleToDelete?.serverName.zh || bundleToDelete?.serverName.en 
                            })}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-muted-foreground">
                            {t("bundle.delete_confirm.warning")}
                        </p>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" disabled={isDeleting}>
                                {t("bundle.delete_confirm.cancel")}
                            </Button>
                        </DialogClose>
                        <Button 
                            variant="destructive" 
                            onClick={handleDeleteBundle}
                            disabled={isDeleting}
                        >
                            {isDeleting ? t("bundle.deleting") : t("bundle.delete_confirm.confirm")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
