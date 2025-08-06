import { useTranslation, useTranslation as useTranslationI18n } from "react-i18next";
import { HistoryButton } from "@/components/common/HistoryButton";
import { SearchBar } from "@/components/common/SearchBar";
import { useSPARouter } from "@/hooks/useSPARouter";
import { useTypeExplore } from "@/hooks/useTypeExplore";
import { getLocalizationByLang, getType, searchTypeByName } from "@/native/data";
import { PageLayout } from "../../layout";

export function TypeHistoryButton() {
    const { history, setCurrentTypeID } = useTypeExplore();

    return (
        <HistoryButton
            type="type"
            history={history}
            onItemClick={setCurrentTypeID}
            emptyMessageKey="explore.type.history.empty"
            detailRoute="/explore/type/detail"
            detailTitleKey="explore.type.detail.title"
        />
    );
}

export function TypeExplorePage() {
    const { t } = useTranslation();
    const { setCurrentTypeID } = useTypeExplore();
    const { navigate } = useSPARouter();
    const { i18n } = useTranslationI18n();

    // Handle type card click event
    const handleTypeClick = (typeId: number) => {
        setCurrentTypeID(typeId);
        navigate("/explore/type/detail", t("explore.type.detail.title"));
    };

    // Search helper functions
    const searchFunction = async (query: string, language: string) => {
        return await searchTypeByName(query, language === "zh" ? "zh" : "en");
    };

    const getItemName = async (id: number, language: string) => {
        const type = await getType(id);
        if (!type) return null;
        return await getLocalizationByLang(type.type_name_id, language === "zh" ? "zh" : "en");
    };

    return (
        <PageLayout
            title={t("explore.type.title")}
            description={t("explore.type.desc")}
            actions={<TypeHistoryButton />}
        >
            <SearchBar
                type="type"
                onItemSelect={handleTypeClick}
                searchFunction={searchFunction}
                getItemName={getItemName}
                placeholder={t("explore.type.search.placeholder")}
                noResultsMessage={t("explore.type.search.no_results")}
                resultsTitle={t("explore.type.search.results")}
                language={i18n.language}
            />
        </PageLayout>
    );
}
