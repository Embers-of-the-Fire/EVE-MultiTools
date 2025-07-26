"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { bundleCommands, type BundleMetadata } from "@/native/bundle";

interface BundleContextType {
    // 状态
    bundles: BundleMetadata[];
    activeBundle: BundleMetadata | null;
    switchingToBundleId: string | null;
    failedBundleIds: Set<string>; // 新增：跟踪启用失败的bundle ID
    isLoading: boolean;
    error: string | null;

    // 方法
    loadBundles: (shouldAutoEnable?: boolean) => Promise<void>;
    switchBundle: (bundle: BundleMetadata) => Promise<void>;
    refreshBundles: () => Promise<void>;
    clearError: () => void;
}

const BundleContext = createContext<BundleContextType | undefined>(undefined);

export interface BundleProviderProps {
    children: React.ReactNode;
}

export function BundleProvider({ children }: BundleProviderProps) {
    const [bundles, setBundles] = useState<BundleMetadata[]>([]);
    const [activeBundle, setActiveBundle] = useState<BundleMetadata | null>(null);
    const [switchingToBundleId, setSwitchingToBundleId] = useState<string | null>(null);
    const [failedBundleIds, setFailedBundleIds] = useState<Set<string>>(new Set()); // 新增：跟踪启用失败的bundle ID
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 使用ref来存储事件监听器的清理函数
    const unlistenersRef = useRef<(() => void)[]>([]);
    const switchingToBundleIdRef = useRef<string | null>(null);

    // 同步 switchingToBundleId 到 ref
    useEffect(() => {
        switchingToBundleIdRef.current = switchingToBundleId;
    }, [switchingToBundleId]);

    // 加载所有bundle和当前启用的bundle
    const loadBundles = useCallback(async (shouldAutoEnable = false) => {
        try {
            setIsLoading(true);
            setError(null);

            // 获取所有bundle
            const allBundles = await bundleCommands.getBundles();
            setBundles(allBundles);

            // 获取当前启用的bundle ID
            const enabledBundleId = await bundleCommands.getEnabledBundleId();
            const active = allBundles.find((b) => b.serverID === enabledBundleId);
            setActiveBundle(active || null);

            // 如果需要，自动启用第一个
            if (shouldAutoEnable && !active && allBundles.length > 0) {
                const firstBundle = allBundles[0];
                // 触发切换，但不在此处等待
                bundleCommands.enableBundle(firstBundle.serverID);
            } else if (!active && allBundles.length === 0) {
                setActiveBundle(null);
            }
        } catch (err) {
            console.error("Failed to load bundles:", err);
            setError("Failed to load bundles");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 刷新bundles（不自动启用）
    const refreshBundles = useCallback(() => {
        return loadBundles(false);
    }, [loadBundles]);

    // 仅触发切换命令
    const switchBundle = useCallback(
        async (bundle: BundleMetadata) => {
            if (switchingToBundleId) return; // 防止重复点击
            try {
                setError(null);
                // 先移除失败状态（如果之前失败过）
                setFailedBundleIds((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(bundle.serverID);
                    return newSet;
                });
                await bundleCommands.enableBundle(bundle.serverID);
            } catch (err) {
                console.error("Failed to initiate bundle switch:", err);
                setError("Failed to switch bundle");
                // 标记为失败
                setFailedBundleIds((prev) => {
                    const newSet = new Set(prev);
                    newSet.add(bundle.serverID);
                    return newSet;
                });
                // 确保切换状态清除
                setSwitchingToBundleId(null);
            }
        },
        [switchingToBundleId]
    );

    // 清除错误
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // 设置事件监听器
    useEffect(() => {
        const setupListeners = async () => {
            try {
                // 清理之前的监听器
                unlistenersRef.current.forEach((unlisten) => unlisten());
                unlistenersRef.current = [];

                // Bundle切换开始事件
                const bundleChangeStartUnlisten = await listen<{ serverId: string }>(
                    "bundle-change-start",
                    (event) => {
                        setSwitchingToBundleId(event.payload.serverId);
                    }
                );
                unlistenersRef.current.push(bundleChangeStartUnlisten);

                // Bundle切换完成事件
                const bundleChangeFinishedUnlisten = await listen("bundle-change-finished", () => {
                    const currentSwitchingId = switchingToBundleIdRef.current;
                    setSwitchingToBundleId(null);
                    // 成功切换时，移除失败状态
                    if (currentSwitchingId) {
                        setFailedBundleIds((prev) => {
                            const newSet = new Set(prev);
                            newSet.delete(currentSwitchingId);
                            return newSet;
                        });
                    }
                    loadBundles(false); // 切换完成后加载，不自动启用
                });
                unlistenersRef.current.push(bundleChangeFinishedUnlisten);

                // Bundle列表变化事件
                const bundlesChangedUnlisten = await listen("bundles-changed", () => {
                    loadBundles(false); // 列表变化后加载，不自动启用
                });
                unlistenersRef.current.push(bundlesChangedUnlisten);
            } catch (e) {
                console.error("Failed to set up bundle listeners", e);
            }
        };

        setupListeners();
        loadBundles(true); // 初始加载，允许自动启用

        return () => {
            unlistenersRef.current.forEach((unlisten) => unlisten());
        };
    }, [loadBundles]);

    const contextValue: BundleContextType = {
        bundles,
        activeBundle,
        switchingToBundleId,
        failedBundleIds,
        isLoading,
        error,
        loadBundles,
        switchBundle,
        refreshBundles,
        clearError,
    };

    return <BundleContext.Provider value={contextValue}>{children}</BundleContext.Provider>;
}

export function useBundle(): BundleContextType {
    const context = useContext(BundleContext);
    if (context === undefined) {
        throw new Error("useBundle must be used within a BundleProvider");
    }
    return context;
}
