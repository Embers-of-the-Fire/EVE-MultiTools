import { useTranslation } from "react-i18next";

export const useLocalizedMessage = () => {
    const { t, i18n } = useTranslation();

    return {
        t,
        i18n,
        language: i18n.language,
        changeLanguage: i18n.changeLanguage,
    };
};
