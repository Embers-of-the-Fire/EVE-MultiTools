import { ArrowLeft } from "lucide-react";
import { useSPARouter } from "@/hooks/useSPARouter";
import { Button } from "../ui/button";
import { HistoryButton } from "./HistoryButton";

interface DetailPageActionsProps {
    type: "faction" | "type";
    history: number[];
    onItemClick: (id: number) => void;
    backRoute: string;
    emptyMessageKey: string;
    detailRoute: string;
    detailTitleKey: string;
}

export function DetailPageActions({
    type,
    history,
    onItemClick,
    backRoute,
    emptyMessageKey,
    detailRoute,
    detailTitleKey,
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
                type={type}
                history={history}
                onItemClick={onItemClick}
                emptyMessageKey={emptyMessageKey}
                detailRoute={detailRoute}
                detailTitleKey={detailTitleKey}
            />
        </div>
    );
}
