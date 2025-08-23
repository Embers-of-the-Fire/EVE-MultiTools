import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function Described({
    title,
    description,
    children,
    asChild = false,
}: {
    title: React.ReactNode;
    description?: React.ReactNode;
    children: React.ReactNode;
    asChild?: boolean;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild={asChild}>{children}</TooltipTrigger>
            <TooltipContent>
                <div className="max-w-xs">
                    <h3 className="font-semibold">{title}</h3>
                    {description && (
                        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                    )}
                </div>
            </TooltipContent>
        </Tooltip>
    );
}
