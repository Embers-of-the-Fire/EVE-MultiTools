import { ArrowLeft, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useSPARouter } from "@/hooks/useSPARouter";

export function NavigationControls() {
    const { t } = useTranslation();
    const { canGoBack, goBack, generalHistory, navigateToHistoryItem } = useSPARouter();

    return (
        <div className="flex items-center gap-1">
            {canGoBack && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={goBack}
                    className="h-8 w-8 p-0"
                    title={t("nav.back")}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
            )}

            {generalHistory.length > 0 && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title={t("nav.history")}
                        >
                            <Clock className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-80">
                        <div className="p-2 text-sm font-medium border-b">
                            {t("nav.recent_pages")}
                        </div>
                        <ScrollArea className="max-h-96">
                            <div className="py-1">
                                {generalHistory.map((item, index) => (
                                    <div key={`${item.path}-${item.timestamp}`}>
                                        <button
                                            type="button"
                                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground rounded-sm"
                                            onClick={() =>
                                                navigateToHistoryItem(item.path, item.params)
                                            }
                                        >
                                            <div className="font-medium truncate">{item.title}</div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                {getItemDescription(item)}
                                            </div>
                                        </button>
                                        {index < generalHistory.length - 1 && (
                                            <Separator className="my-1" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}

function getItemDescription(item: any): string {
    if (!item.params) return item.path;

    switch (item.path) {
        case "/explore/type/detail":
            return `Type ID: ${item.params.typeId}`;
        case "/explore/faction/detail":
            return `Faction ID: ${item.params.factionId}`;
        case "/explore/universe/region":
        case "/explore/universe/constellation":
        case "/explore/universe/system":
        case "/explore/universe/planet":
        case "/explore/universe/moon":
        case "/explore/universe/npc-station":
            return `ID: ${item.params.id}`;
        case "/explore/npc-corporation/detail":
            return `Corp ID: ${item.params.corporationId}`;
        default:
            return item.params ? `${item.path} (with params)` : item.path;
    }
}
