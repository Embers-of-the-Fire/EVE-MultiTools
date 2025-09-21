import { ArrowLeft, Clock, History } from "lucide-react";
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
    const {
        canGoBack,
        goBack,
        detailHistory,
        generalHistory,
        navigateToDetailHistoryItem,
        navigate,
        navigateWithParams,
    } = useSPARouter();

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

            {detailHistory.length > 0 && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title={t("nav.detail_history")}
                        >
                            <History className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-80">
                        <div className="p-2 text-sm font-medium border-b">
                            {t("nav.recent_details")}
                        </div>
                        <ScrollArea className="max-h-96">
                            <div className="py-1">
                                {detailHistory.map((item, index) => (
                                    <div key={item.id}>
                                        <button
                                            type="button"
                                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground rounded-sm"
                                            onClick={() => navigateToDetailHistoryItem(item)}
                                        >
                                            <div className="font-medium truncate">{item.title}</div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                {getDetailDescription(item)}
                                            </div>
                                        </button>
                                        {index < detailHistory.length - 1 && (
                                            <Separator className="my-1" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}

            {generalHistory.length > 0 && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title={t("nav.general_history")}
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
                                            onClick={() => {
                                                if (item.params) {
                                                    navigateWithParams(
                                                        item.path as any,
                                                        item.params
                                                    );
                                                } else {
                                                    navigate(item.path);
                                                }
                                            }}
                                        >
                                            <div className="font-medium truncate">{item.title}</div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                {item.path}
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

function getDetailDescription(item: any): string {
    switch (item.path) {
        case "/explore/type/detail":
            return `Type ID: ${item.params.typeId}`;
        case "/explore/faction/detail":
            return `Faction ID: ${item.params.factionId}`;
        case "/explore/universe/detail":
            return `${item.params.type}: ${item.params.id}`;
        default:
            return item.path;
    }
}
