import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import * as dataApi from "@/native/data";

// Extract all async function names from the data API
type DataApiFunctions = typeof dataApi;
type AsyncDataFunctionKeys = {
    [K in keyof DataApiFunctions]: DataApiFunctions[K] extends (...args: any[]) => Promise<any>
        ? K
        : never;
}[keyof DataApiFunctions];

// Helper type to extract function parameters
type FunctionParams<T> = T extends (...args: infer P) => any ? P : never;

// Helper type to extract function return type (unwrapped from Promise)
type FunctionReturnType<T> = T extends (...args: any[]) => Promise<infer R> ? R : never;

// Generic query keys factory similar to localizationKeys
export const dataKeys = {
    all: ["data"] as const,
    byFunction: <K extends AsyncDataFunctionKeys>(
        functionName: K,
        ...params: FunctionParams<DataApiFunctions[K]>
    ) => [...dataKeys.all, functionName, ...params] as const,
};

// Generic create query function similar to createLocalizationQuery
export const createDataQuery = <K extends AsyncDataFunctionKeys>(
    functionName: K,
    ...params: FunctionParams<DataApiFunctions[K]>
) => ({
    queryKey: dataKeys.byFunction(functionName, ...params),
    queryFn: async (): Promise<FunctionReturnType<DataApiFunctions[K]>> => {
        // Create a mapping for tree-shaking friendly function access
        const functionMap = {
            getGraphicPath: dataApi.getGraphicPath,
            getIconPath: dataApi.getIconPath,
            getSkinMaterialPath: dataApi.getSkinMaterialPath,
            getFactionIconPath: dataApi.getFactionIconPath,
            getFactionLogoPath: dataApi.getFactionLogoPath,
            getLocalization: dataApi.getLocalization,
            getLocalizationByLang: dataApi.getLocalizationByLang,
            getGroup: dataApi.getGroup,
            getCategory: dataApi.getCategory,
            getMetaGroup: dataApi.getMetaGroup,
            getType: dataApi.getType,
            searchTypeByName: dataApi.searchTypeByName,
            searchTypeByDescription: dataApi.searchTypeByDescription,
            searchRegionByName: dataApi.searchRegionByName,
            searchConstellationByName: dataApi.searchConstellationByName,
            searchSystemByName: dataApi.searchSystemByName,
            getSkin: dataApi.getSkin,
            getSkinMaterial: dataApi.getSkinMaterial,
            getSkinLicense: dataApi.getSkinLicense,
            getSkinMaterialIdByLicense: dataApi.getSkinMaterialIdByLicense,
            getLicensesBySkin: dataApi.getLicensesBySkin,
            getFaction: dataApi.getFaction,
            getFactionIds: dataApi.getFactionIds,
            getMarketGroup: dataApi.getMarketGroup,
            getMarketGroupRaw: dataApi.getMarketGroupRaw,
            getMarketPrice: dataApi.getMarketPrice,
            getMarketPrices: dataApi.getMarketPrices,
            getLinkUrl: dataApi.getLinkUrl,
            getRegionById: dataApi.getRegionById,
            getRegionsByFactionId: dataApi.getRegionsByFactionId,
            getRegionsByWormholeClassId: dataApi.getRegionsByWormholeClassId,
            getRegionDetailById: dataApi.getRegionDetailById,
            getConstellationById: dataApi.getConstellationById,
            getConstellationsByRegionId: dataApi.getConstellationsByRegionId,
            getConstellationsByFactionId: dataApi.getConstellationsByFactionId,
            getConstellationsByWormholeClassId: dataApi.getConstellationsByWormholeClassId,
            getConstellationDetailById: dataApi.getConstellationDetailById,
            getSystemById: dataApi.getSystemById,
            getSystemsByRegionId: dataApi.getSystemsByRegionId,
            getSystemsByConstellationId: dataApi.getSystemsByConstellationId,
            getSystemsByFactionId: dataApi.getSystemsByFactionId,
            getSystemsByWormholeClassId: dataApi.getSystemsByWormholeClassId,
            getSystemsBySecurityRange: dataApi.getSystemsBySecurityRange,
            getSystemDataById: dataApi.getSystemDataById,
            getPlanetById: dataApi.getPlanetById,
            getPlanetDataById: dataApi.getPlanetDataById,
            getMoonById: dataApi.getMoonById,
            getMoonDataById: dataApi.getMoonDataById,
            getNpcStationById: dataApi.getNpcStationById,
            getNpcStationDataById: dataApi.getNpcStationDataById,
            getNpcCorporationById: dataApi.getNpcCorporationById,
            getNpcCorporationDataById: dataApi.getNpcCorporationDataById,
        } as const;

        const fn = functionMap[functionName];
        if (!fn) {
            throw new Error(`Function ${functionName} not found in data API`);
        }
        return await (fn as any)(...params);
    },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 1000 * 60 * 10,
});

// Generic useDataQuery hook for direct usage with React Query
export const useDataQuery = <K extends AsyncDataFunctionKeys>(
    functionName: K,
    ...params: FunctionParams<DataApiFunctions[K]>
) => {
    return useQuery(createDataQuery(functionName, ...params));
};

// Generic data hook with ensureQueryData pattern similar to useLocalization
export const useData = () => {
    const queryClient = useQueryClient();

    const getData = useCallback(
        async <K extends AsyncDataFunctionKeys>(
            functionName: K,
            ...params: FunctionParams<DataApiFunctions[K]>
        ): Promise<FunctionReturnType<DataApiFunctions[K]>> => {
            const queryOptions = createDataQuery(functionName, ...params);
            return await queryClient.ensureQueryData(queryOptions);
        },
        [queryClient]
    );

    return {
        getData,
    };
};

// Type-safe helper functions for commonly used patterns
export const createTypedDataQuery = {
    // Single ID-based queries
    getById: (functionName: string, id: number) => createDataQuery(functionName as any, id),

    // Search queries
    search: (functionName: string, term: string, language: "en" | "zh", limit?: number) =>
        createDataQuery(functionName as any, term, language, limit),

    // Filter queries
    getByFilter: (functionName: string, ...filters: any[]) =>
        createDataQuery(functionName as any, ...filters),
};

// Export commonly used query creators for specific functions
export const commonQueries = {
    getType: (typeId: number) => createDataQuery("getType", typeId),
    getGroup: (groupId: number) => createDataQuery("getGroup", groupId),
    getCategory: (categoryId: number) => createDataQuery("getCategory", categoryId),
    getFaction: (factionId: number) => createDataQuery("getFaction", factionId),
    getRegionById: (regionId: number) => createDataQuery("getRegionById", regionId),
    getSystemById: (solarSystemId: number) => createDataQuery("getSystemById", solarSystemId),
    getSkin: (skinId: number) => createDataQuery("getSkin", skinId),
    searchTypeByName: (name: string, language: "en" | "zh", limit = 20) =>
        createDataQuery("searchTypeByName", name, language, limit),
    searchRegionByName: (name: string, language: "en" | "zh") =>
        createDataQuery("searchRegionByName", name, language),
} as const;
