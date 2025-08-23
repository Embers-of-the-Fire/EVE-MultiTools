import { SquareArrowUpRight } from "lucide-react";
import { forwardRef } from "react";
import { useSPARouter } from "@/hooks/useSPARouter";
import { cn } from "@/lib/utils";
import { openExternalLink } from "@/utils/opener";
import { Button } from "./ui/button";

export interface ExternalLinkProps {
    link: string;
    className?: string;
    children?: React.ReactNode;
}

export const ExternalLink = forwardRef<
    HTMLButtonElement,
    ExternalLinkProps & React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ link, children, className, onClick, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        openExternalLink(link);
        onClick?.(e);
    };

    return (
        <Button
            ref={ref}
            variant="link"
            size="default"
            className={cn("px-2 cursor-pointer", className)}
            onClick={handleClick}
            {...props}
        >
            <SquareArrowUpRight /> {children}
        </Button>
    );
});

ExternalLink.displayName = "ExternalLink";

export interface InternalLinkProps {
    link: string;
    className?: string;
    children?: React.ReactNode;
    title?: string;
}

export const InternalLink = forwardRef<
    HTMLButtonElement,
    InternalLinkProps & React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ link, children, className, title, onClick, ...props }, ref) => {
    const { navigate } = useSPARouter();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        navigate(link, title ?? "");
        onClick?.(e);
    };

    return (
        <Button
            ref={ref}
            variant="link"
            size="default"
            className={cn("px-2 cursor-pointer", className)}
            onClick={handleClick}
            {...props}
        >
            <SquareArrowUpRight /> {children}
        </Button>
    );
});

InternalLink.displayName = "InternalLink";
