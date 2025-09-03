import { ArrowLeft } from "lucide-react";
import { useSPARouter } from "@/hooks/useSPARouter";
import { Button } from "../ui/button";
import { HistoryButton } from "./HistoryButton";

interface DetailPageActionsProps<T> {
    history: T[];
    onItemClick: (id: T) => void;
    backRoute: string;
    emptyMessageKey: string;
    detailRoute: string;
    detailTitleKey: string;
    renderItem: (id: T, onClick: () => void) => React.ReactElement;
    getKey?: (id: T) => React.Key;
}

export function DetailPageActions<T>({
    history,
    onItemClick,
    backRoute,
    emptyMessageKey,
    detailRoute,
    detailTitleKey,
    renderItem,
    getKey,
}: DetailPageActionsProps<T>) {
    const { navigate } = useSPARouter();

    const handleBackClick = () => {
        navigate(backRoute, "");
    };

    return (
        <div className="flex items-center gap-2">
            <Button size="icon" className="size-12 [&_svg]:size-5" onClick={handleBackClick}>
                <ArrowLeft size="64" />
            </Button>
            <HistoryButton
                history={history}
                onItemClick={onItemClick}
                emptyMessageKey={emptyMessageKey}
                detailRoute={detailRoute}
                detailTitleKey={detailTitleKey}
                renderItem={renderItem}
                getKey={getKey}
            />
        </div>
    );
}
