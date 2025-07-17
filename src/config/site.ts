export type NavItem = {
    labelKey: string;
    href?: string;
    icon?: string;
    children?: NavItem[];
    badge?: string;
    disabled?: boolean;
};

export type BreadcrumbItem = {
    labelKey: string;
    href?: string;
};

export type WorkspaceItem = {
    key: string;
    label: string;
    description: string;
    icon?: string;
};

export type SiteConfig = {
    name: string;
    description: string;
    navItems: NavItem[];
    workspaces: WorkspaceItem[];
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
    navItems: [
        {
            labelKey: "nav.home",
            href: "/",
            icon: "home",
        },
        {
            labelKey: "nav.market",
            icon: "trending",
            children: [
                {
                    labelKey: "nav.market.analysis",
                    href: "/market/analysis",
                },
                {
                    labelKey: "nav.market.orders",
                    href: "/market/orders",
                },
                {
                    labelKey: "nav.market.history",
                    href: "/market/history",
                },
                {
                    labelKey: "nav.market.tools",
                    children: [
                        {
                            labelKey: "nav.market.tools.calculator",
                            href: "/market/tools/calculator",
                        },
                        {
                            labelKey: "nav.market.tools.predictor",
                            href: "/market/tools/predictor",
                        },
                    ],
                },
            ],
        },
        {
            labelKey: "nav.industry",
            icon: "factory",
            children: [
                {
                    labelKey: "nav.industry.manufacturing",
                    href: "/industry/manufacturing",
                },
                {
                    labelKey: "nav.industry.mining",
                    href: "/industry/mining",
                },
                {
                    labelKey: "nav.industry.research",
                    href: "/industry/research",
                },
            ],
        },
        {
            labelKey: "nav.character",
            icon: "users",
            children: [
                {
                    labelKey: "nav.character.skills",
                    href: "/character/skills",
                },
                {
                    labelKey: "nav.character.assets",
                    href: "/character/assets",
                },
                {
                    labelKey: "nav.character.wallet",
                    href: "/character/wallet",
                },
            ],
        },
        {
            labelKey: "nav.database",
            href: "/database",
            icon: "database",
        },
        {
            labelKey: "nav.explore",
            href: "/explore",
            icon: "compass",
        },
        {
            labelKey: "nav.bundle",
            href: "/bundle",
            icon: "archive",
        },
        {
            labelKey: "nav.settings",
            href: "/settings",
            icon: "settings",
        },
    ],
    workspaces: [
        {
            key: "eve-corp",
            label: "EVE Corp",
            description: "Main corporate workspace",
            icon: "solar:users-group-two-rounded-outline",
        },
        {
            key: "personal",
            label: "Personal",
            description: "Personal workspace",
            icon: "solar:user-bold",
        },
        {
            key: "alliance",
            label: "Alliance",
            description: "Alliance workspace",
            icon: "solar:users-group-two-rounded-outline",
        },
        {
            key: "trading",
            label: "Trading Hub",
            description: "Trading operations",
            icon: "solar:chart-square-linear",
        },
    ],
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
