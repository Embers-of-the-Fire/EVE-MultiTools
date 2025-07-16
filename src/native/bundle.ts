import { tauriInvoke } from "./base";
import { listen } from "@tauri-apps/api/event";

/**
 * Bundle metadata interface
 */
export interface BundleMetadata {
    serverID: string;
    serverName: {
        en: string;
        zh: string;
    };
    created: string;
    gameInfo: {
        version: string;
        build: string;
    };
}

/**
 * Import stage enum
 */
export enum ImportStage {
    Start = "Start",
    Extracting = "Extracting",
    Complete = "Complete",
    Error = "Error",
}

/**
 * Import error types
 */
export enum ImportErrorType {
    DirectoryExists = "DirectoryExists",
    InvalidFileName = "InvalidFileName",
    IoError = "IoError",
    ZipError = "ZipError",
    RegistrationError = "RegistrationError",
}

/**
 * Import progress interface
 */
export interface ImportProgress {
    stage: ImportStage;
    current: number;
    total: number;
    message_key?: string;
    message_params?: Record<string, unknown>;
}

/**
 * Import result interface
 */
export interface ImportResult {
    success: boolean;
    bundle_name?: string;
    error_type?: ImportErrorType;
    error_params?: Record<string, unknown>;
}

/**
 * Import bundle file (legacy synchronous method)
 */
export async function importBundleFile(bundlePath: string): Promise<string> {
    return await tauriInvoke<string>("import_bundle_file", { bundlePath });
}

/**
 * Import bundle file asynchronously with progress tracking
 */
export async function importBundleFileAsync(
    bundlePath: string,
    onProgress?: (progress: ImportProgress) => void,
    onResult?: (result: ImportResult) => void
): Promise<string> {
    const taskId = await tauriInvoke<string>("import_bundle_file_async", {
        bundlePath,
    });

    // 监听进度事件
    if (onProgress) {
        const progressUnlisten = await listen<ImportProgress>(
            `bundle_import_progress_${taskId}`,
            (event) => {
                onProgress(event.payload);
            }
        );

        // 监听结果事件来取消进度监听
        const resultUnlisten = await listen<ImportResult>(`bundle_import_result_${taskId}`, () => {
            progressUnlisten();
            resultUnlisten();
        });
    }

    // 监听结果事件
    if (onResult) {
        const resultUnlisten = await listen<ImportResult>(
            `bundle_import_result_${taskId}`,
            (event) => {
                onResult(event.payload);
                resultUnlisten();
            }
        );
    }

    return taskId;
}

/**
 * Get all bundles list
 */
export async function getBundles(): Promise<BundleMetadata[]> {
    // biome-ignore lint/suspicious/noExplicitAny: Case convert.
    return (await tauriInvoke<any[]>("get_bundles")).map((val) => {
        return {
            serverID: val.server,
            serverName: val["server-name"],
            created: val.created,
            gameInfo: val.game,
        };
    });
}

/**
 * Remove bundle by server ID
 */
export async function removeBundle(serverId: string): Promise<void> {
    return await tauriInvoke<void>("remove_bundle", { serverId });
}

/**
 * Get enabled bundle server ID
 */
export async function getEnabledBundleId(): Promise<string | null> {
    return await tauriInvoke<string | null>("get_enabled_bundle_id");
}

/**
 * Enable bundle by server ID
 */
export async function enableBundle(serverId: string): Promise<void> {
    return await tauriInvoke<void>("enable_bundle", { serverId });
}

// Export convenient object-style interface
export const bundleCommands = {
    importBundleFile,
    importBundleFileAsync,
    getBundles,
    removeBundle,
    getEnabledBundleId,
    enableBundle,
} as const;
