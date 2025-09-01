import { ArrowLeft } from "lucide-react";
import { useSPARouter } from "@/hooks/useSPARouter";
import { Button } from "../ui/button";
import { HistoryButton } from "./HistoryButton";

interface DetailPageActionsProps {
    history: number[];
    onItemClick: (id: number) => void;
    backRoute: string;
    emptyMessageKey: string;
    detailRoute: string;
    detailTitleKey: string;
    renderItem: (id: number, onClick: () => void) => React.ReactElement;
}

export function DetailPageActions({
    history,
    onItemClick,
    backRoute,
    emptyMessageKey,
    detailRoute,
    detailTitleKey,
    renderItem,
}: DetailPageActionsProps) {
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
            />
        </div>
    );
}
