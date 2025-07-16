import { invoke } from "@tauri-apps/api/core";

/**
 * Basic Tauri invoke wrapper
 * Provides unified error handling and type safety
 */
export async function tauriInvoke<T = unknown>(
    command: string,
    args?: Record<string, unknown>
): Promise<T> {
    try {
        return await invoke<T>(command, args);
    } catch (error) {
        console.error(`Tauri command "${command}" failed:`, error);
        throw error;
    }
}
