import type React from "react";
import { useTranslation } from "react-i18next";
import { PageLayout } from "@/components/layout";
import { useSPARouter } from "@/hooks/useSPARouter";
import { MarketBatchListInput } from "./market-batch-list/MarketBatchListInput";
import { MarketBatchListTable } from "./market-batch-list/MarketBatchListTable";

export const MarketBatchListPage: React.FC = () => {
    const { t } = useTranslation();

    return (
        <PageLayout
            title={t("market.batch_list.title")}
            description={t("market.batch_list.description")}
            className="flex flex-col gap-6"
        >
            <MarketBatchListInput />
        </PageLayout>
    );
};

export const MarketBatchListTablePage: React.FC = () => {
    const { t } = useTranslation();
    const { navigate, useRouteParams } = useSPARouter();

    const routeParams = useRouteParams("/market/batch-list/table");

    if (routeParams === undefined || !routeParams.typeList || routeParams.typeList.length === 0) {
        navigate("/market/batch-list");
        return;
    }

    return (
        <PageLayout title={t("market.batch_list.table.title")}>
            <MarketBatchListTable records={routeParams.typeList} />
        </PageLayout>
    );
};
