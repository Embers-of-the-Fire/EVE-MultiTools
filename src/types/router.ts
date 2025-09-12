export type AppRoute = {
    key: string;
    path: string;
    labelKey: string;
    component?: React.ComponentType;
    icon?: string;
    children?: AppRoute[];
    badge?: string;
    disabled?: boolean;
    hideFromNav?: boolean; // 是否在导航栏中隐藏此页面
};

export type RouteHistory = {
    path: string;
    timestamp: number;
    title: string;
    params?: any;
};

export interface DetailHistoryItem {
    id: string;
    title: string;
    path: keyof RouteParamMap;
    params: any;
    timestamp: number;
}

// Route parameter type mapping
export interface RouteParamMap {
    "/explore/type/detail": { typeId: number };
    "/explore/faction/detail": { factionId: number };
    "/explore/universe/region": { id: number };
    "/explore/universe/constellation": { id: number };
    "/explore/universe/system": { id: number };
    "/explore/universe/planet": { id: number };
    "/explore/universe/moon": { id: number };
    "/explore/universe/npc-station": { id: number };
}

export type RouteParam<T extends keyof RouteParamMap> = RouteParamMap[T];

export type RouterState = {
    currentPath: string;
    history: RouteHistory[];
    canGoBack: boolean;
    canGoForward: boolean;
    routeParams: Partial<Record<keyof RouteParamMap, any>>;
    detailHistory: DetailHistoryItem[];
};
