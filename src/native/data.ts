import { tauriInvoke } from "./base";

export async function getGraphicPath(graphicId: number): Promise<string> {
    return await tauriInvoke<string>("get_graphic_path", { graphicId });
}

export async function getIconPath(iconId: number): Promise<string> {
    return await tauriInvoke<string>("get_icon_path", { iconId });
}

export const imageCommands = {
    getGraphicPath,
    getIconPath,
} as const;

export const dataCommands = {
    imageCommands,
} as const;
