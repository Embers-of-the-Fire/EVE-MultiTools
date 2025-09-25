import { type DependencyList, useEffect, useState } from "react";

export const useAsyncMemo = <T>(
    asyncFunction: () => Promise<T>,
    dependencies: DependencyList = []
): {
    isLoading: boolean;
    value: T | undefined;
    error: Error | null;
} => {
    const [value, setValue] = useState<T>();
    const [error, setError] = useState<Error | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;
        setIsLoading(true);
        setError(null);

        asyncFunction()
            .then((result) => {
                if (isMounted) {
                    setValue(result);
                    setIsLoading(false);
                }
            })
            .catch((err) => {
                if (isMounted) {
                    setError(err);
                    setIsLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
        // biome-ignore lint/correctness/useExhaustiveDependencies: custom hook wrapper
    }, dependencies);

    return { isLoading, value, error };
};
