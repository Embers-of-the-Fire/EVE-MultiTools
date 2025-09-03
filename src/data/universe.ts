import { RegionType, WormholeClass } from "@/types/data";
import { Region_RegionType, WormholeClassID } from "./schema";

export type WormholeClassString =
    | "c1"
    | "c2"
    | "c3"
    | "c4"
    | "c5"
    | "c6"
    | "high-sec"
    | "low-sec"
    | "null-sec"
    | "gm1"
    | "gm2"
    | "thera"
    | "small-ship"
    | "sentinel"
    | "barbican"
    | "vidette"
    | "conflux"
    | "redoubt"
    | "void-or-abyssal-1"
    | "abyssal-2"
    | "abyssal-3"
    | "abyssal-4"
    | "abyssal-5"
    | "pochven";

export const wormholeClassList: WormholeClass[] = [
    WormholeClass.C1,
    WormholeClass.C2,
    WormholeClass.C3,
    WormholeClass.C4,
    WormholeClass.C5,
    WormholeClass.C6,
    WormholeClass.HighSec,
    WormholeClass.LowSec,
    WormholeClass.NullSec,
    WormholeClass.GM1,
    WormholeClass.GM2,
    WormholeClass.Thera,
    WormholeClass.SmallShip,
    WormholeClass.Sentinel,
    WormholeClass.Barbican,
    WormholeClass.Vidette,
    WormholeClass.Conflux,
    WormholeClass.Redoubt,
    WormholeClass.VoidOrAbyssal1,
    WormholeClass.Abyssal2,
    WormholeClass.Abyssal3,
    WormholeClass.Abyssal4,
    WormholeClass.Abyssal5,
    WormholeClass.Pochven,
] as const;

export function getWormholeClassString(wc: WormholeClass): WormholeClassString {
    switch (wc) {
        case WormholeClass.C1:
            return "c1";
        case WormholeClass.C2:
            return "c2";
        case WormholeClass.C3:
            return "c3";
        case WormholeClass.C4:
            return "c4";
        case WormholeClass.C5:
            return "c5";
        case WormholeClass.C6:
            return "c6";
        case WormholeClass.HighSec:
            return "high-sec";
        case WormholeClass.LowSec:
            return "low-sec";
        case WormholeClass.NullSec:
            return "null-sec";
        case WormholeClass.GM1:
            return "gm1";
        case WormholeClass.GM2:
            return "gm2";
        case WormholeClass.Thera:
            return "thera";
        case WormholeClass.SmallShip:
            return "small-ship";
        case WormholeClass.Sentinel:
            return "sentinel";
        case WormholeClass.Barbican:
            return "barbican";
        case WormholeClass.Vidette:
            return "vidette";
        case WormholeClass.Conflux:
            return "conflux";
        case WormholeClass.Redoubt:
            return "redoubt";
        case WormholeClass.VoidOrAbyssal1:
            return "void-or-abyssal-1";
        case WormholeClass.Abyssal2:
            return "abyssal-2";
        case WormholeClass.Abyssal3:
            return "abyssal-3";
        case WormholeClass.Abyssal4:
            return "abyssal-4";
        case WormholeClass.Abyssal5:
            return "abyssal-5";
        case WormholeClass.Pochven:
            return "pochven";
    }
}

export function getWormholeClassFromNative(native: WormholeClassID): WormholeClass {
    switch (native) {
        case WormholeClassID.C1:
            return WormholeClass.C1;
        case WormholeClassID.C2:
            return WormholeClass.C2;
        case WormholeClassID.C3:
            return WormholeClass.C3;
        case WormholeClassID.C4:
            return WormholeClass.C4;
        case WormholeClassID.C5:
            return WormholeClass.C5;
        case WormholeClassID.C6:
            return WormholeClass.C6;
        case WormholeClassID.HIGH_SEC_WM:
            return WormholeClass.HighSec;
        case WormholeClassID.LOW_SEC_WM:
            return WormholeClass.LowSec;
        case WormholeClassID.NULL_SEC_WM:
            return WormholeClass.NullSec;
        case WormholeClassID.GM1:
            return WormholeClass.GM1;
        case WormholeClassID.GM2:
            return WormholeClass.GM2;
        case WormholeClassID.THERA:
            return WormholeClass.Thera;
        case WormholeClassID.SMALL_SHIP:
            return WormholeClass.SmallShip;
        case WormholeClassID.SENTINEL:
            return WormholeClass.Sentinel;
        case WormholeClassID.BARBICAN:
            return WormholeClass.Barbican;
        case WormholeClassID.VIDETTE:
            return WormholeClass.Vidette;
        case WormholeClassID.CONFLUX:
            return WormholeClass.Conflux;
        case WormholeClassID.REDOUBT:
            return WormholeClass.Redoubt;
        case WormholeClassID.VOID_OR_ABYSSAL1:
            return WormholeClass.VoidOrAbyssal1;
        case WormholeClassID.ABYSSAL2:
            return WormholeClass.Abyssal2;
        case WormholeClassID.ABYSSAL3:
            return WormholeClass.Abyssal3;
        case WormholeClassID.ABYSSAL4:
            return WormholeClass.Abyssal4;
        case WormholeClassID.ABYSSAL5:
            return WormholeClass.Abyssal5;
        case WormholeClassID.POCHVEN_WM:
            return WormholeClass.Pochven;
        default:
            throw new Error(`Unknown WormholeClassID: ${native}`);
    }
}

export function getWormholeClassNameKey(wc: WormholeClass): string {
    return `terms.wormhole_classes.${getWormholeClassString(wc)}`; // e.g. terms.wormhole_classes.c1
}

export type RegionTypeString =
    | "high-sec"
    | "low-sec"
    | "null-sec"
    | "wormhole"
    | "void"
    | "abyssal"
    | "pochven";

export function getRegionTypeString(rt: RegionType): RegionTypeString {
    switch (rt) {
        case RegionType.HighSec:
            return "high-sec";
        case RegionType.LowSec:
            return "low-sec";
        case RegionType.NullSec:
            return "null-sec";
        case RegionType.Wormhole:
            return "wormhole";
        case RegionType.Void:
            return "void";
        case RegionType.Abyssal:
            return "abyssal";
        case RegionType.Pochven:
            return "pochven";
    }
}

export function getRegionTypeNameKey(rt: RegionType): string {
    return `terms.region_types.${getRegionTypeString(rt)}`; // e.g. terms.region_types.high-sec
}

export function getRegionTypeFromNative(native: Region_RegionType): RegionType {
    switch (native) {
        case Region_RegionType.HIGH_SEC:
            return RegionType.HighSec;
        case Region_RegionType.LOW_SEC:
            return RegionType.LowSec;
        case Region_RegionType.NULL_SEC:
            return RegionType.NullSec;
        case Region_RegionType.WORMHOLE:
            return RegionType.Wormhole;
        case Region_RegionType.VOID:
            return RegionType.Void;
        case Region_RegionType.ABYSSAL:
            return RegionType.Abyssal;
        case Region_RegionType.POCHVEN:
            return RegionType.Pochven;
        default:
            throw new Error(`Unknown Region_RegionType: ${native}`);
    }
}
