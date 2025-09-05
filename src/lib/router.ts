import { routes } from "@/config/routes";
import type { AppRoute } from "@/types/router";

function getFlatRoutes(): AppRoute[] {
    const flatRoutes: AppRoute[] = [];

    function addRoute(route: AppRoute) {
        flatRoutes.push(route);
        if (route.children) {
            route.children.forEach(addRoute);
        }
    }

    routes.forEach(addRoute);
    return flatRoutes;
}

const flatRoutes = getFlatRoutes();

export function findRouteByPath(path: string): AppRoute | undefined {
    return flatRoutes.find((route) => route.path === path);
}

export function getRouteTitleKey(path: string): string {
    const route = findRouteByPath(path);
    return route?.labelKey || "nav.unknown";
}

export function generateBreadcrumbs(path: string): { labelKey: string; path: string }[] {
    const breadcrumbs: { labelKey: string; path: string }[] = [];
    const pathSegments = path.split("/").filter(Boolean);

    breadcrumbs.push({ labelKey: "nav.home", path: "/" });

    let currentPath = "";
    pathSegments.forEach((segment) => {
        currentPath += `/${segment}`;
        const route = findRouteByPath(currentPath);
        if (route) {
            breadcrumbs.push({ labelKey: route.labelKey, path: currentPath });
        }
    });

    return breadcrumbs;
}
