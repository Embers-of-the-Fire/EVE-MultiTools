"use client";

import { useTranslation } from "react-i18next";
import {
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    Breadcrumb as BreadcrumbRoot,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { useSPARouter } from "@/hooks/useSPARouter";
import { generateBreadcrumbs } from "@/lib/router";

interface BreadcrumbProps {
    className?: string;
}

export const Breadcrumb = ({ className }: BreadcrumbProps) => {
    const { currentPath, navigate } = useSPARouter();
    const { t } = useTranslation();

    const breadcrumbItems = generateBreadcrumbs(currentPath);

    return (
        <BreadcrumbRoot className={className}>
            <BreadcrumbList>
                {breadcrumbItems.map((item, index) => {
                    const isLast = index === breadcrumbItems.length - 1;

                    return (
                        <div key={item.labelKey} className="flex items-center">
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage className="font-medium">
                                        {t(item.labelKey)}
                                    </BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <button
                                            type="button"
                                            onClick={() => navigate(item.path)}
                                            className="hover:text-foreground"
                                        >
                                            {t(item.labelKey)}
                                        </button>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {!isLast && <BreadcrumbSeparator />}
                        </div>
                    );
                })}
            </BreadcrumbList>
        </BreadcrumbRoot>
    );
};
