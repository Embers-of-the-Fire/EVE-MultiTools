import { CheckIcon } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

export type FilterDropdownItem<T> = {
    id: string;
    data: T;
    selected: boolean;
};

export type FilterDropdownProps<T> = {
    getLabel: (item: T) => string;
    items: FilterDropdownItem<T>[];
    onChange?: (selected: FilterDropdownItem<T>) => void;
    onClearAll?: () => void;
    placeholder?: string;
    children: React.ReactNode;
};

export function FilterDropdown<T>({
    getLabel,
    items,
    onChange,
    onClearAll,
    placeholder,
    children,
}: FilterDropdownProps<T>) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const filteredItems = useMemo(() => {
        if (!query) return items;
        return items.filter((item) =>
            getLabel(item.data).toLowerCase().includes(query.toLowerCase())
        );
    }, [query, items, getLabel]);

    const handleSelect = (item: FilterDropdownItem<T>) => {
        onChange?.(item);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent className="w-56 p-0">
                <Command>
                    <CommandInput
                        placeholder={placeholder}
                        value={query}
                        onValueChange={setQuery}
                        onClear={() => setQuery("")}
                    />
                    <CommandList>
                        {onClearAll && (
                            <>
                                <CommandGroup>
                                    <CommandItem className="text-center">
                                        <span
                                            className="w-full text-center"
                                            onClick={() => onClearAll?.()}
                                        >
                                            {t("common.clear_all")}
                                        </span>
                                    </CommandItem>
                                </CommandGroup>
                                <CommandSeparator />
                            </>
                        )}
                        <CommandGroup>
                            <CommandEmpty>{t("common.no_results")}</CommandEmpty>
                            {filteredItems.map((item) => (
                                <CommandItem key={item.id} onSelect={() => handleSelect(item)}>
                                    <CheckIcon
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            item.selected ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {getLabel(item.data)}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
