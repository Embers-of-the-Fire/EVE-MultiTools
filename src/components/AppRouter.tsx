"use client";

import { useEffect } from "react";

/**
 * 桌面应用增强组件
 * 为 Tauri 桌面应用提供更好的体验
 */
export function AppRouter() {
    useEffect(() => {
        // 阻止默认的浏览器行为
        const handleKeyDown = (e: KeyboardEvent) => {
            // 阻止 F5 刷新
            if (e.key === "F5") {
                e.preventDefault();
                // 可以在这里添加应用刷新逻辑
            }
        };

        // 处理窗口关闭
        const handleBeforeUnload = (_e: BeforeUnloadEvent) => {
            // todo: 实现窗口关闭逻辑
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, []);

    return null;
}
