import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { History } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { EmbeddedTypeCard } from "@/components/card/TypeCard";
import { useSPARouter } from "@/hooks/useSPARouter";
import { Button } from "../ui/button";
import { ScrollBar } from "../ui/scroll-area";
import { Separator } from "../ui/separator";

interface HistoryButtonProps {
    type: "faction" | "type";
    history: number[];
    onItemClick: (id: number) => void;
    emptyMessageKey: string;
    detailRoute: string;
    detailTitleKey: string;
}

export function HistoryButton({
    type,
    history,
    onItemClick,
    emptyMessageKey,
    detailRoute,
    detailTitleKey,
}: HistoryButtonProps) {
    const { t } = useTranslation();
    const { navigate } = useSPARouter();
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [open]);

    const handleItemClick = (id: number) => {
        onItemClick(id);
        navigate(detailRoute, t(detailTitleKey));
        setOpen(false);
    };

    return (
        <div className="relative inline-block" ref={dropdownRef}>
            <Button
                variant="default"
                size="icon"
                className="size-12 [&_svg]:size-5"
                onClick={() => setOpen(!open)}
            >
                <History size="64" />
            </Button>
            <div
                className={`absolute right-0 mt-2 rounded-md max-h-72 min-w-[180px] z-50 bg-white dark:bg-black/80 border border-gray-200 dark:border-gray-700
                    transition-all duration-200 ease-in-out
                    ${open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}`}
                style={{
                    transitionProperty: "opacity, transform",
                }}
            >
                <ScrollAreaPrimitive.Root className="relative overflow-hidden rounded-sm max-h-72 min-w-[240px] border-1 shadow-none">
                    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-none max-h-72">
                        <div className="my-1">
                            {history.length === 0 ? (
                                <div className="p-3 text-muted-foreground text-sm">
                                    {t(emptyMessageKey)}
                                </div>
                            ) : (
                                history.map((id, idx) => (
                                    <Fragment key={id}>
                                        {type === "faction" ? (
                                            <Button
                                                variant="ghost"
                                                className="w-full px-2 py-1 bg-transparent hover:bg-gray-100 dark:hover:bg-black/30 transition-colors rounded-none justify-start text-left"
                                                onClick={() => handleItemClick(id)}
                                            >
                                                <div className="text-sm font-medium">
                                                    {t("explore.faction.history.item", {
                                                        factionId: id,
                                                    })}
                                                </div>
                                            </Button>
                                        ) : (
                                            <EmbeddedTypeCard
                                                compact={true}
                                                showBadges={false}
                                                typeId={id}
                                                className="w-full px-2 py-1 bg-transparent hover:bg-gray-100 dark:hover:bg-black/30 transition-colors rounded-none"
                                                noBorder
                                                onClick={() => handleItemClick(id)}
                                            />
                                        )}
                                        {idx !== history.length - 1 && (
                                            <Separator className="w-full mx-0" />
                                        )}
                                    </Fragment>
                                ))
                            )}
                        </div>
                    </ScrollAreaPrimitive.Viewport>
                    <ScrollBar />
                    <ScrollAreaPrimitive.Corner />
                </ScrollAreaPrimitive.Root>
            </div>
        </div>
    );
}
