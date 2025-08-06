import { Search, X } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { EmbeddedFactionCard } from "@/components/card/FactionCard";
import { EmbeddedTypeCard } from "@/components/card/TypeCard";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";

interface SearchResult {
    id: number;
    name: string;
}

interface SearchBarProps {
    type: "faction" | "type";
    onItemSelect: (id: number) => void;
    searchFunction: (query: string, language: string) => Promise<number[]>;
    getItemName: (id: number, language: string) => Promise<string | null>;
    placeholder: string;
    noResultsMessage: string;
    resultsTitle?: string;
    language: string;
}

export function SearchBar({
    type,
    onItemSelect,
    searchFunction,
    getItemName,
    placeholder,
    noResultsMessage,
    resultsTitle,
    language,
}: SearchBarProps) {
    const { t } = useTranslation();
    const [search, setSearch] = useState("");
    const [focused, setFocused] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        let ignore = false;
        if (!search.trim()) {
            setResults([]);
            return;
        }
        setLoading(true);
        (async () => {
            try {
                const ids = await searchFunction(search, language);
                const items: SearchResult[] = [];
                for (const id of ids) {
                    const name = await getItemName(id, language);
                    if (name) {
                        items.push({ id, name });
                    }
                }
                if (!ignore) setResults(items);
            } finally {
                if (!ignore) setLoading(false);
            }
        })();
        return () => {
            ignore = true;
        };
    }, [search, language, searchFunction, getItemName]);

    const handleItemSelect = (id: number) => {
        onItemSelect(id);
        setSearch("");
        setResults([]);
        inputRef.current?.blur();
    };

    const handleClear = () => {
        setSearch("");
        inputRef.current?.blur();
    };

    return (
        <div className="w-full">
            <div
                className={cn(
                    "flex items-center w-full px-4 border-b-2 mb-4",
                    "transition-all duration-300",
                    focused ? "w-full border-black dark:border-white" : "w-48 md:w-64"
                )}
            >
                <Search />
                <Input
                    ref={inputRef}
                    className={cn(
                        "px-2 h-14 w-full font-sans text-lg outline-hidden rounded-none",
                        "bg-transparent text-default-700 placeholder-default-500",
                        "dark:text-default-500 dark:placeholder:text-default-300",
                        "border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    )}
                    placeholder={placeholder}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    autoComplete="off"
                    spellCheck={false}
                    style={{ minWidth: 0 }}
                />
                <Button
                    variant="ghost"
                    className="size-10"
                    size="icon"
                    onClick={handleClear}
                    tabIndex={-1}
                >
                    <X />
                </Button>
            </div>

            {/* Search Results */}
            {search && (
                <div className="pr-0 flex flex-col flex-1 min-h-0 w-full max-w-none">
                    {loading && <div className="p-2">{t("common.loading")}</div>}
                    {!loading && results.length > 0 && (
                        <ScrollArea className="border rounded-md bg-white dark:bg-black/30 shadow-sm p-0 my-2 flex-1 min-h-0 flex flex-col">
                            {resultsTitle && (
                                <div className="font-bold mb-2 px-4 pt-4">{resultsTitle}</div>
                            )}
                            <div className="flex flex-col min-h-0 w-full max-w-none flex-1">
                                {results.map((item, idx) => (
                                    <Fragment key={item.id}>
                                        {type === "type" ? (
                                            <EmbeddedTypeCard
                                                typeId={item.id}
                                                compact={false}
                                                noBorder
                                                onClick={handleItemSelect}
                                                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-black/30 transition-colors rounded-none px-4 py-2 w-full"
                                            />
                                        ) : (
                                            <EmbeddedFactionCard
                                                factionId={item.id}
                                                compact={false}
                                                noBorder
                                                onClick={handleItemSelect}
                                                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-black/30 transition-colors rounded-none px-4 py-2 w-full"
                                            />
                                        )}
                                        {idx !== results.length - 1 && (
                                            <div className="w-full h-px bg-gray-200 dark:bg-gray-700 mx-0" />
                                        )}
                                    </Fragment>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                    {!loading && search && results.length === 0 && (
                        <div className="text-center text-muted-foreground mt-8">
                            <p>{noResultsMessage}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
