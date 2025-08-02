import { Fragment, useEffect, useRef, useState } from "react";
import { useTranslation, useTranslation as useTranslationI18n } from "react-i18next";
import { useSPARouter } from "@/hooks/useSPARouter";
import { useTypeExplore } from "@/hooks/useTypeExplore";
import { getLocalizationByLang, getType, searchTypeByName } from "@/native/data";
import { PageLayout } from "../../layout";

type SearchResult = { id: number; name: string };

import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { History, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmbeddedTypeCard } from "../../TypeCard";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { ScrollArea, ScrollBar } from "../../ui/scroll-area";
import { Separator } from "../../ui/separator";

export function TypeHistoryButton() {
    const { t } = useTranslation();
    const { history, setCurrentTypeID } = useTypeExplore();
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
                                    {t("explore.type.history.empty")}
                                </div>
                            ) : (
                                history.map((id, idx) => (
                                    <Fragment key={id}>
                                        <EmbeddedTypeCard
                                            compact={true}
                                            typeId={id}
                                            className="w-full px-2 py-1 bg-transparent hover:bg-gray-100 dark:hover:bg-black/30 transition-colors rounded-none"
                                            noBorder
                                            onClick={() => {
                                                setCurrentTypeID(id);
                                                navigate(
                                                    "/explore/type/detail",
                                                    t("explore.type.detail.title")
                                                );
                                                setOpen(false);
                                            }}
                                        />
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

export function TypeExplorePage() {
    const { t } = useTranslation();
    const { setCurrentTypeID } = useTypeExplore();
    const { navigate } = useSPARouter();
    const [search, setSearch] = useState("");
    const [focused, setFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const { i18n } = useTranslationI18n();

    // Handle type card click event
    const handleTypeClick = (typeId: number) => {
        setCurrentTypeID(typeId);
        navigate("/explore/type/detail", t("explore.type.detail.title"));
    };

    useEffect(() => {
        let ignore = false;
        if (!search.trim()) {
            setResults([]);
            return;
        }
        setLoading(true);
        (async () => {
            try {
                const ids = await searchTypeByName(search, i18n.language === "zh" ? "zh" : "en");
                const items: SearchResult[] = [];
                for (const id of ids) {
                    const type = await getType(id);
                    if (!type) continue;
                    const name = await getLocalizationByLang(
                        type.type_name_id,
                        i18n.language === "zh" ? "zh" : "en"
                    );
                    items.push({ id, name: name || String(id) });
                }
                if (!ignore) setResults(items);
            } finally {
                if (!ignore) setLoading(false);
            }
        })();
        return () => {
            ignore = true;
        };
    }, [search, i18n.language]);

    return (
        <PageLayout
            title={t("explore.type.title")}
            description={t("explore.type.desc")}
            actions={<TypeHistoryButton />}
        >
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
                    placeholder={t("explore.type.search.placeholder")}
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
                    onClick={() => {
                        setSearch("");
                        inputRef.current?.blur();
                    }}
                    tabIndex={-1}
                >
                    <X />
                </Button>
            </div>
            <div className="pr-0 flex flex-col flex-1 min-h-0 w-full max-w-none">
                {loading && <div>{t("common.loading")}</div>}
                {!loading && results.length > 0 && (
                    <ScrollArea className="border rounded-md bg-white dark:bg-black/30 shadow-sm p-0 my-2 flex-1 min-h-0 flex flex-col">
                        <div className="font-bold mb-2 px-4 pt-4">
                            {t("explore.type.search.results")}
                        </div>
                        <div className="flex flex-col min-h-0 w-full max-w-none flex-1">
                            {results.map((item, idx) => (
                                <Fragment key={item.id}>
                                    <EmbeddedTypeCard
                                        typeId={item.id}
                                        compact={false}
                                        noBorder
                                        onClick={handleTypeClick}
                                        className="cursor-pointer hover:bg-gray-100 dark:hover:bg-black/30 transition-colors rounded-none px-4 py-2 w-full"
                                    />
                                    {idx !== results.length - 1 && (
                                        <div className="w-full h-px bg-gray-200 dark:bg-gray-700 mx-0" />
                                    )}
                                </Fragment>
                            ))}
                        </div>
                    </ScrollArea>
                )}
                {!loading && search && results.length === 0 && (
                    <div>{t("explore.type.search.no_results")}</div>
                )}
            </div>
        </PageLayout>
    );
}
