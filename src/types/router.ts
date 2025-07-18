/**
 * 应用路由类型定义
 */
export type AppRoute = {
    key: string;
    path: string;
    labelKey: string;
    component?: React.ComponentType;
    icon?: string;
    children?: AppRoute[];
    badge?: string;
    disabled?: boolean;
};

/**
 * 路由历史记录
 */
export type RouteHistory = {
    path: string;
    timestamp: number;
    title: string;
};

/**
 * 路由状态
 */
export type RouterState = {
    currentPath: string;
    history: RouteHistory[];
    canGoBack: boolean;
    canGoForward: boolean;
};
