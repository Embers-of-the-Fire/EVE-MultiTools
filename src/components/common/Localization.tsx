import type React from "react";
import { Suspense, use } from "react";
import { useLocalization } from "@/hooks/useLocalization";

export const Localization: React.FC<{
    locKey: number | Promise<number>;
}> = ({ locKey }) => {
    const LocalizationInner = ({ locKey }: { locKey: number | Promise<number> }) => {
        const { loc } = useLocalization();

        const getLoc = async (locKey: number | Promise<number>) => {
            const key = await locKey;
            return await loc(key);
        };

        const text = use(getLoc(locKey));

        return <>{text}</>;
    };

    return (
        <Suspense fallback={typeof locKey === "number" ? locKey : "..."}>
            <LocalizationInner locKey={locKey} />
        </Suspense>
    );
};
