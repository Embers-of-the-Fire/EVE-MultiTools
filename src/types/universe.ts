export type UniverseObjectType = "region" | "constellation" | "system" | "planet" | "moon";

export interface UniverseObject {
    type: UniverseObjectType;
    id: number;
}
