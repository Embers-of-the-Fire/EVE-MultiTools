import { ClockAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export const OutdatedNote: React.FC = () => {
    const { t } = useTranslation();

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <ClockAlert size={16} className="text-sm text-yellow-500 self-center" />
            </TooltipTrigger>
            <TooltipContent>{t("common.data_outdated")}</TooltipContent>
        </Tooltip>
    );
};
