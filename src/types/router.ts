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

// 扩展路由参数映射，包括通用路径
export interface RouteParamMap extends KnownRouteParamMap {
    [path: string]: Record<string, any>;
}

export type RouteParam<T extends keyof RouteParamMap> = RouteParamMap[T];

// 添加通用历史记录项接口
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
    detailHistory: DetailHistoryItem[];
    generalHistory: GeneralHistoryItem[]; // 添加通用历史记录
};
