import { openUrl } from "@tauri-apps/plugin-opener";
import { SquareArrowUpRight } from "lucide-react";
import { Button } from "./ui/button";

export interface ExternalLinkProps {
    link: string;
    text: string;
    className?: string;
}

export const ExternalLink: React.FC<ExternalLinkProps> = ({ link, text, className }) => {
    return (
        <Button variant="link" size="default" className={className} onClick={() => openUrl(link)}>
            <SquareArrowUpRight />
            {text}
        </Button>
    );
};
