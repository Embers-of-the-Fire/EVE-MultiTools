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
        // const now = performance.now();
        // console.debug(`Invoking Tauri command: ${command}`, args);
        const out = await invoke<T>(command, args);
        // console.debug(
        //     `Tauri command "${command}" completed in ${(performance.now() - now).toFixed(2)} ms`,
        //     args
        // );
        return out;
    } catch (error) {
        console.error(`Tauri command "${command}" failed:`, error);
        throw error;
    }
}
