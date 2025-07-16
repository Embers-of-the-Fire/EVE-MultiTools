"use client";

import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from "react";
import type { RouteHistory, RouterState } from "@/types/router";

type RouterAction = 
    | { type: "NAVIGATE"; path: string; title: string }
    | { type: "GO_BACK" }
    | { type: "GO_FORWARD" }
    | { type: "REPLACE"; path: string; title: string };

const initialState: RouterState = {
    currentPath: "/",
    history: [{ path: "/", timestamp: Date.now(), title: "Home" }],
    canGoBack: false,
    canGoForward: false,
};

function routerReducer(state: RouterState, action: RouterAction): RouterState {
    switch (action.type) {
        case "NAVIGATE": {
            const newHistory = [...state.history];
            const currentIndex = newHistory.findIndex(h => h.path === state.currentPath);
            
            // 如果不是当前路径，添加到历史记录
            if (action.path !== state.currentPath) {
                const newRecord: RouteHistory = {
                    path: action.path,
                    timestamp: Date.now(),
                    title: action.title,
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
        
        case "GO_BACK": {
            const currentIndex = state.history.findIndex(h => h.path === state.currentPath);
            const prevIndex = currentIndex - 1;
            
            if (prevIndex >= 0) {
                return {
                    ...state,
                    currentPath: state.history[prevIndex].path,
                    canGoBack: prevIndex > 0,
                    canGoForward: true,
                };
            }
            return state;
        }
        
        case "GO_FORWARD": {
            const currentIndex = state.history.findIndex(h => h.path === state.currentPath);
            const nextIndex = currentIndex + 1;
            
            if (nextIndex < state.history.length) {
                return {
                    ...state,
                    currentPath: state.history[nextIndex].path,
                    canGoBack: true,
                    canGoForward: nextIndex < state.history.length - 1,
                };
            }
            return state;
        }
        
        case "REPLACE": {
            const newHistory = [...state.history];
            const currentIndex = newHistory.findIndex(h => h.path === state.currentPath);
            
            if (currentIndex >= 0) {
                newHistory[currentIndex] = {
                    path: action.path,
                    timestamp: Date.now(),
                    title: action.title,
                };
            }
            
            return {
                ...state,
                currentPath: action.path,
                history: newHistory,
            };
        }
        
        default:
            return state;
    }
}

const RouterContext = createContext<{
    state: RouterState;
    navigate: (path: string, title?: string) => void;
    goBack: () => void;
    goForward: () => void;
    replace: (path: string, title?: string) => void;
} | null>(null);

export function SPARouterProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(routerReducer, initialState);
    
    const navigate = useCallback((path: string, title: string = "") => {
        dispatch({ type: "NAVIGATE", path, title });
    }, []);
    
    const goBack = useCallback(() => {
        dispatch({ type: "GO_BACK" });
    }, []);
    
    const goForward = useCallback(() => {
        dispatch({ type: "GO_FORWARD" });
    }, []);
    
    const replace = useCallback((path: string, title: string = "") => {
        dispatch({ type: "REPLACE", path, title });
    }, []);
    
    // 键盘快捷键支持
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && e.key === "ArrowLeft" && state.canGoBack) {
                e.preventDefault();
                goBack();
            }
            
            if (e.altKey && e.key === "ArrowRight" && state.canGoForward) {
                e.preventDefault();
                goForward();
            }
            
            if (e.key === "F5") {
                e.preventDefault();
                // 刷新当前页面
                replace(state.currentPath);
            }
        };
        
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [state.canGoBack, state.canGoForward, state.currentPath, goBack, goForward, replace]);
    
    return (
        <RouterContext.Provider value={{
            state,
            navigate,
            goBack,
            goForward,
            replace,
        }}>
            {children}
        </RouterContext.Provider>
    );
}

export function useSPARouter() {
    const context = useContext(RouterContext);
    if (!context) {
        throw new Error("useSPARouter must be used within SPARouterProvider");
    }
    return context;
}
