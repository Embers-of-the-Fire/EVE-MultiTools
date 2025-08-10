import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export interface SearchResult {
    id: number;
    name: string;
}

interface SearchBarProps {
    onItemSelect?: (id: number) => void;
    searchFunction: (query: string, language: string) => Promise<number[]>;
    getItemName: (id: number, language: string) => Promise<string | null>;
    placeholder: string;
    noResultsMessage?: string;
    language: string;
    children?: (ctx: {
        results: SearchResult[];
        loading: boolean;
        query: string;
        onSelect: (id: number) => void;
        onClear: () => void;
        noResultsMessage?: string;
    }) => React.ReactNode;
}

export function SearchBar({
    onItemSelect,
    searchFunction,
    getItemName,
    placeholder,
    noResultsMessage,
    language,
    children,
}: SearchBarProps) {
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
        onItemSelect?.(id);
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

            {search &&
                children?.({
                    results,
                    loading,
                    query: search,
                    onSelect: handleItemSelect,
                    onClear: handleClear,
                    noResultsMessage,
                })}
        </div>
    );
}
