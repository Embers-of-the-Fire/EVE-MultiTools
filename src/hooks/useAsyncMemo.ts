import { type DependencyList, useEffect, useState } from "react";

export const useAsyncMemo = <T>(
    asyncFunction: () => Promise<T>,
    dependencies: DependencyList = []
): T | undefined => {
    const [value, setValue] = useState<T>();
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let isMounted = true;

        asyncFunction()
            .then((result) => {
                if (isMounted) {
                    setValue(result);
                }
            })
            .catch((err) => {
                if (isMounted) {
                    setError(err);
                }
            });

        return () => {
            isMounted = false;
        };
        // biome-ignore lint/correctness/useExhaustiveDependencies: custom hook wrapper
    }, dependencies);

    if (error) {
        throw error;
    }

    return value;
};
