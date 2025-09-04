# Creating New Pages

This guide explains how to create new pages in the EVE MultiTools application, covering both simple pages and parameterized detail pages.

## 1. Simple Page Creation

### Step 1: Create Page Component

Create your page component in `src/components/pages/`:

```tsx
// src/components/pages/MyNewPage.tsx
import { useTranslation } from "react-i18next";
import { PageLayout } from "../layout";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export const MyNewPage: React.FC = () => {
    const { t } = useTranslation();

    return (
        <PageLayout
            title={t("my.new.page.title")}
            description={t("my.new.page.description")}
        >
            <Card>
                <CardHeader>
                    <CardTitle>{t("my.new.page.title")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>{t("my.new.page.content")}</p>
                </CardContent>
            </Card>
        </PageLayout>
    );
};
```

### Step 2: Add Route Configuration

Add the route to `src/config/routes.ts`:

```typescript
export const routes: AppRoute[] = [
    // ... existing routes
    {
        key: "my-new-page",
        path: "/my-new-page",
        labelKey: "nav.my_new_page",
        component: MyNewPage,
        icon: "star", // optional
    },
];
```

### Step 3: Navigation Usage

Navigate to the page using the router:

```tsx
import { useSPARouter } from "@/hooks/useSPARouter";

const { navigate } = useSPARouter();
navigate("/my-new-page");
```

## 2. Parameterized Detail Page Creation

### Step 1: Define Route Parameters

Add parameter types to `src/types/router.ts`:

```typescript
export interface RouteParamMap {
    // ... existing routes
    "/my-entity/detail": { entityId: number; entityType?: string };
}
```

### Step 2: Create Detail Page Component

```tsx
// src/components/pages/MyEntityDetailPage.tsx
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PageLayout } from "../layout";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface MyEntityDetailPageProps {
    entityId: number;
    entityType?: string;
}

export const MyEntityDetailPage: React.FC<MyEntityDetailPageProps> = ({ 
    entityId, 
    entityType 
}) => {
    const { t } = useTranslation();
    const [entityData, setEntityData] = useState(null);

    useEffect(() => {
        // Load entity data based on entityId
        // setEntityData(loadEntityData(entityId));
    }, [entityId]);

    return (
        <PageLayout
            title={t("my.entity.detail.title", { entityId })}
            description={t("my.entity.detail.description")}
        >
            <Card>
                <CardHeader>
                    <CardTitle>Entity {entityId}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Type: {entityType}</p>
                    {/* Render entity details */}
                </CardContent>
            </Card>
        </PageLayout>
    );
};
```

### Step 3: Create Wrapper Component

```tsx
// src/components/pages/MyEntityDetailPageWrapper.tsx
import type React from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSPARouter } from "@/hooks/useSPARouter";
import { PageLayout } from "../layout";
import { Card, CardContent } from "../ui/card";
import { MyEntityDetailPage } from "./MyEntityDetailPage";

export const MyEntityDetailPageWrapper: React.FC = () => {
    const { t } = useTranslation();
    const { navigate, useRouteParams } = useSPARouter();
    
    const routeParams = useRouteParams("/my-entity/detail");
    const { entityId, entityType } = routeParams || {};

    useEffect(() => {
        if (!entityId) {
            navigate("/my-entity");
        }
    }, [entityId, navigate, t]);

    if (!entityId) {
        return (
            <PageLayout title={t("my.entity.detail.title")} description={t("common.error")}>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-muted-foreground">
                            {t("my.entity.detail.no_entity_selected")}
                        </div>
                    </CardContent>
                </Card>
            </PageLayout>
        );
    }

    return <MyEntityDetailPage entityId={entityId} entityType={entityType} />;
};
```

### Step 4: Add Route Configuration

```typescript
// src/config/routes.ts
export const routes: AppRoute[] = [
    {
        key: "my-entity",
        path: "/my-entity",
        labelKey: "nav.my_entity",
        component: MyEntityListPage,
        children: [
            {
                key: "my-entity-detail",
                path: "/my-entity/detail",
                labelKey: "nav.my_entity.detail",
                component: MyEntityDetailPageWrapper,
                hideFromNav: true, // Hide from navigation menu
            },
        ],
    },
];
```

### Step 5: Add Navigation Helper (Optional)

Add convenience methods to `src/hooks/useSPARouter.ts`:

```typescript
export function useSPARouter() {
    // ... existing code

    const navigateToEntityDetail = (entityId: number, entityType?: string, title?: string) => {
        const finalTitle = title || t("my.entity.detail.title");
        
        router.addDetailHistory({
            id: `entity-${entityId}`,
            title: finalTitle,
            path: "/my-entity/detail",
            params: { entityId, entityType },
            timestamp: Date.now(),
        });

        router.navigateWithParams("/my-entity/detail", { entityId, entityType });
    };

    return {
        // ... existing methods
        navigateToEntityDetail,
    };
}
```

### Step 6: Navigation Usage

```tsx
import { useSPARouter } from "@/hooks/useSPARouter";

const { navigateToEntityDetail } = useSPARouter();

// Navigate to detail page
const handleEntityClick = (entityId: number) => {
    navigateToEntityDetail(entityId, "someType", "Entity Details");
};
```

## Key Points

- **Simple pages**: Direct component + route configuration
- **Detail pages**: Require parameter types, wrapper component, and route parameters
- **Wrapper pattern**: Handles parameter validation and redirection
- **Navigation helpers**: Provide type-safe navigation with history tracking
- **Route hiding**: Use `hideFromNav: true` for detail pages
- **Translation keys**: Follow existing patterns for i18n support

## Navigation Controls

All pages automatically get navigation controls (back button, history dropdown) through the `SPALayout` component. No additional setup required.
