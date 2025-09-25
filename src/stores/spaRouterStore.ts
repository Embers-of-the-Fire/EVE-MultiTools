import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { getRouteTitleKey } from "@/lib/router";
import type {
    NoParamRoute,
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
    | { type: "ADD_HISTORY_ITEM"; path: string; title: string; id?: string; params?: any };

interface SPARouterState extends RouterState {}

interface SPARouterActions {
    navigate: <T extends NoParamRoute>(path: T) => void;
    navigateWithParams: <T extends keyof RouteParamMap>(path: T, params: RouteParam<T>) => void;
    goBack: () => void;
    goForward: () => void;
    replace: (path: string) => void;
    replaceWithParams: <T extends keyof RouteParamMap>(path: T, params: RouteParam<T>) => void;
    setRouteParams: <T extends keyof RouteParamMap>(path: T, params: RouteParam<T>) => void;
    getRouteParams: <T extends keyof RouteParamMap>(path: T) => RouteParam<T> | undefined;
    navigateToHistoryItem: (path: string, params?: any) => void;
    dispatch: (action: RouterAction) => void;
}

type SPARouterStore = SPARouterState & SPARouterActions;

const initialState: RouterState = {
    currentPath: "/",
    history: [{ path: "/", timestamp: Date.now(), title: getRouteTitleKey("/") }],
    canGoBack: false,
    canGoForward: false,
    routeParams: {},
    generalHistory: [],
};

function routerReducer(state: RouterState, action: RouterAction): RouterState {
    switch (action.type) {
        case "NAVIGATE": {
            const newHistory = [...state.history];
            const currentIndex = newHistory.findIndex((h) => h.path === state.currentPath);

            if (action.path !== state.currentPath) {
                const newRecord: RouteHistory = {
                    path: action.path,
                    timestamp: Date.now(),
                    title: getRouteTitleKey(action.path),
                };

                if (currentIndex < newHistory.length - 1) {
                    newHistory.splice(currentIndex + 1);
                }

                newHistory.push(newRecord);

                if (action.path !== "/") {
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
                        canGoBack: newHistory.length > 1,
                        canGoForward: false,
                        generalHistory: newGeneralHistory,
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

            if (action.path !== state.currentPath) {
                const newRecord: RouteHistory = {
                    path: action.path,
                    timestamp: Date.now(),
                    title: getRouteTitleKey(action.path),
                };

                if (currentIndex < newHistory.length - 1) {
                    newHistory.splice(currentIndex + 1);
                }

                newHistory.push(newRecord);

                const shouldUpdateGeneralHistory = action.path !== "/";
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
                    ].slice(0, 30);

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

            if (action.path === "/") {
                return {
                    ...state,
                    currentPath: action.path,
                    history: newHistory,
                };
            }

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

        case "ADD_HISTORY_ITEM": {
            if (action.path === "/") {
                return state;
            }

            const newGeneralHistory = [
                {
                    path: action.path,
                    title: action.title,
                    id: action.id || `${action.path}-${Date.now()}`,
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

            navigateToHistoryItem: <K extends keyof RouteParamMap>(
                path: K,
                params: RouteParamMap[K]
            ) => {
                const { navigateWithParams } = get();
                navigateWithParams(path, params);
            },
        }),
        {
            name: "spa-router-store",
        }
    )
);
