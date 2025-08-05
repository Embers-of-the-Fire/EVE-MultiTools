import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PageContainer } from "./PageContainer";

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: ReactNode;
    className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
    return (
        <div className={cn("flex items-center justify-between mb-4", className)}>
            <div>
                <h1 className="text-3xl font-bold">{title}</h1>
                {description && <p className="text-muted-foreground mt-2">{description}</p>}
            </div>
            {actions && <div>{actions}</div>}
        </div>
    );
}

interface PageLayoutProps {
    title: string;
    description?: string;
    actions?: ReactNode;
    children: ReactNode;
    className?: string;
}

export function PageLayout({ title, description, actions, children, className }: PageLayoutProps) {
    return (
        <PageContainer className={className}>
            <PageHeader title={title} description={description} actions={actions} />
            {children}
        </PageContainer>
    );
}
