import { getGraphicPath, getIconPath } from "@/native/data";
import { convertFileSrc } from "@tauri-apps/api/core";

export async function getGraphicUrl(graphicId: number): Promise<string> {
    const path = await getGraphicPath(graphicId);
    const url = convertFileSrc(path);
    return url;
}

export async function getIconUrl(iconId: number): Promise<string> {
    const path = await getIconPath(iconId);
    const url = convertFileSrc(path);
    return url;
}
