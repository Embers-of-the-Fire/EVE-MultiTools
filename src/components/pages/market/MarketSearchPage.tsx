import { useTranslation } from "react-i18next";
import { EmbeddedMarketTypeCard } from "@/components/card/MarketTypeCard";
import { SearchBar } from "@/components/common/SearchBar";
import { PageLayout } from "@/components/layout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/hooks/useAppSettings";
import type { Language } from "@/native";
import { searchTypeByName } from "@/native/data";

export function MarketSearchPage() {
    const { t } = useTranslation();
    const { language } = useLanguage();

    const searchFunction = async (query: string, language: Language) => {
        return await searchTypeByName(query, language, 100);
    };

    return (
        <PageLayout title={t("market.search.title")}>
            <SearchBar
                searchFunction={searchFunction}
                placeholder={t("market.search.placeholder")}
                noResultsMessage={t("common.no_results")}
                language={language}
            >
                {({ results, loading, query, noResultsMessage }) => (
                    <div className="pr-0 flex flex-col flex-1 min-h-0 w-full max-w-none">
                        {loading && <div className="text-center">{t("common.loading")}</div>}
                        {!loading && query && results.length === 0 && (
                            <div className="text-center text-gray-500">{noResultsMessage}</div>
                        )}
                        {!loading && query && results.length > 0 && (
                            <ScrollArea className="border rounded-md bg-white dark:bg-black/30 shadow-sm p-0 my-2 flex-1 min-h-0 flex flex-col">
                                <div className="font-bold mb-2 px-4 pt-4">
                                    {t("common.search.results")} ({results.length})
                                </div>
                                <div className="flex flex-col min-h-0 w-full max-w-none flex-1">
                                    {results.map((item) => (
                                        <div key={item}>
                                            <EmbeddedMarketTypeCard
                                                typeId={item}
                                                compact={false}
                                                noBorder
                                                className="hover:bg-gray-100 dark:hover:bg-black/30 transition-colors rounded-none px-4 py-2 w-full"
                                            />
                                            {item !== results[results.length - 1] && (
                                                <div className="w-full h-px bg-gray-200 dark:bg-gray-700 mx-0" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                )}
            </SearchBar>
        </PageLayout>
    );
}
