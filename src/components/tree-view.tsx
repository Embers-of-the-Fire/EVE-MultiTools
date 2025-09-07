"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { cva } from "class-variance-authority";
import { ChevronRight } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

const treeVariants = cva(
    "group hover:before:opacity-100 before:absolute before:rounded-lg before:left-0 px-2 before:w-full before:opacity-0 before:bg-accent/70 before:h-[2rem] before:-z-10"
);

const selectedTreeVariants = cva("before:opacity-100 before:bg-accent/70 text-accent-foreground");

const dragOverVariants = cva("before:opacity-100 before:bg-primary/20 text-primary-foreground");

interface TreeDataItem {
    id: string;
    name: React.ReactNode;
    icon?: React.ReactNode;
    selectedIcon?: React.ReactNode;
    openIcon?: React.ReactNode;
    children?: TreeDataItem[];
    actions?: React.ReactNode;
    onClick?: () => void;
    draggable?: boolean;
    droppable?: boolean;
    disabled?: boolean;
}

type TreeProps = React.HTMLAttributes<HTMLDivElement> & {
    data: TreeDataItem[] | TreeDataItem;
    initialSelectedItemId?: string;
    onSelectChange?: (item: TreeDataItem | undefined) => void;
    expandAll?: boolean;
    defaultNodeIcon?: React.ReactNode;
    defaultLeafIcon?: React.ReactNode;
    onDocumentDrag?: (sourceItem: TreeDataItem, targetItem: TreeDataItem) => void;
    ref?: React.Ref<HTMLDivElement>;
};

const TreeView: React.FC<TreeProps> = ({
    data,
    initialSelectedItemId,
    onSelectChange,
    expandAll,
    defaultLeafIcon,
    defaultNodeIcon,
    className,
    onDocumentDrag,
    ref,
    ...props
}) => {
    const [selectedItemId, setSelectedItemId] = React.useState<string | undefined>(
        initialSelectedItemId
    );

    const [draggedItem, setDraggedItem] = React.useState<TreeDataItem | null>(null);

    const handleSelectChange = React.useCallback(
        (item: TreeDataItem | undefined) => {
            setSelectedItemId(item?.id);
            if (onSelectChange) {
                onSelectChange(item);
            }
        },
        [onSelectChange]
    );

    const handleDragStart = React.useCallback((item: TreeDataItem) => {
        setDraggedItem(item);
    }, []);

    const handleDrop = React.useCallback(
        (targetItem: TreeDataItem) => {
            if (draggedItem && onDocumentDrag && draggedItem.id !== targetItem.id) {
                onDocumentDrag(draggedItem, targetItem);
            }
            setDraggedItem(null);
        },
        [draggedItem, onDocumentDrag]
    );

    const expandedItemIds = React.useMemo(() => {
        if (!initialSelectedItemId) {
            return [] as string[];
        }

        const ids: string[] = [];

        function walkTreeItems(items: TreeDataItem[] | TreeDataItem, targetId: string) {
            if (Array.isArray(items)) {
                for (let i = 0; i < items.length; i++) {
                    ids.push(items[i]!.id);
                    if (walkTreeItems(items[i]!, targetId) && !expandAll) {
                        return true;
                    }
                    if (!expandAll) ids.pop();
                }
            } else if (!expandAll && items.id === targetId) {
                return true;
            } else if (items.children) {
                return walkTreeItems(items.children, targetId);
            }
        }

        walkTreeItems(data, initialSelectedItemId);
        return ids;
    }, [data, expandAll, initialSelectedItemId]);

    return (
        <div className={cn("overflow-hidden relative p-2", className)}>
            <TreeItem
                data={data}
                ref={ref}
                selectedItemId={selectedItemId}
                handleSelectChange={handleSelectChange}
                expandedItemIds={expandedItemIds}
                defaultLeafIcon={defaultLeafIcon}
                defaultNodeIcon={defaultNodeIcon}
                handleDragStart={handleDragStart}
                handleDrop={handleDrop}
                draggedItem={draggedItem}
                {...props}
            />
            <div
                className="w-full h-[48px]"
                onDrop={(_) => {
                    handleDrop({ id: "", name: "parent_div" });
                }}
            ></div>
        </div>
    );
};
TreeView.displayName = "TreeView";

