import { openUrl } from "@tauri-apps/plugin-opener";

export const openExternalLink = async (url: string) => {
    if (!url || !url.startsWith("http")) {
        throw new Error(`Invalid URL provided: ${url}`);
    }
    await openUrl(url);
};
