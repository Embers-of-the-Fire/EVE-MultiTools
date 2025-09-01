import { useTranslation } from "react-i18next";
import { EmbeddedTypeCard } from "@/components/card/TypeCard";
import { HistoryButton } from "@/components/common/HistoryButton";
import { SearchBar } from "@/components/common/SearchBar";
import { useLanguage } from "@/hooks/useAppSettings";
import { useLocalization } from "@/hooks/useLocalization";
import { useSPARouter } from "@/hooks/useSPARouter";
import { useTypeExplore } from "@/hooks/useTypeExplore";
import type { Language } from "@/native";
import { getType, searchTypeByName } from "@/native/data";
import { PageLayout } from "../../layout";
import { ScrollArea } from "../../ui/scroll-area";

export function TypeHistoryButton() {
    const { history, setCurrentTypeID } = useTypeExplore();
    const { navigate } = useSPARouter();
    const { t } = useTranslation();

    const renderItem = (id: number, onClick: () => void) => (
        <EmbeddedTypeCard
            compact={true}
            showBadges={false}
            typeId={id}
            className="w-full px-2 py-1 bg-transparent hover:bg-gray-100 dark:hover:bg-black/30 transition-colors rounded-none"
            noBorder
            onClick={onClick}
        />
    );

    return (
        <HistoryButton
            history={history}
            onItemClick={(id) => {
                setCurrentTypeID(id);
                navigate("/explore/type/detail", t("explore.type.detail.title"));
            }}
            emptyMessageKey="explore.type.history.empty"
            detailRoute="/explore/type/detail"
            detailTitleKey="explore.type.detail.title"
            renderItem={renderItem}
        />
    );
}

export function TypeExplorePage() {
    const { t } = useTranslation();
    const { loc } = useLocalization();
    const { language } = useLanguage();

    const { setCurrentTypeID } = useTypeExplore();
    const { navigate } = useSPARouter();

    // Handle type card click event
    const handleTypeClick = (typeId: number) => {
        setCurrentTypeID(typeId);
        navigate("/explore/type/detail", t("explore.type.detail.title"));
    };

    // Search helper functions
    const searchFunction = async (query: string, language: Language) => {
        return await searchTypeByName(query, language);
    };

    const getItemName = async (id: number) => {
        const type = await getType(id);
        if (!type) return null;
        return await loc(type.type_name_id);
    };

    return (
        <PageLayout
            title={t("explore.type.title")}
            description={t("explore.type.desc")}
            actions={<TypeHistoryButton />}
        >
            <SearchBar
                onItemSelect={handleTypeClick}
                searchFunction={searchFunction}
                getItemName={getItemName}
                placeholder={t("explore.type.search.placeholder")}
                noResultsMessage={t("common.no_results")}
                language={language}
            >
                {({ results, loading, query, onSelect, noResultsMessage }) => (
                    <div className="pr-0 flex flex-col flex-1 min-h-0 w-full max-w-none">
                        {loading && <div className="p-2">{t("common.loading")}</div>}
                        {!loading && results.length > 0 && (
                            <ScrollArea className="border rounded-md bg-white dark:bg-black/30 shadow-sm p-0 my-2 flex-1 min-h-0 flex flex-col">
                                <div className="font-bold mb-2 px-4 pt-4">
                                    {t("common.search.results")} ({results.length})
                                </div>
                                <div className="flex flex-col min-h-0 w-full max-w-none flex-1">
                                    {results.map((item, idx) => (
                                        <div key={item.id}>
                                            <EmbeddedTypeCard
                                                typeId={item.id}
                                                compact={false}
                                                noBorder
                                                onClick={onSelect}
                                                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-black/30 transition-colors rounded-none px-4 py-2 w-full"
                                            />
                                            {idx !== results.length - 1 && (
                                                <div className="w-full h-px bg-gray-200 dark:bg-gray-700 mx-0" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                        {!loading && query && results.length === 0 && (
                            <div className="text-center text-muted-foreground mt-8">
                                <p>{noResultsMessage}</p>
                            </div>
                        )}
                    </div>
                )}
            </SearchBar>
        </PageLayout>
    );
}
