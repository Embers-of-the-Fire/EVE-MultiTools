"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

interface LoadingState {
    id: string;
    message: string;
    progress?: number;
}

interface GlobalLoadingContextType {
    isLoading: boolean;
    loadingMessage: string;
    loadingProgress?: number;
    showLoading: (id: string, message: string, progress?: number) => void;
    hideLoading: (id: string) => void;
    updateProgress: (id: string, progress: number) => void;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType | undefined>(undefined);

export interface GlobalLoadingProviderProps {
    children: React.ReactNode;
}

export function GlobalLoadingProvider({ children }: GlobalLoadingProviderProps) {
    const [loadingStates, setLoadingStates] = useState<LoadingState[]>([]);
    const [showLoadingUI, setShowLoadingUI] = useState(false);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // 当前是否有加载状态
    const isLoading = loadingStates.length > 0;

    // 获取当前显示的加载消息（优先显示最新的）
    const currentLoadingState = loadingStates[loadingStates.length - 1];
    const loadingMessage = currentLoadingState?.message || "";
    const loadingProgress = currentLoadingState?.progress;

    // 防抖逻辑：500ms后才显示加载UI
    useEffect(() => {
        if (isLoading && !showLoadingUI) {
            // 开始加载，设置500ms延迟
            const timer = setTimeout(() => {
                setShowLoadingUI(true);
            }, 500);
            debounceTimerRef.current = timer;
        } else if (!isLoading && showLoadingUI) {
            // 停止加载，清除定时器并隐藏UI
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }
            // 添加一个小延迟确保UI平滑过渡
            setTimeout(() => {
                setShowLoadingUI(false);
            }, 100);
        }

        // 清理定时器
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [isLoading, showLoadingUI]);

    const showLoading = useCallback((id: string, message: string, progress?: number) => {
        setLoadingStates((prev) => {
            const filtered = prev.filter((state) => state.id !== id);
            return [...filtered, { id, message, progress }];
        });
    }, []);

    const hideLoading = useCallback((id: string) => {
        setLoadingStates((prev) => prev.filter((state) => state.id !== id));
    }, []);

    const updateProgress = useCallback((id: string, progress: number) => {
        setLoadingStates((prev) =>
            prev.map((state) => (state.id === id ? { ...state, progress } : state))
        );
    }, []);

    const contextValue: GlobalLoadingContextType = {
        isLoading,
        loadingMessage,
        loadingProgress,
        showLoading,
        hideLoading,
        updateProgress,
    };

    return (
        <GlobalLoadingContext.Provider value={contextValue}>
            {children}
            {/* 全局加载UI - 只在需要时显示 */}
            {showLoadingUI && isLoading && (
                <GlobalLoadingUI message={loadingMessage} progress={loadingProgress} />
            )}
        </GlobalLoadingContext.Provider>
    );
}

// 全局加载UI组件
function GlobalLoadingUI({ message, progress }: { message: string; progress?: number }) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const displayMessage = isMounted ? message : "Loading...";

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center">
            <div className="bg-background border border-border rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4 mx-auto"></div>
                    <p className="text-default-600 mb-2">{displayMessage}</p>
                    {progress !== undefined && (
                        <div className="w-full bg-default-200 rounded-full h-2 mb-2">
                            <div
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                            ></div>
                        </div>
                    )}
                    {progress !== undefined && (
                        <p className="text-xs text-default-500">{Math.round(progress)}%</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export function useGlobalLoading() {
    const context = useContext(GlobalLoadingContext);
    if (context === undefined) {
        throw new Error("useGlobalLoading must be used within a GlobalLoadingProvider");
    }
    return context;
}
