"use client";

import { AppSidebar, ThemeSwitch, LangSwitch } from "@/components/sidebar";
import { Breadcrumb } from "@/components/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SPARouter } from "@/components/SPARouter";

export function SPALayout() {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="h-screen">
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4 flex-1">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        <Breadcrumb />
                    </div>
                    <div className="flex items-center gap-2 px-4">
                        <ThemeSwitch />
                        <LangSwitch />
                    </div>
                </header>
                <main className="flex-1 h-full overflow-hidden flex flex-col">
                    <SPARouter />
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
