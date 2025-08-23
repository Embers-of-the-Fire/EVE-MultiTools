import { SquareArrowUpRight } from "lucide-react";
import { forwardRef } from "react";
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
