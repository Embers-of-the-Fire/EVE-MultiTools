"use client";

import type * as React from "react";
import {
    AudioWaveform,
    Command,
    GalleryVerticalEnd,
    Factory,
    TrendingUp,
    Database,
    Users,
    Home,
    Settings,
    Archive,
    Compass,
} from "lucide-react";

import { NavMain } from "./nav-main";
import { NavBookmarks } from "./nav-bookmarks";
import { NavUser } from "./nav-user";
import { BundleSwitcher } from "./bundle-switcher";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar";
import { routes } from "@/config/routes";
import { useSPARouter } from "@/contexts/SPARouterContext";

// 图标映射
const iconMap = {
    home: Home,
    trending: TrendingUp,
    factory: Factory,
    users: Users,
    database: Database,
    archive: Archive,
    settings: Settings,
    compass: Compass,
};

// 转换routes到sidebar格式
const transformNavItems = (items: typeof routes) => {
    const { state } = useSPARouter();

    return items.map((item) => ({
        title: item.labelKey,
        url: item.path,
        icon: item.icon ? iconMap[item.icon as keyof typeof iconMap] : undefined,
        isActive: item.path === state.currentPath,
        items: item.children?.map((child) => ({
            title: child.labelKey,
            url: child.path,
            isActive: child.path === state.currentPath,
            items: child.children?.map((grandChild) => ({
                title: grandChild.labelKey,
                url: grandChild.path,
                isActive: grandChild.path === state.currentPath,
            })),
        })),
    }));
};

// Default application data
const data = {
    user: {
        name: "EVE Pilot",
        email: "pilot@eve-multitools.com",
        avatar: "/avatars/user.jpg",
    },
    teams: [
        {
            name: "EVE Corp",
            logo: GalleryVerticalEnd,
            plan: "Corporate",
        },
        {
            name: "Alliance",
            logo: AudioWaveform,
            plan: "Alliance",
        },
        {
            name: "Personal",
            logo: Command,
            plan: "Personal",
        },
    ],
    bookmarks: [
        {
            name: "Market Analysis",
            url: "/market/analysis",
            icon: TrendingUp,
        },
        {
            name: "Ship Database",
            url: "/database/ships",
            icon: Database,
        },
        {
            name: "Character Skills",
            url: "/character/skills",
            icon: Users,
        },
    ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const navMain = transformNavItems(routes);

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <BundleSwitcher />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navMain} />
                <NavBookmarks bookmarks={data.bookmarks} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={data.user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
