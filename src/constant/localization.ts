import { NpcCorporation_Extent, NpcCorporation_Size } from "@/data/schema";

export const UI_CORPORATIONS_NATIONAL_CORP = "UI/Corporations/NationalCrop";
export const UI_CORPORATIONS_GLOBAL_CORP = "UI/Corporations/GlobalCorp";
export const UI_CORPORATIONS_REGIONAL_CORP = "UI/Corporations/RegionalCorp";
export const UI_CORPORATIONS_LOCAL_CORP = "UI/Corporations/LocalCorp";
export const UI_CORPORATIONS_CONSTELLATION_CORP = "UI/Corporations/ConstellationCorp";

export const EXTENT_DICT = {
    [NpcCorporation_Extent.UNSPECIFIED$]: "",
    [NpcCorporation_Extent.EXT_N]: UI_CORPORATIONS_NATIONAL_CORP,
    [NpcCorporation_Extent.EXT_R]: UI_CORPORATIONS_REGIONAL_CORP,
    [NpcCorporation_Extent.EXT_L]: UI_CORPORATIONS_LOCAL_CORP,
    [NpcCorporation_Extent.EXT_G]: UI_CORPORATIONS_GLOBAL_CORP,
    [NpcCorporation_Extent.EXT_C]: UI_CORPORATIONS_CONSTELLATION_CORP,
} as const;

export const UI_CORPORATIONS_TINY_CORP = "UI/Corporations/TinyCorp";
export const UI_CORPORATIONS_SMALL_CORP = "UI/Corporations/SmallCorp";
export const UI_CORPORATIONS_MEDIUM_CORP = "UI/Corporations/MediumCorp";
export const UI_CORPORATIONS_LARGE_CORP = "UI/Corporations/LargeCorp";
export const UI_CORPORATIONS_HUGE_CORP = "UI/Corporations/HugeCorp";

export const SIZE_DICT = {
    [NpcCorporation_Size.UNSPECIFIED$]: "",
    [NpcCorporation_Size.SIZE_T]: UI_CORPORATIONS_TINY_CORP,
    [NpcCorporation_Size.SIZE_S]: UI_CORPORATIONS_SMALL_CORP,
    [NpcCorporation_Size.SIZE_M]: UI_CORPORATIONS_MEDIUM_CORP,
    [NpcCorporation_Size.SIZE_L]: UI_CORPORATIONS_LARGE_CORP,
    [NpcCorporation_Size.SIZE_H]: UI_CORPORATIONS_HUGE_CORP,
} as const;
