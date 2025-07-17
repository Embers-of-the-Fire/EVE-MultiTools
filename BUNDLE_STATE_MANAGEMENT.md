# Bundle 全局状态管理系统

## 概述

我已经成功构建了一个全局的Bundle状态管理系统，用于管理EVE-MultiTools应用中的Bundle相关数据。这个系统提供了一个统一的状态管理解决方案，可以让所有组件监听Bundle的变化并获取相关信息。

## 架构设计

### 核心组件

1. **BundleContext** (`src/contexts/BundleContext.tsx`)
   - 提供全局Bundle状态管理
   - 处理Bundle事件监听
   - 提供Bundle操作方法

2. **BundleProvider** 
   - 包裹应用程序，提供Bundle状态给子组件
   - 自动处理事件监听和状态同步

3. **useBundle Hook**
   - 提供访问Bundle状态和方法的便捷接口

## 功能特性

### 状态管理

- **bundles**: 所有可用的Bundle列表
- **activeBundle**: 当前启用的Bundle
- **switchingToBundleId**: 正在切换中的Bundle ID
- **isLoading**: 加载状态
- **error**: 错误信息

### 方法

- **loadBundles(shouldAutoEnable?)**: 加载Bundle列表
- **switchBundle(bundle)**: 切换Bundle
- **refreshBundles()**: 刷新Bundle列表
- **clearError()**: 清除错误信息

### 事件监听

系统自动监听以下Tauri事件：

- `bundle-change-start`: Bundle切换开始
- `bundle-change-finished`: Bundle切换完成
- `bundles-changed`: Bundle列表变化

## 使用方法

### 1. 在组件中使用

```tsx
import { useBundle } from "@/contexts/BundleContext";

export function MyComponent() {
    const {
        bundles,
        activeBundle,
        switchingToBundleId,
        isLoading,
        error,
        switchBundle,
        refreshBundles,
        clearError,
    } = useBundle();

    // 使用状态和方法
    const handleSwitchBundle = async (bundle) => {
        try {
            await switchBundle(bundle);
        } catch (error) {
            console.error("Failed to switch bundle:", error);
        }
    };

    return (
        <div>
            {/* 组件内容 */}
        </div>
    );
}
```

### 2. 获取当前Bundle状态

```tsx
const { activeBundle, isLoading } = useBundle();

if (isLoading) {
    return <div>Loading...</div>;
}

if (!activeBundle) {
    return <div>No active bundle</div>;
}

return (
    <div>
        Active Bundle: {activeBundle.serverName.en}
        Version: {activeBundle.gameInfo.version}
    </div>
);
```

### 3. 监听Bundle变化

```tsx
const { bundles, switchingToBundleId } = useBundle();

return (
    <div>
        {bundles.map((bundle) => (
            <div key={bundle.serverID}>
                {bundle.serverName.en}
                {switchingToBundleId === bundle.serverID && (
                    <span>Switching...</span>
                )}
            </div>
        ))}
    </div>
);
```

## 已更新的组件

### 1. BundleSwitcher

- 移除了本地状态管理
- 使用全局Bundle状态
- 简化了事件监听逻辑

### 2. BundlePage

- 移除了本地Bundle状态
- 使用全局Bundle状态
- 简化了状态同步逻辑

### 3. Providers

- 添加了BundleProvider包装
- 确保Bundle状态在整个应用中可用

## 优势

1. **统一状态管理**: 所有Bundle相关状态都集中管理
2. **自动同步**: 通过事件监听自动同步状态
3. **减少重复代码**: 避免在多个组件中重复Bundle状态逻辑
4. **更好的性能**: 避免不必要的API调用
5. **类型安全**: 完整的TypeScript支持
6. **易于调试**: 集中的状态管理便于调试

## 文件结构

```
src/
├── contexts/
│   └── BundleContext.tsx          # Bundle状态管理
├── components/
│   ├── sidebar/
│   │   └── bundle-switcher.tsx    # 更新后的Bundle切换器
│   ├── pages/
│   │   └── BundlePage.tsx         # 更新后的Bundle页面
│   └── examples/
│       └── BundleContextExample.tsx # 使用示例
└── app/
    └── providers.tsx              # 更新后的Provider配置
```

## 未来扩展

这个系统可以很容易地扩展以支持：

1. **Bundle搜索和过滤**
2. **Bundle收藏功能**
3. **Bundle使用统计**
4. **Bundle更新通知**
5. **Bundle依赖管理**

## 总结

这个全局Bundle状态管理系统为EVE-MultiTools应用提供了一个强大、灵活且易于使用的Bundle管理解决方案。它通过React Context和自定义Hook的组合，实现了高效的状态管理和组件间通信。
