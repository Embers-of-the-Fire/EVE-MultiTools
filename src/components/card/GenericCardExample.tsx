// GenericCard 使用示例

import type { GenericData } from "@/components/card/GenericCard";
import GenericCard from "@/components/card/GenericCard";

// 示例数据
const sampleData: GenericData = {
    name: "示例物品",
    description: "这是一个示例物品的描述信息，用于展示GenericCard组件的功能",
    iconUrl: "/path/to/icon.png",
    badges: [
        { text: "主要标签", variant: "secondary", key: "primary" },
        { text: "次要标签", variant: "outline", key: "secondary" },
        { text: "重要", variant: "destructive", key: "important" },
    ],
    id: 12345,
    loading: false,
};

const simpleBadgeData: GenericData = {
    name: "简单示例",
    description: "只有一个标签的示例",
    badges: [{ text: "单一标签", variant: "default" }],
    id: 67890,
    loading: false,
};

const loadingData: GenericData = {
    name: "",
    loading: true,
};

// 使用示例
export function GenericCardExample() {
    const handleClick = (id: string | number | undefined) => {
        console.log("Clicked item with ID:", id);
    };

    return (
        <div className="space-y-4 p-4">
            <h2 className="text-2xl font-bold">GenericCard 组件示例</h2>

            {/* 基础卡片 */}
            <div>
                <h3 className="text-lg font-semibold mb-2">基础卡片 (GenericCard.Card)</h3>
                <GenericCard.Card data={sampleData} onClick={handleClick} />
            </div>

            {/* 悬浮卡片 */}
            <div>
                <h3 className="text-lg font-semibold mb-2">悬浮卡片 (GenericCard.Hover)</h3>
                <GenericCard.Hover data={sampleData} className="max-w-xs" />
            </div>

            {/* 嵌入式卡片 */}
            <div>
                <h3 className="text-lg font-semibold mb-2">嵌入式卡片 (GenericCard.Embed)</h3>
                <GenericCard.Embed
                    data={sampleData}
                    title="示例标题"
                    onClick={handleClick}
                    className="max-w-md"
                />
            </div>

            {/* 简单标签示例 */}
            <div>
                <h3 className="text-lg font-semibold mb-2">简单标签示例</h3>
                <GenericCard.Embed
                    data={simpleBadgeData}
                    title="简单示例"
                    onClick={handleClick}
                    className="max-w-md"
                />
            </div>

            {/* 紧凑模式嵌入式卡片 */}
            <div>
                <h3 className="text-lg font-semibold mb-2">紧凑模式嵌入式卡片</h3>
                <GenericCard.Embed
                    data={sampleData}
                    compact={true}
                    onClick={handleClick}
                    className="max-w-md"
                />
            </div>

            {/* 无边框嵌入式卡片 */}
            <div>
                <h3 className="text-lg font-semibold mb-2">无边框嵌入式卡片</h3>
                <GenericCard.Embed
                    data={sampleData}
                    noBorder={true}
                    onClick={handleClick}
                    className="max-w-md"
                />
            </div>

            {/* 加载状态示例 */}
            <div>
                <h3 className="text-lg font-semibold mb-2">加载状态示例</h3>
                <div className="space-y-2">
                    <GenericCard.Card data={loadingData} />
                    <GenericCard.Hover data={loadingData} className="max-w-xs" />
                    <GenericCard.Embed data={loadingData} title="加载中..." className="max-w-md" />
                </div>
            </div>
        </div>
    );
}
