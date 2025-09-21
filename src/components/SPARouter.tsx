"use client";

import { Suspense, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSPARouter } from "@/hooks/useSPARouter";
import { findRouteByPath } from "@/lib/router";

function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );
}

function NotFoundPage() {
    const { t } = useTranslation();
    const { navigate } = useSPARouter();

    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
            <h1 className="text-4xl font-bold">404</h1>
            <p className="text-muted-foreground">{t("common.page_not_found")}</p>
            <button
                type="button"
                onClick={() => navigate("/")}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
                {t("common.go_home")}
            </button>
        </div>
    );
}

export function SPARouter() {
    const { t } = useTranslation();
    const { currentPath, addGeneralHistory } = useSPARouter();
    const route = findRouteByPath(currentPath);

    // 记录路由变化到通用历史记录，但排除首页
    useEffect(() => {
        if (route && currentPath !== "/") {
            // 不记录首页
            addGeneralHistory(currentPath, t(route.labelKey) || route.labelKey || currentPath);
        }
    }, [currentPath, route, addGeneralHistory, t]);

    if (!route) {
        return <NotFoundPage />;
    }

    const Component = route.component;

    return <Suspense fallback={<LoadingSpinner />}>{Component && <Component />}</Suspense>;
}
