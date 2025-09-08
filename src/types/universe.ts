export type UniverseObjectType = "region" | "constellation" | "system" | "planet";

export interface UniverseObject {
    type: UniverseObjectType;
    id: number;
}
