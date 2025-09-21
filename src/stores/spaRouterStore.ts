import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { getRouteTitleKey } from "@/lib/router";
import type {
    DetailHistoryItem,
    RouteHistory,
    RouteParam,
    RouteParamMap,
    RouterState,
} from "@/types/router";

type RouterAction =
    | { type: "NAVIGATE"; path: string }
    | { type: "NAVIGATE_WITH_PARAMS"; path: string; params: any }
    | { type: "GO_BACK" }
    | { type: "GO_FORWARD" }
    | { type: "REPLACE"; path: string }
    | { type: "REPLACE_WITH_PARAMS"; path: string; params: any }
    | { type: "SET_ROUTE_PARAMS"; path: string; params: any }
    | { type: "ADD_DETAIL_HISTORY"; item: DetailHistoryItem }
    | { type: "ADD_GENERAL_HISTORY"; path: string; title: string; params?: any };

interface SPARouterState extends RouterState {}

interface SPARouterActions {
    navigate: (path: string) => void;
    navigateWithParams: <T extends keyof RouteParamMap>(path: T, params: RouteParam<T>) => void;
    goBack: () => void;
    goForward: () => void;
    replace: (path: string) => void;
    replaceWithParams: <T extends keyof RouteParamMap>(path: T, params: RouteParam<T>) => void;
    setRouteParams: <T extends keyof RouteParamMap>(path: T, params: RouteParam<T>) => void;
    getRouteParams: <T extends keyof RouteParamMap>(path: T) => RouteParam<T> | undefined;
    addDetailHistory: (item: DetailHistoryItem) => void;
    addGeneralHistory: (path: string, title: string, params?: any) => void; // 添加通用历史记录方法
    navigateToDetailHistoryItem: (item: DetailHistoryItem) => void;
    dispatch: (action: RouterAction) => void;
}

type SPARouterStore = SPARouterState & SPARouterActions;

const initialState: RouterState = {
    currentPath: "/",
    history: [{ path: "/", timestamp: Date.now(), title: getRouteTitleKey("/") }],
    canGoBack: false,
    canGoForward: false,
    routeParams: {},
    detailHistory: [],
    generalHistory: [], // 初始化通用历史记录
};

