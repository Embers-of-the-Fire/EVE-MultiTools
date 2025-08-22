import { convertFileSrc } from "@tauri-apps/api/core";
import { CATEGORY_ID_BLUEPRINT } from "@/constant/eve";
import {
    getFactionIconPath,
    getFactionLogoPath,
    getGraphicPath,
    getIconPath,
    getSkinMaterialIdByLicense,
    getSkinMaterialPath,
    type Type,
} from "@/native/data";
import { GraphicType } from "@/types/data";

export async function getGraphicUrl(
    graphicId: number,
    graphicType = GraphicType.Icon
): Promise<string | null> {
    const path = await getGraphicPath(graphicId, graphicType);
    if (!path) {
        return null;
    }
    const url = convertFileSrc(path);
    return url;
}

export async function getIconUrl(iconId: number): Promise<string | null> {
    const path = await getIconPath(iconId);
    if (!path) {
        return null;
    }
    const url = convertFileSrc(path);
    return url;
}

export async function getSkinMaterialUrl(skinId: number): Promise<string> {
    const path = await getSkinMaterialPath(skinId);
    const url = convertFileSrc(path);
    return url;
}

export async function getFactionIconUrl(iconId: number): Promise<string | null> {
    const path = await getFactionIconPath(iconId);
    if (!path) return null;
    return convertFileSrc(path);
}

export async function getFactionLogoUrl(logoId: string): Promise<string | null> {
    const path = await getFactionLogoPath(logoId);
    if (!path) return null;
    return convertFileSrc(path);
}

export async function getTypeImageUrl(typeData: Type, categoryId: number | null) {
    if (typeData.graphic_id) {
        const graphicUrl = await getGraphicUrl(
            typeData.graphic_id,
            categoryId === CATEGORY_ID_BLUEPRINT ? GraphicType.Blueprint : GraphicType.Icon
        );
        if (graphicUrl) {
            return graphicUrl;
        }
    }

    if (typeData.icon_id) {
        const iconUrl = await getIconUrl(typeData.icon_id);
        if (iconUrl) {
            return iconUrl;
        }
    }

    const skinMatId = await getSkinMaterialIdByLicense(typeData.type_id);
    if (skinMatId !== null) {
        return getSkinMaterialUrl(skinMatId);
    }

    return null;
}
