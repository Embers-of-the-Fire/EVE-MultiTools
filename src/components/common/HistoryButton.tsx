import { History } from "lucide-react";
import type React from "react";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { useSPARouter } from "@/hooks/useSPARouter";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";

interface HistoryButtonProps<T> {
    history: T[];
    onItemClick: (id: T) => void;
    emptyMessageKey: string;
    detailRoute: string;
    detailTitleKey: string;
    renderItem: (id: T, onClick: () => void) => React.ReactElement;
    getKey?: (id: T) => React.Key;
}

export function HistoryButton<T>({
    history,
    onItemClick,
    emptyMessageKey,
    detailRoute,
    detailTitleKey,
    renderItem,
    getKey = (id: T) => id as unknown as React.Key,
}: HistoryButtonProps<T>) {
    const { t } = useTranslation();
    const { navigate } = useSPARouter();

    const handleItemClick = (id: T) => {
        onItemClick(id);
        navigate(detailRoute, t(detailTitleKey));
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="default" size="icon" className="size-12 [&_svg]:size-5">
                    <History size="64" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="overflow-visible">
                <ScrollArea className="min-w-[240px]">
                    <div className="my-1 max-h-72">
                        {history.length === 0 ? (
                            <div className="p-3 text-muted-foreground text-sm">
                                {t(emptyMessageKey)}
                            </div>
                        ) : (
                            history.map((id, idx) => (
                                <Fragment key={getKey(id)}>
                                    {renderItem(id, () => handleItemClick(id))}
                                    {idx !== history.length - 1 && (
                                        <Separator className="w-full mx-0" />
                                    )}
                                </Fragment>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
