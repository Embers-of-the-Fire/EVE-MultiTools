import type z from "zod";
import type { routes } from "@/config/routes";

export type AppRoute = {
    key: string;
    path: string;
    labelKey: string;
    component?: React.ComponentType;
    icon?: string;
    children?: AppRoute[];
    badge?: string;
    disabled?: boolean;
    hideFromNav?: boolean;
    paramType?: any;
};

export type RouteHistory = {
    path: string;
    timestamp: number;
    title: string;
    params?: any;
};

// Route parameter type mapping
// 定义特定路由的参数类型
export interface KnownRouteParamMap {
    "/explore/type/detail": { typeId: number };
    "/explore/faction/detail": { factionId: number };
    "/explore/npc-corporation/detail": { corporationId: number };
    "/explore/universe/region": { id: number };
    "/explore/universe/constellation": { id: number };
    "/explore/universe/system": { id: number };
    "/explore/universe/planet": { id: number };
    "/explore/universe/moon": { id: number };
    "/explore/universe/npc-station": { id: number };
}

export type RouteParam<T extends keyof RouteParamMap> = RouteParamMap[T];

type ExtractRouteParams<T> = T extends readonly any[]
    ? { [K in keyof T]: ExtractRouteParams<T[K]> }[number]
    : T extends { path: infer N; paramType?: infer P; children?: infer C }
      ?
            | {
                  key: N extends string ? N : never;
                  param: P extends z.ZodTypeAny ? z.infer<P> : undefined;
              }
            | (C extends readonly any[] ? ExtractRouteParams<C> : never)
      : never;

type RouteParamPairs = ExtractRouteParams<typeof routes>;

export type RouteParamMap = {
    [K in RouteParamPairs as K["key"]]: K["param"];
};

export interface GeneralHistoryItem {
    path: string;
    title: string;
    params?: any;
    timestamp: number;
}

export type RouterState = {
    currentPath: string;
    history: RouteHistory[];
    canGoBack: boolean;
    canGoForward: boolean;
    routeParams: Partial<Record<string, any>>;
    generalHistory: GeneralHistoryItem[];
};
