"use client";

import {
    Archive,
    AudioWaveform,
    Command,
    Compass,
    Database,
    Factory,
    GalleryVerticalEnd,
    Home,
    Info,
    Rocket,
    Settings,
    TrendingUp,
    Users,
} from "lucide-react";
import type * as React from "react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar";
import { routes } from "@/config/routes";
import { useSPARouter } from "@/hooks/useSPARouter";
import { openExternalLink } from "@/utils/opener";
import { Button } from "../ui/button";
import { BundleSwitcher } from "./bundle-switcher";
import { NavBookmarks } from "./nav-bookmarks";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

const iconMap = {
    home: Home,
    trending: TrendingUp,
    factory: Factory,
    users: Users,
    database: Database,
    archive: Archive,
    settings: Settings,
    compass: Compass,
    info: Info,
    rocket: Rocket,
};

const transformNavItems = (items: typeof routes) => {
    const { currentPath } = useSPARouter();

    return items
        .filter((item) => !item.hideFromNav)
        .map((item) => ({
            title: item.labelKey,
            url: item.path,
            containsPage: !!item.component,
            icon: item.icon ? iconMap[item.icon as keyof typeof iconMap] : undefined,
            isActive: item.path === currentPath,
            items: item.children
                ?.filter((child) => !child.hideFromNav)
                ?.map((child) => ({
                    title: child.labelKey,
                    url: child.path,
                    isActive: child.path === currentPath,
                    items: child.children
                        ?.filter((grandChild) => !grandChild.hideFromNav)
                        ?.map((grandChild) => ({
                            title: grandChild.labelKey,
                            url: grandChild.path,
                            isActive: grandChild.path === currentPath,
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
    bookmarks: [],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const navMain = transformNavItems(routes);
    const { state } = useSidebar();

    return (
        <Sidebar collapsible="icon" {...props} className="overflow-x-hidden">
            <SidebarHeader>
                <BundleSwitcher />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navMain} />
                <NavBookmarks bookmarks={data.bookmarks} />
            </SidebarContent>
            <SidebarFooter>
                <div
                    className={`w-full flex items-center justify-center flex-col space-y-0 transition-all duration-300 ease-in-out ${
                        state === "expanded"
                            ? "opacity-100 max-h-20 transform translate-y-0"
                            : "opacity-0 max-h-0 transform -translate-y-2 overflow-hidden"
                    }`}
                >
                    <Button
                        size="sm"
                        variant="link"
                        className="flex items-center gap-2 text-current p-0 m-1 h-min"
                        onClick={() => openExternalLink("https://tauri.app")}
                    >
                        <span className="text-muted-foreground text-xs">Powered by</span>
                        <span className="text-primary text-xs">Tauri</span>
                    </Button>
                    <Button
                        size="sm"
                        variant="link"
                        className="flex items-center gap-2 text-current p-0 m-1 h-min"
                        onClick={() => openExternalLink("https://ui.shadcn.com")}
                    >
                        <span className="text-muted-foreground text-xs">Designed with</span>
                        <span className="text-primary text-xs">shadcn/ui</span>
                    </Button>
                </div>
                <NavUser user={data.user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
