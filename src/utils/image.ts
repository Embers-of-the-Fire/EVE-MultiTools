import { convertFileSrc } from "@tauri-apps/api/core";
import { getGraphicPath, getIconPath, getSkinMaterialPath } from "@/native/data";
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
