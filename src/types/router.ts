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
};

export type RouterState = {
    currentPath: string;
    history: RouteHistory[];
    canGoBack: boolean;
    canGoForward: boolean;
};