function routerReducer(state: RouterState, action: RouterAction): RouterState {
    switch (action.type) {
        case "NAVIGATE": {
            const newHistory = [...state.history];
            const currentIndex = newHistory.findIndex((h) => h.path === state.currentPath);

            // 如果不是当前路径，添加到历史记录
            if (action.path !== state.currentPath) {
                const newRecord: RouteHistory = {
                    path: action.path,
                    timestamp: Date.now(),
                    title: getRouteTitleKey(action.path),
                };

                // 如果当前不在历史记录末尾，删除后面的记录
                if (currentIndex < newHistory.length - 1) {
                    newHistory.splice(currentIndex + 1);
                }

                newHistory.push(newRecord);

                // 同时添加到通用历史记录，但排除首页
                if (action.path !== "/") {
                    // 不记录首页
                    const newGeneralHistory = [
                        {
                            path: action.path,
                            title: getRouteTitleKey(action.path),
                            timestamp: Date.now(),
                        },
                        ...state.generalHistory.filter((item) => item.path !== action.path),
                    ].slice(0, 30); // 保留最近的30条记录

                    return {
                        ...state,
                        currentPath: action.path,
                        history: newHistory,
                        canGoBack: newHistory.length > 1,
                        canGoForward: false,
                        generalHistory: newGeneralHistory,
                    };
                }

                // 如果是首页或其他情况，只更新基本状态
                return {
                    ...state,
                    currentPath: action.path,
                    history: newHistory,
                    canGoBack: newHistory.length > 1,
                    canGoForward: false,
                };
            }

            return {
                ...state,
                currentPath: action.path,
                history: newHistory,
                canGoBack: newHistory.length > 1,
                canGoForward: false,
            };
        }

        case "NAVIGATE_WITH_PARAMS": {
            const newHistory = [...state.history];
            const currentIndex = newHistory.findIndex((h) => h.path === state.currentPath);

            // 如果不是当前路径，添加到历史记录
            if (action.path !== state.currentPath) {
                const newRecord: RouteHistory = {
                    path: action.path,
                    timestamp: Date.now(),
                    title: getRouteTitleKey(action.path),
                };

                // 如果当前不在历史记录末尾，删除后面的记录
                if (currentIndex < newHistory.length - 1) {
                    newHistory.splice(currentIndex + 1);
                }

                newHistory.push(newRecord);

                // 同时更新通用历史记录，除非是通过addGeneralHistory方法调用的或者是首页
                const shouldUpdateGeneralHistory = action.path !== "/"; // 不记录首页
                if (shouldUpdateGeneralHistory) {
                    const newGeneralHistory = [
                        {
                            path: action.path,
                            title: getRouteTitleKey(action.path),
                            params: action.params,
                            timestamp: Date.now(),
                        },
                        ...state.generalHistory.filter(
                            (item) =>
                                !(
                                    item.path === action.path &&
                                    JSON.stringify(item.params) === JSON.stringify(action.params)
                                )
                        ),
                    ].slice(0, 30); // 保留最近的30条记录

                    return {
                        ...state,
                        currentPath: action.path,
                        history: newHistory,
                        canGoBack: newHistory.length > 1,
                        canGoForward: false,
                        routeParams: {
                            ...state.routeParams,
                            [action.path]: action.params,
                        },
                        generalHistory: newGeneralHistory,
                    };
                }
            }

            return {
                ...state,
                currentPath: action.path,
                history: newHistory,
                canGoBack: newHistory.length > 1,
                canGoForward: false,
                routeParams: {
                    ...state.routeParams,
                    [action.path]: action.params,
                },
            };
        }

        case "GO_BACK": {
            const currentIndex = state.history.findIndex((h) => h.path === state.currentPath);
            if (currentIndex > 0) {
                const previousPath = state.history[currentIndex - 1].path;
                return {
                    ...state,
                    currentPath: previousPath,
                    canGoBack: currentIndex > 1,
                    canGoForward: true,
                };
            }
            return state;
        }

        case "GO_FORWARD": {
            const currentIndex = state.history.findIndex((h) => h.path === state.currentPath);
            if (currentIndex < state.history.length - 1) {
                const nextPath = state.history[currentIndex + 1].path;
                return {
                    ...state,
                    currentPath: nextPath,
                    canGoBack: true,
                    canGoForward: currentIndex < state.history.length - 2,
                };
            }
            return state;
        }

        case "REPLACE": {
            const newHistory = [...state.history];
            const currentIndex = newHistory.findIndex((h) => h.path === state.currentPath);

            if (currentIndex >= 0) {
                newHistory[currentIndex] = {
                    path: action.path,
                    timestamp: Date.now(),
                    title: getRouteTitleKey(action.path),
                };
            }

            // 如果是首页，不更新通用历史记录
            if (action.path === "/") {
                return {
                    ...state,
                    currentPath: action.path,
                    history: newHistory,
                };
            }

            // 更新通用历史记录
            const newGeneralHistory = [
                {
                    path: action.path,
                    title: getRouteTitleKey(action.path),
                    timestamp: Date.now(),
                },
                ...state.generalHistory.filter((item) => item.path !== action.path),
            ].slice(0, 30);

            return {
                ...state,
                currentPath: action.path,
                history: newHistory,
                generalHistory: newGeneralHistory,
            };
        }

        case "REPLACE_WITH_PARAMS": {
            const newHistory = [...state.history];
            const currentIndex = newHistory.findIndex((h) => h.path === state.currentPath);

            if (currentIndex >= 0) {
                newHistory[currentIndex] = {
                    path: action.path,
                    timestamp: Date.now(),
                    title: getRouteTitleKey(action.path),
                };
            }

            // 如果是首页，不更新通用历史记录
            if (action.path === "/") {
                return {
                    ...state,
                    currentPath: action.path,
                    history: newHistory,
                    routeParams: {
                        ...state.routeParams,
                        [action.path]: action.params,
                    },
                };
            }

            // 更新通用历史记录
            const newGeneralHistory = [
                {
                    path: action.path,
                    title: getRouteTitleKey(action.path),
                    params: action.params,
                    timestamp: Date.now(),
                },
                ...state.generalHistory.filter(
                    (item) =>
                        !(
                            item.path === action.path &&
                            JSON.stringify(item.params) === JSON.stringify(action.params)
                        )
                ),
            ].slice(0, 30);

            return {
                ...state,
                currentPath: action.path,
                history: newHistory,
                routeParams: {
                    ...state.routeParams,
                    [action.path]: action.params,
                },
                generalHistory: newGeneralHistory,
            };
        }

        case "SET_ROUTE_PARAMS": {
            return {
                ...state,
                routeParams: {
                    ...state.routeParams,
                    [action.path]: action.params,
                },
            };
        }

        case "ADD_DETAIL_HISTORY": {
            const newDetailHistory = [
                action.item,
                ...state.detailHistory.filter(
                    (item) =>
                        !(
                            item.path === action.item.path &&
                            JSON.stringify(item.params) === JSON.stringify(action.item.params)
                        )
                ),
            ].slice(0, 20); // Keep only last 20 items

            return {
                ...state,
                detailHistory: newDetailHistory,
            };
        }

        case "ADD_GENERAL_HISTORY": {
            // 不记录首页
            if (action.path === "/") {
                return state;
            }

            const newGeneralHistory = [
                {
                    path: action.path,
                    title: action.title,
                    params: action.params,
                    timestamp: Date.now(),
                },
                ...state.generalHistory.filter(
                    (item) =>
                        !(
                            item.path === action.path &&
                            JSON.stringify(item.params) === JSON.stringify(action.params)
                        )
                ),
            ].slice(0, 30); // 保留最近的30条记录

            return {
                ...state,
                generalHistory: newGeneralHistory,
            };
        }

        default:
            return state;
    }
}

