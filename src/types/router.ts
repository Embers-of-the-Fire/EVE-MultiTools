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

export type NoParamRoute = keyof {
    [K in keyof RouteParamMap as RouteParamMap[K] extends undefined ? K : never]: K;
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
