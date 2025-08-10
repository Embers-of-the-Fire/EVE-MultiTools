import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ShortcutCardProps {
    title: string;
    description: string;
    icon: ReactNode;
    onClick: () => void;
}

export function ShortcutCard({ title, description, icon, onClick }: ShortcutCardProps) {
    return (
        <Card
            className={cn(
                "cursor-pointer backdrop-blur-lg transition-shadow duration-200",
                "shadow-lg hover:shadow-2xl",
                "dark:hover:shadow-[0_8px_32px_0_rgba(255,255,255,0.18)]"
            )}
            onClick={onClick}
        >
            <CardHeader className="flex flex-row items-center gap-4 p-6 pb-2">
                <span className="h-12 w-12 flex items-center justify-center text-2xl">{icon}</span>
                <div>
                    <CardTitle className="text-lg font-bold tracking-wider drop-shadow-sm">
                        {title}
                    </CardTitle>
                </div>
            </CardHeader>
            <div className="border-t border-[#2e3a4d] mx-6 my-2" />
            <CardContent className={`p-6 pt-2 text-sm`}>{description}</CardContent>
        </Card>
    );
}
