import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export const AttributePanel = ({ ...props }: React.ComponentProps<typeof Card>) => {
    return <Card {...props} />;
};

export const AttributeTitle = ({ ...props }: React.ComponentProps<typeof CardTitle>) => {
    return (
        <CardHeader>
            <CardTitle {...props} />
        </CardHeader>
    );
};

export const AttributeContent = ({
    className,
    ...props
}: React.ComponentProps<typeof CardContent>) => {
    return (
        <CardContent
            className={cn("grid grid-cols-2 md:grid-cols-3 gap-6", className)}
            {...props}
        />
    );
};

export const Attribute = ({ ...props }: React.ComponentProps<"div">) => {
    return <div {...props} />;
};

export const AttributeName = ({ className, children, ...props }: React.ComponentProps<"div">) => {
    return (
        <div className={cn("font-medium text text-muted-foreground", className)} {...props}>
            {children}
        </div>
    );
};

export const AttributeText = ({ className, children, ...props }: React.ComponentProps<"div">) => {
    return (
        <div className={cn("text", className)} {...props}>
            {children}
        </div>
    );
};
