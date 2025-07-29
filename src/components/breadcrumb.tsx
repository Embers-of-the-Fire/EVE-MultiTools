"use client";

import { useTranslation } from "react-i18next";
import {
    Breadcrumb as BreadcrumbRoot,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { generateBreadcrumbs } from "@/config/routes";
import { useSPARouter } from "@/hooks/useSPARouter";

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
                                            onClick={() => navigate(item.path, t(item.labelKey))}
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
