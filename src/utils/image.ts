import { convertFileSrc } from "@tauri-apps/api/core";
import {
    getFactionIconPath,
    getGraphicPath,
    getIconPath,
    getSkinMaterialPath,
} from "@/native/data";
import { GraphicType } from "@/types/data";

export async function getGraphicUrl(
    graphicId: number,
    graphicType = GraphicType.Icon
): Promise<string> {
    const path = await getGraphicPath(graphicId, graphicType);
    const url = convertFileSrc(path);
    return url;
}

export async function getIconUrl(iconId: number): Promise<string> {
    const path = await getIconPath(iconId);
    const url = convertFileSrc(path);
    return url;
}

export async function getSkinMaterialUrl(skinId: number): Promise<string> {
    const path = await getSkinMaterialPath(skinId);
    const url = convertFileSrc(path);
    return url;
}

export async function getFactionIconUrl(iconId: string): Promise<string | null> {
    const path = await getFactionIconPath(iconId);
    if (!path) return null;
    return convertFileSrc(path);
}
