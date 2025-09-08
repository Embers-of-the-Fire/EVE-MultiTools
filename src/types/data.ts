export enum GraphicType {
    Icon = 0,
    Blueprint = 1,
    BlueprintCopy = 2,
}

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

export interface Category {
    category_id: number;
    category_name_id: number;
    icon_id?: number;
    published: boolean;
}

export interface MetaGroup {
    name_id: number;
    icon_id?: number;
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

export interface Faction {
    name_id: number;
    description_id: number;
    short_description_id?: number;
    corporation_id?: number;
    icon_id: number;
    member_races: number[];
    unique_name: boolean;
    flat_logo?: string;
    flat_logo_with_name?: string;
    solar_system_id: number;
    militia_corporation_id?: number;
    size_factor: number;
}

export type LocSearchResult = [number, number]; // [id, score]

export interface MarketGroup {
    name_id: number;
    description_id?: number;
    icon_id?: number;
    parent_group_id?: number;
    types: number[];
    groups: number[];
}

export interface Price {
    type_id: number;
    sell_min: number | null;
    buy_max: number | null;
    updated_at: number;
}

export enum LinkKey {
    MarketEveC3qCc = 0,
    MarketEveC3qCcEn = 1,
    MarketEveTycoon = 2,
}

export enum WormholeClass {
    C1 = 1,
    C2 = 2,
    C3 = 3,
    C4 = 4,
    C5 = 5,
    C6 = 6,
    HighSec = 7,
    LowSec = 8,
    NullSec = 9,
    GM1 = 10,
    GM2 = 11,
    Thera = 12,
    SmallShip = 13,
    Sentinel = 14,
    Barbican = 15,
    Vidette = 16,
    Conflux = 17,
    Redoubt = 18,
    VoidOrAbyssal1 = 19,
    Abyssal2 = 20,
    Abyssal3 = 21,
    Abyssal4 = 22,
    Abyssal5 = 23,
    Pochven = 25,
}

export enum RegionType {
    HighSec = 1,
    LowSec = 2,
    NullSec = 3,
    Wormhole = 4,
    Void = 5,
    Abyssal = 6,
    Pochven = 7,
}

export interface RegionBrief {
    region_id: number;
    name_id: number;
    region_type?: RegionType | number;
    wormhole_class_id?: WormholeClass | number;
    faction_id?: number;
}

export interface ConstellationBrief {
    constellation_id: number;
    name_id: number;
    region_id: number;
    faction_id?: number;
    wormhole_class_id?: WormholeClass | number;
}

export interface SystemBrief {
    solar_system_id: number;
    name_id: number;
    region_id: number;
    constellation_id: number;
    faction_id?: number;
    security_status: number;
    wormhole_class_id?: WormholeClass | number;
}

export interface PlanetBrief {
    planet_id: number;
    celestial_index: number;
    planet_name_id?: number;
    system_id: number;
    type_id: number;
}

export interface MoonBrief {
    moon_id: number;
    moon_name_id?: number;
    type_id: number;
    planet_id: number;
    celestial_index: number;
}
