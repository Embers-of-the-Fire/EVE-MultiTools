import { GraphicType } from "@/types/data";
import { tauriInvoke } from "./base";

export async function getGraphicPath(
    graphicId: number,
    graphicType = GraphicType.Icon,
): Promise<string> {
    return await tauriInvoke<string>("get_graphic_path", {
        graphicId,
        graphicType,
    });
}

export async function getIconPath(iconId: number): Promise<string> {
    return await tauriInvoke<string>("get_icon_path", { iconId });
}

export async function getSkinMaterialPath(
    skinMaterialId: number,
): Promise<string> {
    return await tauriInvoke<string>("get_skin_material_path", {
        skinMaterialId,
    });
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

export interface Group {
    group_id: number;
    group_name_id: number;
    icon_id: number;
    category_id: number;
    anchorable: boolean;
    fittable_non_singleton: boolean;
    anchored: boolean;
    published: boolean;
    use_base_price: boolean;
}

export async function getGroup(groupId: number): Promise<Group | null> {
    return await tauriInvoke<Group | null>("get_group", { groupId });
}

export interface Category {
    category_id: number;
    category_name_id: number;
    icon_id?: number;
    published: boolean;
}

export async function getCategory(
    categoryId: number,
): Promise<Category | null> {
    return await tauriInvoke<Category | null>("get_category", { categoryId });
}

export interface MetaGroup {
    name_id: number;
    icon_id?: number;
}
export async function getMetaGroup(
    metaGroupId: number,
): Promise<MetaGroup | null> {
    return await tauriInvoke<MetaGroup | null>("get_meta_group", {
        metaGroupId,
    });
}

export interface Type {
    base_price: number;
    capacity: number;
    certificate_template?: number;
    description_id?: number;
    designer_ids: number[];
    faction_id?: number;
    graphic_id?: number;
    group_id: number;
    icon_id?: number;
    is_dynamic_type: boolean;
    isis_group_id?: number;
    market_group_id?: number;
    meta_group_id?: number;
    meta_level?: number;
    portion_size: number;
    published: boolean;
    quote_author_id?: number;
    quote_id?: number;
    race_id?: number;
    radius: number;
    sound_id?: number;
    tech_level?: number;
    type_id: number;
    type_name_id: number;
    variation_parent_type_id?: number;
    volume: number;
    wreck_type_id?: number;
}

export async function getType(typeId: number): Promise<Type | null> {
    return await tauriInvoke<Type | null>("get_type", { typeId });
}

export async function searchTypeByName(
    name: string,
    language: "en" | "zh",
    limit: number = 20,
): Promise<number[]> {
    return await tauriInvoke<number[]>("search_type_by_name", {
        name,
        language,
        limit,
    });
}

export async function searchTypeByDescription(
    desc: string,
    language: "en" | "zh",
    limit: number = 20,
): Promise<number[]> {
    return await tauriInvoke<number[]>("search_type_by_description", {
        desc,
        language,
        limit,
    });
}

export interface Skin {
    skin_id: number;
    internal_name: string;
    allow_ccp_devs: boolean;
    skin_material_id: number;
    visible_serenity: boolean;
    visible_tranquility: boolean;
}

export interface SkinMaterial {
    skin_material_id: number;
    display_name_id: number;
    material_set_id: number;
}

export interface SkinLicense {
    license_id: number;
    skin_id: number;
    duration: number;
    license_type_id: number;
}

export async function getSkin(skinId: number): Promise<Skin | null> {
    return await tauriInvoke<Skin | null>("get_skin", { skinId });
}

export async function getSkinMaterial(
    skinMaterialId: number,
): Promise<SkinMaterial | null> {
    return await tauriInvoke<SkinMaterial | null>("get_skin_material", {
        skinMaterialId,
    });
}

export async function getSkinLicense(
    licenseId: number,
): Promise<SkinLicense | null> {
    return await tauriInvoke<SkinLicense | null>("get_skin_license", {
        licenseId,
    });
}

export async function getSkinMaterialIdByLicense(
    licenseId: number,
): Promise<number | null> {
    return await tauriInvoke<number | null>("get_skin_material_id_by_license", {
        licenseId,
    });
}

export async function getLicensesBySkin(
    skinId: number,
): Promise<SkinLicense[]> {
    return await tauriInvoke<SkinLicense[]>("get_licenses_by_skin", { skinId });
}

export const skinCommands = {
    getSkin,
    getSkinMaterial,
    getSkinLicense,
    getSkinMaterialIdByLicense,
    getLicensesBySkin,
} as const;
