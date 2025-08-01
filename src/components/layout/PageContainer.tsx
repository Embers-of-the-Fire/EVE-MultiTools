import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
    children: ReactNode;
    className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
    return (
        <div className={cn("container mx-auto p-6 space-y-6 h-full overflow-auto", className)}>
            <div className="mb-4">
                <div className="h-full flex flex-col">{children}</div>
            </div>
        </div>
    );
}