export const useSPARouterStore = create<SPARouterStore>()(
    devtools(
        (set, get) => ({
            // 初始状态
            ...initialState,

            // Actions
            dispatch: (action: RouterAction) => {
                const currentState = get();
                const newState = routerReducer(currentState, action);
                set(newState);
            },

            navigate: (path: string) => {
                const { dispatch } = get();
                dispatch({ type: "NAVIGATE", path });
            },

            navigateWithParams: <T extends keyof RouteParamMap>(path: T, params: RouteParam<T>) => {
                const { dispatch } = get();
                dispatch({ type: "NAVIGATE_WITH_PARAMS", path: path as string, params });
            },

            goBack: () => {
                const { dispatch } = get();
                dispatch({ type: "GO_BACK" });
            },

            goForward: () => {
                const { dispatch } = get();
                dispatch({ type: "GO_FORWARD" });
            },

            replace: (path: string) => {
                const { dispatch } = get();
                dispatch({ type: "REPLACE", path });
            },

            replaceWithParams: <T extends keyof RouteParamMap>(path: T, params: RouteParam<T>) => {
                const { dispatch } = get();
                dispatch({ type: "REPLACE_WITH_PARAMS", path: path as string, params });
            },

            setRouteParams: <T extends keyof RouteParamMap>(path: T, params: RouteParam<T>) => {
                const { dispatch } = get();
                dispatch({ type: "SET_ROUTE_PARAMS", path: path as string, params });
            },

            getRouteParams: <T extends keyof RouteParamMap>(path: T): RouteParam<T> | undefined => {
                const { routeParams } = get();
                return routeParams[path as string] as RouteParam<T> | undefined;
            },

            addDetailHistory: (item: DetailHistoryItem) => {
                const { dispatch } = get();
                dispatch({ type: "ADD_DETAIL_HISTORY", item });
            },

            addGeneralHistory: (path: string, title: string, params?: any) => {
                const { dispatch } = get();
                dispatch({ type: "ADD_GENERAL_HISTORY", path, title, params });
            },

            navigateToDetailHistoryItem: (item: DetailHistoryItem) => {
                const { navigateWithParams } = get();
                navigateWithParams(item.path as any, item.params);
            },
        }),
        {
            name: "spa-router-store",
        }
    )
);
