import { useTranslation } from "react-i18next";
import { EmbeddedUniverseObjectCard } from "@/components/card/UniverseObjectCard";
import { DetailPageActions } from "@/components/common/DetailPageActions";
import { useSPARouter } from "@/hooks/useSPARouter";
import { useUniverseExplore } from "@/hooks/useUniverseExplore";
import type { UniverseObject } from "@/stores/universeExploreStore";

export function UniverseHistoryActions() {
    const { history, setCurrentUniverseObject } = useUniverseExplore();
    const { navigate } = useSPARouter();
    const { t } = useTranslation();

    const renderItem = (id: UniverseObject, onClick: () => void) => (
        <EmbeddedUniverseObjectCard
            compact={true}
            obj={id}
            noBorder
            showBadges={false}
            onClick={onClick}
        />
    );

    return (
        <DetailPageActions<UniverseObject>
            history={history}
            onItemClick={(id) => {
                console.log(id);
                setCurrentUniverseObject(id);
                navigate("/explore/universe/detail", t("explore.universe.detail.title"));
            }}
            backRoute="/explore/universe"
            emptyMessageKey="explore.universe.history.empty"
            detailRoute="/explore/universe/detail"
            detailTitleKey="explore.universe.detail.title"
            renderItem={renderItem}
            getKey={(id) => id.id}
        />
    );
}