type TreeItemProps = TreeProps & {
    selectedItemId?: string;
    handleSelectChange: (item: TreeDataItem | undefined) => void;
    expandedItemIds: string[];
    defaultNodeIcon?: React.ReactNode;
    defaultLeafIcon?: React.ReactNode;
    handleDragStart?: (item: TreeDataItem) => void;
    handleDrop?: (item: TreeDataItem) => void;
    draggedItem: TreeDataItem | null;
    ref?: React.Ref<HTMLDivElement>;
};

const TreeItem: React.FC<TreeItemProps> = ({
    className,
    data,
    selectedItemId,
    handleSelectChange,
    expandedItemIds,
    defaultNodeIcon,
    defaultLeafIcon,
    handleDragStart,
    handleDrop,
    draggedItem,
    ref,
    ...props
}) => {
    if (!Array.isArray(data)) {
        data = [data];
    }
    return (
        <div ref={ref} role="tree" className={className} {...props}>
            <ul>
                {data.map((item) => (
                    <li key={item.id}>
                        {item.children ? (
                            <TreeNode
                                item={item}
                                selectedItemId={selectedItemId}
                                expandedItemIds={expandedItemIds}
                                handleSelectChange={handleSelectChange}
                                defaultNodeIcon={defaultNodeIcon}
                                defaultLeafIcon={defaultLeafIcon}
                                handleDragStart={handleDragStart}
                                handleDrop={handleDrop}
                                draggedItem={draggedItem}
                            />
                        ) : (
                            <TreeLeaf
                                item={item}
                                selectedItemId={selectedItemId}
                                handleSelectChange={handleSelectChange}
                                defaultLeafIcon={defaultLeafIcon}
                                handleDragStart={handleDragStart}
                                handleDrop={handleDrop}
                                draggedItem={draggedItem}
                            />
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};
TreeItem.displayName = "TreeItem";

const TreeNode = ({
    item,
    handleSelectChange,
    expandedItemIds,
    selectedItemId,
    defaultNodeIcon,
    defaultLeafIcon,
    handleDragStart,
    handleDrop,
    draggedItem,
}: {
    item: TreeDataItem;
    handleSelectChange: (item: TreeDataItem | undefined) => void;
    expandedItemIds: string[];
    selectedItemId?: string;
    defaultNodeIcon?: React.ReactNode;
    defaultLeafIcon?: React.ReactNode;
    handleDragStart?: (item: TreeDataItem) => void;
    handleDrop?: (item: TreeDataItem) => void;
    draggedItem: TreeDataItem | null;
}) => {
    const [value, setValue] = React.useState(expandedItemIds.includes(item.id) ? [item.id] : []);
    const [isDragOver, setIsDragOver] = React.useState(false);

    const onDragStart = (e: React.DragEvent) => {
        if (!item.draggable) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData("text/plain", item.id);
        handleDragStart?.(item);
    };

    const onDragOver = (e: React.DragEvent) => {
        if (item.droppable !== false && draggedItem && draggedItem.id !== item.id) {
            e.preventDefault();
            setIsDragOver(true);
        }
    };

    const onDragLeave = () => {
        setIsDragOver(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        handleDrop?.(item);
    };

    return (
        <AccordionPrimitive.Root type="multiple" value={value} onValueChange={(s) => setValue(s)}>
            <AccordionPrimitive.Item value={item.id}>
                <AccordionTrigger
                    className={cn(
                        treeVariants(),
                        selectedItemId === item.id && selectedTreeVariants(),
                        isDragOver && dragOverVariants()
                    )}
                    onClick={() => {
                        handleSelectChange(item);
                        item.onClick?.();
                    }}
                    draggable={!!item.draggable}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                >
                    <TreeIcon
                        item={item}
                        isSelected={selectedItemId === item.id}
                        isOpen={value.includes(item.id)}
                        default={defaultNodeIcon}
                    />
                    <span className="text-sm truncate">{item.name}</span>
                    <TreeActions isSelected={selectedItemId === item.id}>
                        {item.actions}
                    </TreeActions>
                </AccordionTrigger>
                <AccordionContent className="ml-4 pl-1 border-l">
                    <TreeItem
                        data={item.children ? item.children : item}
                        selectedItemId={selectedItemId}
                        handleSelectChange={handleSelectChange}
                        expandedItemIds={expandedItemIds}
                        defaultLeafIcon={defaultLeafIcon}
                        defaultNodeIcon={defaultNodeIcon}
                        handleDragStart={handleDragStart}
                        handleDrop={handleDrop}
                        draggedItem={draggedItem}
                    />
                </AccordionContent>
            </AccordionPrimitive.Item>
        </AccordionPrimitive.Root>
    );
};

type TreeLeafProps = React.HTMLAttributes<HTMLDivElement> & {
    item: TreeDataItem;
    selectedItemId?: string;
    handleSelectChange: (item: TreeDataItem | undefined) => void;
    defaultLeafIcon?: React.ReactNode;
    handleDragStart?: (item: TreeDataItem) => void;
    handleDrop?: (item: TreeDataItem) => void;
    draggedItem: TreeDataItem | null;
    ref?: React.Ref<HTMLDivElement>;
};

const TreeLeaf: React.FC<TreeLeafProps> = ({
    className,
    item,
    selectedItemId,
    handleSelectChange,
    defaultLeafIcon,
    handleDragStart,
    handleDrop,
    draggedItem,
    ref,
    ...props
}) => {
    const [isDragOver, setIsDragOver] = React.useState(false);

    const onDragStart = (e: React.DragEvent) => {
        if (!item.draggable || item.disabled) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData("text/plain", item.id);
        handleDragStart?.(item);
    };

    const onDragOver = (e: React.DragEvent) => {
        if (
            item.droppable !== false &&
            !item.disabled &&
            draggedItem &&
            draggedItem.id !== item.id
        ) {
            e.preventDefault();
            setIsDragOver(true);
        }
    };

    const onDragLeave = () => {
        setIsDragOver(false);
    };

    const onDrop = (e: React.DragEvent) => {
        if (item.disabled) return;
        e.preventDefault();
        setIsDragOver(false);
        handleDrop?.(item);
    };

    return (
        <div
            ref={ref}
            className={cn(
                "ml-5 flex text-left items-center py-2 cursor-pointer before:right-1",
                treeVariants(),
                className,
                selectedItemId === item.id && selectedTreeVariants(),
                isDragOver && dragOverVariants(),
                item.disabled && "opacity-50 cursor-not-allowed pointer-events-none"
            )}
            onClick={() => {
                if (item.disabled) return;
                handleSelectChange(item);
                item.onClick?.();
            }}
            draggable={!!item.draggable && !item.disabled}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            {...props}
        >
            <TreeIcon
                item={item}
                isSelected={selectedItemId === item.id}
                default={defaultLeafIcon}
            />
            <span className="flex-grow text-sm truncate">{item.name}</span>
            <TreeActions isSelected={selectedItemId === item.id && !item.disabled}>
                {item.actions}
            </TreeActions>
        </div>
    );
};
TreeLeaf.displayName = "TreeLeaf";

function AccordionTrigger({
    className,
    children,
    ref,
    ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
    return (
        <AccordionPrimitive.Header>
            <AccordionPrimitive.Trigger
                ref={ref}
                className={cn(
                    "flex flex-1 w-full items-center py-2 transition-all first:[&[data-state=open]>svg]:rotate-90",
                    className
                )}
                {...props}
            >
                <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 text-accent-foreground/50 mr-1" />
                {children}
            </AccordionPrimitive.Trigger>
        </AccordionPrimitive.Header>
    );
}
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

function AccordionContent({
    className,
    children,
    ref,
    ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
    return (
        <AccordionPrimitive.Content
            ref={ref}
            className={cn(
                "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
                className
            )}
            {...props}
        >
            <div className="pb-1 pt-0">{children}</div>
        </AccordionPrimitive.Content>
    );
}
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

const TreeIcon = ({
    item,
    isOpen,
    isSelected,
    default: defaultIcon,
}: {
    item: TreeDataItem;
    isOpen?: boolean;
    isSelected?: boolean;
    default?: React.ReactNode;
}) => {
    if (isSelected && item.selectedIcon) {
        return item.selectedIcon;
    } else if (isOpen && item.openIcon) {
        return item.openIcon;
    } else if (item.icon) {
        return item.icon;
    }
    return defaultIcon || <></>;
};

const TreeActions = ({
    children,
    isSelected,
}: {
    children: React.ReactNode;
    isSelected: boolean;
}) => {
    return (
        <div className={cn(isSelected ? "block" : "hidden", "absolute right-3 group-hover:block")}>
            {children}
        </div>
    );
};

export { TreeView, type TreeDataItem };
