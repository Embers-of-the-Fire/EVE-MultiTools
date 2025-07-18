"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useSPARouter } from "@/contexts/SPARouterContext";

type NavItemType = {
    title: string;
    url: string;
    containsPage: boolean;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
        title: string;
        url: string;
        items?: {
            title: string;
            url: string;
        }[];
    }[];
};

type FlattenedNavItem = {
    title: string;
    url: string;
    containsPage: boolean;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
        title: string;
        url: string;
    }[];
};

export function NavMain({ items }: { items: NavItemType[] }) {
    const { t } = useTranslation();
    const { navigate } = useSPARouter();

    // 扁平化处理，将嵌套的子项展开
    const flattenItems = (items: NavItemType[]): FlattenedNavItem[] => {
        const result: FlattenedNavItem[] = [];

        items.forEach((item) => {
            if (item.items && item.items.length > 0) {
                // 如果有子项，展开子项
                const subItems: { title: string; url: string }[] = [];
                item.items.forEach((subItem) => {
                    if (subItem.items && subItem.items.length > 0) {
                        // 如果子项还有子项，将其展开到同一级
                        subItems.push(...subItem.items);
                    } else {
                        subItems.push(subItem);
                    }
                });

                result.push({
                    ...item,
                    items: subItems,
                });
            } else {
                result.push(item);
            }
        });

        return result;
    };

    const processedItems = flattenItems(items);

    return (
        <SidebarGroup>
            <SidebarGroupLabel>{t("nav.platform")}</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    {processedItems.map((item) => {
                        const hasChildren = item.items && item.items.length > 0;

                        if (hasChildren) {
                            // 有子菜单的项目 - 使用折叠组件，点击主按钮时既跳转又展开
                            return (
                                <Collapsible
                                    key={item.title}
                                    asChild
                                    defaultOpen={item.isActive}
                                    className="group/collapsible"
                                >
                                    <SidebarMenuItem>
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuButton
                                                tooltip={t(item.title)}
                                                onClick={() =>
                                                    item.containsPage && navigate(item.url)
                                                }
                                            >
                                                {item.icon && <item.icon />}
                                                <span>{t(item.title)}</span>
                                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {item.items?.map((subItem) => (
                                                    <SidebarMenuSubItem key={subItem.title}>
                                                        <SidebarMenuSubButton asChild>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    navigate(subItem.url)
                                                                }
                                                                className="w-full text-left"
                                                            >
                                                                <span>{t(subItem.title)}</span>
                                                            </button>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </SidebarMenuItem>
                                </Collapsible>
                            );
                        } else {
                            // 没有子菜单的项目 - 使用普通按钮
                            return (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton tooltip={t(item.title)} asChild>
                                        <button
                                            type="button"
                                            onClick={() => item.containsPage && navigate(item.url)}
                                            className="w-full text-left"
                                        >
                                            {item.icon && <item.icon />}
                                            <span>{t(item.title)}</span>
                                        </button>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        }
                    })}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
