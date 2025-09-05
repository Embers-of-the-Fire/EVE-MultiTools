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
    | { type: "NAVIGATE_WITH_PARAMS"; path: keyof RouteParamMap; params: any }
    | { type: "GO_BACK" }
    | { type: "GO_FORWARD" }
    | { type: "REPLACE"; path: string }
    | { type: "REPLACE_WITH_PARAMS"; path: keyof RouteParamMap; params: any }
    | { type: "SET_ROUTE_PARAMS"; path: keyof RouteParamMap; params: any }
    | { type: "ADD_DETAIL_HISTORY"; item: DetailHistoryItem };

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

            return {
                ...state,
                currentPath: action.path,
                history: newHistory,
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
                dispatch({ type: "NAVIGATE_WITH_PARAMS", path, params });
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
                dispatch({ type: "REPLACE_WITH_PARAMS", path, params });
            },

            setRouteParams: <T extends keyof RouteParamMap>(path: T, params: RouteParam<T>) => {
                const { dispatch } = get();
                dispatch({ type: "SET_ROUTE_PARAMS", path, params });
            },

            getRouteParams: <T extends keyof RouteParamMap>(path: T): RouteParam<T> | undefined => {
                const { routeParams } = get();
                return routeParams[path] as RouteParam<T> | undefined;
            },

            addDetailHistory: (item: DetailHistoryItem) => {
                const { dispatch } = get();
                dispatch({ type: "ADD_DETAIL_HISTORY", item });
            },

            navigateToDetailHistoryItem: (item: DetailHistoryItem) => {
                const { navigateWithParams } = get();
                navigateWithParams(item.path, item.params);
            },
        }),
        {
            name: "spa-router-store",
        }
    )
);
