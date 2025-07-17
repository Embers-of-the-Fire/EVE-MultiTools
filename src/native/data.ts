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

export type LocString = {
    en: string;
    zh: string;
};

export async function getLocalization(key: number): Promise<LocString | null> {
    return await tauriInvoke<LocString | null>("get_localization", { key });
}

export async function getLocalizationByLang(
    key: number,
    lang: "en" | "zh",
): Promise<string | null> {
    const loc = await getLocalization(key);
    if (!loc) return null;
    return lang === "en" ? loc.en : loc.zh;
}

export const localizationCommands = {
    getLocalization,
    getLocalizationByLang,
} as const;

export const dataCommands = {
    imageCommands,
    localizationCommands,
} as const;
