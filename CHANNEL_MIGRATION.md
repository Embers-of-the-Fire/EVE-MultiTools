# Tauri Channel 机制迁移

## 概述

本次更改将 Bundle 导入功能从传统的事件系统迁移到了 Tauri 的 Channel 机制，以提高性能和数据传输的可靠性。

## 主要改进

### 1. 性能优化
- **更快的数据传输**：Channel 机制比事件系统更快，适合频繁的进度更新
- **有序数据传输**：确保进度事件按正确顺序传输
- **减少开销**：不需要 JavaScript 代码评估，减少了系统开销

### 2. 更好的类型安全
- **统一的事件类型**：使用 `BundleImportEvent` 统一进度和结果事件
- **强类型定义**：前端和后端都有完整的类型定义

### 3. 简化的 API

#### 旧的事件系统 (已弃用)
```typescript
// 需要监听两个不同的事件
await bundleCommands.importBundleFileAsync(
    bundlePath,
    (progress) => { /* 处理进度 */ },
    (result) => { /* 处理结果 */ }
);
```

#### 新的 Channel 机制
```typescript
// 统一的事件处理
await bundleCommands.importBundleFileAsync(
    bundlePath,
    (event) => {
        if (event.event === "progress") {
            // 处理进度: event.data 包含进度信息
        } else if (event.event === "result") {
            // 处理结果: event.data 包含结果信息
        }
    }
);
```

## 技术细节

### 后端改进

#### 新的事件类型定义
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", tag = "event", content = "data")]
pub enum BundleImportEvent {
    Progress {
        stage: ImportStage,
        current: u64,
        total: u64,
        message_key: Option<String>,
        message_params: Option<serde_json::Value>,
    },
    Result {
        success: bool,
        bundle_name: Option<String>,
        error_type: Option<ImportErrorType>,
        error_params: Option<serde_json::Value>,
    },
}
```

#### 新的命令签名
```rust
#[tauri::command]
pub async fn import_bundle_file(
    bundle_path: String,
    // ... 其他参数
    on_event: Channel<BundleImportEvent>,
) -> Result<(), String>
```

### 前端改进

#### 新的事件类型
```typescript
export type BundleImportEvent = 
    | {
        event: "progress";
        data: {
            stage: ImportStage;
            current: number;
            total: number;
            message_key?: string;
            message_params?: Record<string, unknown>;
        };
    }
    | {
        event: "result";
        data: {
            success: boolean;
            bundle_name?: string;
            error_type?: ImportErrorType;
            error_params?: Record<string, unknown>;
        };
    };
```

#### 简化的使用方式
```typescript
import { Channel } from "@tauri-apps/api/core";

export async function importBundleFileAsync(
    bundlePath: string,
    onEvent?: (event: BundleImportEvent) => void
): Promise<void> {
    const channel = new Channel<BundleImportEvent>();
    
    if (onEvent) {
        channel.onmessage = onEvent;
    }

    await tauriInvoke<void>("import_bundle_file", {
        bundlePath,
        onEvent: channel,
    });
}
```

## 未迁移的事件

以下事件仍然使用传统的事件系统，因为它们更适合全局广播：

- `bundle-change-start`: Bundle 切换开始通知
- `bundle-change-finished`: Bundle 切换完成通知  
- `bundles-changed`: Bundle 列表变化通知

这些事件是全局状态变化的通知，不涉及大量数据传输，因此继续使用事件系统是合适的。

## 总结

通过引入 Channel 机制，Bundle 导入功能现在具有：

1. **更好的性能** - 适合频繁的进度更新
2. **更强的类型安全** - 统一的事件类型系统
3. **更简单的 API** - 单一的事件处理函数
4. **更好的可维护性** - 清晰的数据流和错误处理

这一改进使得 Bundle 导入功能更加稳定和高效，为用户提供了更好的体验。
