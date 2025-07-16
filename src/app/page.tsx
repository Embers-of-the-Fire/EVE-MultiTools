"use client";
import "@/locale/i18n";

import { SPARouterProvider } from "@/contexts/SPARouterContext";
import { SPALayout } from "@/components/SPALayout";

export default function Home() {
    return (
        <SPARouterProvider>
            <SPALayout />
        </SPARouterProvider>
    );
}
