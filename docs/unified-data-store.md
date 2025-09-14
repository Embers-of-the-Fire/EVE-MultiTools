# Unified Data Store System

This document describes the new unified data store system that provides a generic, type-safe way to handle all backend async functions from `data.ts` using React Query.

## Overview

The unified data store replaces the need for individual stores/hooks for each backend function. Instead of creating separate stores like `localizationStore.ts`, `typeStore.ts`, `regionStore.ts`, etc., we now have one generic system that handles all data fetching with proper typing and caching.

## Key Features

- **Single Generic System**: One store handles all backend functions
- **Type Safety**: Full TypeScript support with proper type inference
- **Consistent Caching**: Same strategy as localization (infinite stale time, 24h GC)
- **React Query Integration**: Uses TanStack Query for optimal caching and state management
- **Flexible API**: Multiple ways to use the data depending on your needs

## Basic Usage

### 1. Direct Hook Usage (`useDataQuery`)

Similar to using `useQuery` directly, but with automatic type inference:

```typescript
import { useDataQuery } from "@/stores/dataStore";

// Get a type by ID
const { data: type, isLoading, error } = useDataQuery("getType", 34);

// Search for types
const { data: searchResults } = useDataQuery("searchTypeByName", "Tritanium", "en", 10);

// Get region data
const { data: region } = useDataQuery("getRegionById", 10000002);
```

### 2. Unified Hook Pattern (`useData`)

Similar to the existing `useLocalization` pattern with `ensureQueryData`:

```tsx
import { useData } from "@/stores/dataStore";

const MyComponent = () => {
    const { getData } = useData();
    const [typeInfo, setTypeInfo] = useState("");
    
    useEffect(() => {
        const loadData = async () => {
            try {
                const type = await getData("getType", 34);
                setTypeInfo(type?.internal_name || "Unknown");
            } catch (error) {
                console.error("Failed to load type:", error);
            }
        };
        loadData();
    }, [getData]);
    
    return <div>{typeInfo}</div>;
};
```

### 3. Common Queries

Pre-defined query creators for frequently used functions:

```tsx
import { commonQueries } from "@/stores/dataStore";
import { useQueryClient } from "@tanstack/react-query";

const MyComponent = () => {
    const queryClient = useQueryClient();
    
    useEffect(() => {
        const loadType = async () => {
            const queryOptions = commonQueries.getType(34);
            const type = await queryClient.ensureQueryData(queryOptions);
            console.log(type);
        };
        loadType();
    }, [queryClient]);
};
```

## Advanced Usage

### Custom Query Configuration

You can override cache settings for specific use cases:

```tsx
import { createDataQuery } from "@/stores/dataStore";
import { useQuery } from "@tanstack/react-query";

const MyComponent = () => {
    const customQuery = useMemo(() => ({
        ...createDataQuery("getFaction", 500001),
        staleTime: 1000 * 60 * 5, // 5 minutes instead of infinite
    }), []);
    
    const { data: faction } = useQuery(customQuery);
};
```

### Prefetching Related Data

```tsx
import { createDataQuery } from "@/stores/dataStore";
import { useQueryClient } from "@tanstack/react-query";

const MyComponent = ({ regionId }) => {
    const queryClient = useQueryClient();
    
    useEffect(() => {
        // Prefetch related data for better UX
        const prefetchData = async () => {
            const regionQuery = createDataQuery("getRegionById", regionId);
            const region = await queryClient.ensureQueryData(regionQuery);
            
            // Prefetch constellations in this region
            const constellationsQuery = createDataQuery("getConstellationsByRegionId", regionId);
            queryClient.prefetchQuery(constellationsQuery);
            
            // Prefetch faction data if available
            if (region.faction_id) {
                const factionQuery = createDataQuery("getFaction", region.faction_id);
                queryClient.prefetchQuery(factionQuery);
            }
        };
        
        prefetchData();
    }, [regionId, queryClient]);
};
```

### Cache Management

```tsx
import { dataKeys } from "@/stores/dataStore";
import { useQueryClient } from "@tanstack/react-query";

const CacheManager = () => {
    const queryClient = useQueryClient();
    
    const invalidateAllData = () => {
        queryClient.invalidateQueries({ queryKey: dataKeys.all });
    };
    
    const invalidateSpecificFunction = (functionName) => {
        queryClient.invalidateQueries({ 
            queryKey: [dataKeys.all[0], functionName],
            exact: false 
        });
    };
    
    const invalidateSpecificQuery = (typeId) => {
        const queryKey = dataKeys.byFunction("getType", typeId);
        queryClient.invalidateQueries({ queryKey });
    };
};
```

## Migration Guide

### From Individual Stores

**Before (separate stores):**
```typescript
// typeStore.ts
export const useTypeQuery = (typeId: number) => {
    return useQuery({
        queryKey: ["type", typeId],
        queryFn: () => getType(typeId),
        staleTime: Infinity,
    });
};

// regionStore.ts
export const useRegionQuery = (regionId: number) => {
    return useQuery({
        queryKey: ["region", regionId],
        queryFn: () => getRegionById(regionId),
        staleTime: Infinity,
    });
};
```

**After (unified store):**
```typescript
import { useDataQuery } from "@/stores/dataStore";

// Replace all individual queries with unified approach
const { data: type } = useDataQuery("getType", typeId);
const { data: region } = useDataQuery("getRegionById", regionId);
```

### From Direct Data API Usage

**Before:**
```tsx
import { getType, getRegionById } from "@/native/data";

const MyComponent = () => {
    const [type, setType] = useState(null);
    
    useEffect(() => {
        getType(34).then(setType);
    }, []);
};
```

**After:**
```tsx
import { useDataQuery } from "@/stores/dataStore";

const MyComponent = () => {
    const { data: type, isLoading } = useDataQuery("getType", 34);
    // Automatic caching, error handling, loading states!
};
```

## Benefits

1. **Reduced Boilerplate**: No need to create individual stores for each function
2. **Consistent Patterns**: All data fetching follows the same pattern
3. **Better Type Safety**: Full TypeScript inference for all functions
4. **Automatic Caching**: Consistent caching strategy across all data
5. **Better DX**: IntelliSense support for all available functions
6. **Easier Maintenance**: Single place to manage data fetching logic

## API Reference

### `useDataQuery<K>(functionName: K, ...params)`
Direct React Query hook with automatic type inference.

### `useData().getData<K>(functionName: K, ...params)`
Unified data fetcher using `ensureQueryData` pattern.

### `createDataQuery<K>(functionName: K, ...params)`
Query factory for creating custom queries.

### `dataKeys.byFunction(functionName, ...params)`
Query key factory for cache management.

### `commonQueries`
Pre-defined query creators for frequently used functions.
