"use client";

import { useCallback, useEffect, useRef } from "react";
import { useGlobalLoadingStore } from "@/stores/globalLoadingStore";

export interface UseLoadingOptions {
    id: string;
    message: string;
    autoHide?: boolean;
    delay?: number;
}

export function useLoading(options: UseLoadingOptions) {
    const { showLoading, hideLoading, updateProgress } = useGlobalLoadingStore();
    const { id, message, autoHide = true, delay = 0 } = options;
    const isLoadingRef = useRef(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 开始加载
    const startLoading = useCallback(
        (customMessage?: string, progress?: number) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            if (delay > 0) {
                timeoutRef.current = setTimeout(() => {
                    showLoading(id, customMessage || message, progress);
                    isLoadingRef.current = true;
                }, delay);
            } else {
                showLoading(id, customMessage || message, progress);
                isLoadingRef.current = true;
            }
        },
        [id, message, delay, showLoading]
    );

    // 停止加载
    const stopLoading = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        hideLoading(id);
        isLoadingRef.current = false;
    }, [id, hideLoading]);

    // 更新进度
    const setProgress = useCallback(
        (progress: number) => {
            if (isLoadingRef.current) {
                updateProgress(id, progress);
            }
        },
        [id, updateProgress]
    );

    // 包装异步函数，自动管理加载状态
    const withLoading = useCallback(
        <T>(asyncFn: () => Promise<T>, loadingMessage?: string): Promise<T> => {
            return new Promise((resolve, reject) => {
                startLoading(loadingMessage);

                asyncFn()
                    .then((result) => {
                        if (autoHide) {
                            stopLoading();
                        }
                        resolve(result);
                    })
                    .catch((error) => {
                        if (autoHide) {
                            stopLoading();
                        }
                        reject(error);
                    });
            });
        },
        [startLoading, stopLoading, autoHide]
    );

    // 组件卸载时清理
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (isLoadingRef.current) {
                hideLoading(id);
            }
        };
    }, [id, hideLoading]);

    return {
        startLoading,
        stopLoading,
        setProgress,
        withLoading,
        isLoading: isLoadingRef.current,
    };
}
