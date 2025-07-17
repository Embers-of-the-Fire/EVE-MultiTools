import { tauriInvoke } from "./base";
import { listen } from "@tauri-apps/api/event";
import { Channel } from "@tauri-apps/api/core";

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
 * Bundle import event types
 */
export type BundleImportEvent =
    | {
          event: "progress";
          data: {
              stage: ImportStage;
              current: number;
              total: number;
              message_key?: string;
              message_params?: Record<string, unknown>;
          };
      }
    | {
          event: "result";
          data: {
              success: boolean;
              bundle_name?: string;
              error_type?: ImportErrorType;
              error_params?: Record<string, unknown>;
          };
      };

/**
 * Import bundle file asynchronously with progress tracking using channels
 */
export async function importBundleFile(
    bundlePath: string,
    onEvent?: (event: BundleImportEvent) => void
): Promise<void> {
    const channel = new Channel<BundleImportEvent>();

    if (onEvent) {
        channel.onmessage = onEvent;
    }

    await tauriInvoke<void>("import_bundle_file", {
        bundlePath,
        onEvent: channel,
    });
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
    getBundles,
    removeBundle,
    getEnabledBundleId,
    enableBundle,
} as const;
