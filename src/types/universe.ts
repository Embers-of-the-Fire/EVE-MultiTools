export type UniverseObjectType =
    | "region"
    | "constellation"
    | "system"
    | "planet"
    | "moon"
    | "npc-station";

export interface UniverseObject {
    type: UniverseObjectType;
    id: number;
}
