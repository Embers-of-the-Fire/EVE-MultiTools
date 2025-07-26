export type BreadcrumbItem = {
    labelKey: string;
    href?: string;
};

export type SiteConfig = {
    name: string;
    description: string;
    layout: {
        showSidebar: boolean;
        showBreadcrumb: boolean;
        sidebarCollapsible: boolean;
    };
    links: {
        github: string;
        docs: string;
        sponsor: string;
    };
};

export const siteConfig: SiteConfig = {
    name: "EVE MultiTools",
    description: "EVE MultiTools",
    layout: {
        showSidebar: true,
        showBreadcrumb: true,
        sidebarCollapsible: true,
    },
    links: {
        github: "https://github.com/heroui-inc/heroui",
        docs: "https://heroui.com",
        sponsor: "https://patreon.com/jrgarciadev",
    },
};

// 面包屑导航生成函数
export const generateBreadcrumb = (pathname: string): BreadcrumbItem[] => {
    const pathSegments = pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [{ labelKey: "nav.home", href: "/" }];

    // 根据路径生成面包屑
    let currentPath = "";
    pathSegments.forEach((segment, index) => {
        currentPath += `/${segment}`;
        const labelKey = `nav.${pathSegments.slice(0, index + 1).join(".")}`;
        breadcrumbs.push({
            labelKey,
            href: currentPath,
        });
    });

    return breadcrumbs;
};
