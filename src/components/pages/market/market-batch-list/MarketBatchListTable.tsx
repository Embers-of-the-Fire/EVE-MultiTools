import {
    type ColumnDef,
    type ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    type SortingState,
    useReactTable,
    type VisibilityState,
} from "@tanstack/react-table";
import { ArrowUpDown, ClipboardPlus, Filter, Info, SquareArrowUpRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { GenericImage } from "@/components/card/GenericCard";
import { FilterDropdown } from "@/components/common/FilterDropdown";
import { ExternalLink } from "@/components/Links";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useLanguage } from "@/hooks/useAppSettings";
import { useAsyncMemo } from "@/hooks/useAsyncMemo";
import { useLocalization } from "@/hooks/useLocalization";
import { type MarketRecord, useMarketCache } from "@/hooks/useMarketCache";
import { useSPARouter } from "@/hooks/useSPARouter";
import { useData } from "@/stores/dataStore";
import { getIconUrl, getTypeImageUrl } from "@/utils/image";
import { getMarketTypeLinks } from "@/utils/link";

export interface MarketBatchItemRecord {
    typeId: number;
    amount: number;
}

interface MarketBatchItemFullRecord extends MarketBatchItemRecord {
    typeName: string;
    groupName: string;
    groupId: number;
    metaGroupName: string | null;
    metaGroupIconUrl: string | null;
    iconUrl: string | null;
    price: MarketRecord;
}

const MarketBatchListTileAction: React.FC<{ typeId: number }> = ({ typeId }) => {
    const { getData } = useData();
    const { language } = useLanguage();
    const { t } = useTranslation();

    const { navigateToTypeDetail } = useSPARouter();

    const { isLoading, value: links } = useAsyncMemo(
        () =>
            getMarketTypeLinks(typeId, {
                getData,
                language,
                t,
            }),
        [typeId, getData, language, t]
    );

    if (isLoading || !links) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex space-x-2">
            <Button
                size="icon"
                variant="secondary"
                className="size-8"
                key="info-button"
                onClick={() => {
                    navigateToTypeDetail(typeId);
                }}
            >
                <Info size="32" />
            </Button>
            <DropdownMenu key="market-dropdown">
                <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="default" className="size-8" key="market-button">
                        <SquareArrowUpRight size="32" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-min">
                    {isLoading || !links ? (
                        <div className="px-4 py-2">Loading...</div>
                    ) : (
                        links.map((link) => (
                            <ExternalLink
                                key={link.url}
                                link={link.url}
                                className="w-full justify-start"
                            >
                                {link.name}
                            </ExternalLink>
                        ))
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

export interface MarketBatchListTableProps {
    records: MarketBatchItemRecord[];
}

export const MarketBatchListTable: React.FC<MarketBatchListTableProps> = ({ records }) => {
    const { getData } = useData();
    const { loc } = useLocalization();
    const { t } = useTranslation();
    const { navigate } = useSPARouter();

    const { getMarketRecord } = useMarketCache();

    const [isLoading, setIsLoading] = useState(true);
    const [fullRecords, setFullRecords] = useState<MarketBatchItemFullRecord[]>([]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: record.map is static.
    useEffect(() => {
        let isMounted = true;
        setIsLoading(true);

        (async () => {
            const rec = await Promise.all(
                records.map(async (record) => {
                    const typeData = await getData("getType", record.typeId);
                    const typeName = await loc(typeData.type_name_id);
                    const groupData = await getData("getGroup", typeData.group_id);
                    const groupName = await loc(groupData.group_name_id);
                    const metaGroup = typeData.meta_group_id
                        ? await getData("getMetaGroup", typeData.meta_group_id)
                        : null;
                    const metaGroupName = metaGroup ? await loc(metaGroup.name_id) : null;
                    const metaGroupIconUrl = metaGroup?.icon_id
                        ? await getIconUrl(metaGroup.icon_id)
                        : null;
                    const iconUrl = await getTypeImageUrl(typeData, groupData.category_id);
                    const price = await getMarketRecord(record.typeId);

                    return {
                        typeName,
                        groupName,
                        groupId: typeData.group_id,
                        metaGroupName,
                        metaGroupIconUrl,
                        iconUrl,
                        price,
                        ...record,
                    };
                })
            );
            if (isMounted) {
                setFullRecords(rec);
                setIsLoading(false);
            }
        })();

        return () => {
            isMounted = false;
        };
    }, [getData, loc]);

    const groupData = useMemo(() => {
        const set = new Set<number>();
        const out = [];
        for (const r of fullRecords) {
            if (!set.has(r.groupId)) {
                set.add(r.groupId);
                out.push({ id: r.groupId, name: r.groupName });
            }
        }
        return out;
    }, [fullRecords]);

    const [selectedGroups, setSelectedGroups] = useState<Set<number>>(new Set());
    const toggleGroupFilter = (groupId: number, filterSet: (set: Set<number>) => void) => {
        const newSet = new Set(selectedGroups);
        if (selectedGroups.has(groupId)) {
            newSet.delete(groupId);
        } else {
            newSet.add(groupId);
        }
        filterSet(newSet);
        setSelectedGroups(newSet);
    };
    const clearGroupFilter = (filterSet: (set: Set<number>) => void) => {
        filterSet(new Set());
        setSelectedGroups(new Set());
    };

    const columns: ColumnDef<MarketBatchItemFullRecord>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                />
            ),
            enableSorting: true,
            enableHiding: false,
            sortingFn: (rowA, rowB) => {
                const a = rowA.getIsSelected() ? 1 : 0;
                const b = rowB.getIsSelected() ? 1 : 0;
                return a - b;
            },
        },
        {
            accessorKey: "typeName",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    {t("market.batch_list.table.type_name.header")}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex items-center">
                    <GenericImage
                        alt={row.original.typeName}
                        iconUrl={row.original.iconUrl}
                        width={32}
                        height={32}
                        metaGroupIconUrl={row.original.metaGroupIconUrl}
                        metaGroupName={row.original.metaGroupName || undefined}
                        loading={false}
                    />
                    <span className="ml-2">{row.original.typeName}</span>
                </div>
            ),
            enableSorting: true,
            enableHiding: false,
            sortingFn: (rowA, rowB) => {
                const aId = rowA.original.typeId;
                const bId = rowB.original.typeId;
                return aId - bId;
            },
        },
        {
            accessorKey: "groupName",
            header: ({ column }) => (
                <div className="flex items-center">
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        {t("market.batch_list.table.group_name.header")}
                        <ArrowUpDown className="h-4 w-4 ml-2" />
                    </Button>
                    <FilterDropdown
                        items={groupData.map((d) => ({
                            id: d.id.toString(),
                            data: {
                                groupId: d.id,
                                groupName: d.name,
                            },
                            selected: selectedGroups.has(d.id),
                        }))}
                        getLabel={(data) => data.groupName}
                        onChange={(item) =>
                            toggleGroupFilter(item.data.groupId, column.setFilterValue)
                        }
                        onClearAll={() => clearGroupFilter(column.setFilterValue)}
                    >
                        <Button variant="ghost">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </FilterDropdown>
                </div>
            ),
            enableSorting: true,
            enableHiding: true,
            enableColumnFilter: true,
            sortingFn: (rowA, rowB) => {
                const a = rowA.original.groupId;
                const b = rowB.original.groupId;
                return a - b;
            },
            filterFn: (row, _, filterValue) => {
                if (filterValue.size === 0) return true;
                const groupId = row.original.groupId;
                return filterValue.has(groupId);
            },
        },
        {
            accessorKey: "amount",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    {t("market.batch_list.table.amount.header")}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            enableSorting: true,
            enableHiding: false,
            sortingFn: (rowA, rowB) => {
                const a = rowA.original.amount;
                const b = rowB.original.amount;
                return a - b;
            },
        },
        {
            id: "sell_single",
            accessorFn: (row) => row.price.sellMin,
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    {t("market.batch_list.table.sell_single.header")}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) =>
                row.original.price?.sellMin !== null ? (
                    <span>
                        {row.original.price.sellMin.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                        })}{" "}
                        ISK
                    </span>
                ) : (
                    <span className="text-muted-foreground">--</span>
                ),
            enableSorting: true,
            enableHiding: true,
            sortingFn: (rowA, rowB) => {
                const a = rowA.original.price.sellMin || 0;
                const b = rowB.original.price.sellMin || 0;
                return a - b;
            },
        },
        {
            id: "buy_single",
            accessorFn: (row) => row.price.buyMax || 0,
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    {t("market.batch_list.table.buy_single.header")}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) =>
                row.original.price?.buyMax !== null ? (
                    <span
                        className={
                            row.original.price.sellMin &&
                            row.original.price.buyMax * 2 < row.original.price.sellMin
                                ? "text-red-500"
                                : ""
                        }
                    >
                        {row.original.price.buyMax.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                        })}{" "}
                        ISK
                    </span>
                ) : (
                    <span className="text-muted-foreground">--</span>
                ),
            enableSorting: true,
            enableHiding: true,
            sortingFn: (rowA, rowB) => {
                const a = rowA.original.price.buyMax || 0;
                const b = rowB.original.price.buyMax || 0;
                return a - b;
            },
        },

        {
            id: "sell_total",
            accessorFn: (row) => (row.price.sellMin || 0) * row.amount,
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    {t("market.batch_list.table.sell_total.header")}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) =>
                row.original.price?.sellMin !== null ? (
                    <span>
                        {(row.original.price.sellMin * row.original.amount).toLocaleString(
                            undefined,
                            {
                                maximumFractionDigits: 2,
                            }
                        )}{" "}
                        ISK
                    </span>
                ) : (
                    <span className="text-muted-foreground">--</span>
                ),
            enableSorting: true,
            enableHiding: true,
            sortingFn: (rowA, rowB) => {
                const a = (rowA.original.price.sellMin || 0) * rowA.original.amount;
                const b = (rowB.original.price.sellMin || 0) * rowB.original.amount;
                return a - b;
            },
        },
        {
            id: "buy_total",
            accessorFn: (row) => (row.price.buyMax || 0) * row.amount,
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    {t("market.batch_list.table.buy_total.header")}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) =>
                row.original.price?.buyMax !== null ? (
                    <span
                        className={
                            row.original.price.sellMin &&
                            row.original.price.buyMax * 2 < row.original.price.sellMin
                                ? "text-red-500"
                                : ""
                        }
                    >
                        {(row.original.price.buyMax * row.original.amount).toLocaleString(
                            undefined,
                            {
                                maximumFractionDigits: 2,
                            }
                        )}{" "}
                        ISK
                    </span>
                ) : (
                    <span className="text-muted-foreground">--</span>
                ),
            enableSorting: true,
            enableHiding: true,
            sortingFn: (rowA, rowB) => {
                const a = (rowA.original.price.buyMax || 0) * rowA.original.amount;
                const b = (rowB.original.price.buyMax || 0) * rowB.original.amount;
                return a - b;
            },
        },
        {
            id: "actions",
            accessorKey: "typeId",
            header: t("market.batch_list.table.actions.header"),
            cell: ({ row }) => <MarketBatchListTileAction typeId={row.original.typeId} />,
            enableSorting: false,
            enableHiding: false,
        },
    ];

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

    const table = useReactTable({
        data: fullRecords,
        columns,
        enableSortingRemoval: true,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    });

    const priceSum = useMemo(() => {
        const sum = {
            full: {
                sell: 0,
                buy: 0,
                counts: 0,
            },
            selected: {
                sell: 0,
                buy: 0,
                counts: 0,
            },
        };

        const rows =
            rowSelection && Object.keys(rowSelection).length > 0
                ? table.getSelectedRowModel().flatRows.map((t) => t.original)
                : [];
        if (rows.length > 0) {
            for (const r of rows) {
                if (selectedGroups.size > 0 && !selectedGroups.has(r.groupId)) {
                    continue;
                }

                if (r.price.sellMin) {
                    sum.selected.sell += r.price.sellMin * r.amount;
                }
                if (r.price.buyMax) {
                    sum.selected.buy += r.price.buyMax * r.amount;
                }
                sum.selected.counts += r.amount;
            }
        }

        for (const r of fullRecords) {
            if (selectedGroups.size > 0 && !selectedGroups.has(r.groupId)) {
                continue;
            }

            if (r.price.sellMin) {
                sum.full.sell += r.price.sellMin * r.amount;
            }
            if (r.price.buyMax) {
                sum.full.buy += r.price.buyMax * r.amount;
            }
            sum.full.counts += r.amount;
        }

        return sum;
    }, [selectedGroups, fullRecords, rowSelection, table.getSelectedRowModel]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <>
            <div className="flex w-full flex-row">
                <div className="ml-2 flex flex-col space-y-1 text-2xl">
                    <p>
                        {t("market.batch_list.table.sell_summary")}
                        <span className="text-green-500">
                            {priceSum.full.sell.toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                            })}
                        </span>
                    </p>
                    <p>
                        {t("market.batch_list.table.buy_summary")}
                        <span className="text-red-500">
                            {priceSum.full.buy.toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                            })}
                        </span>
                    </p>
                    <p className="text-lg">
                        {t("market.batch_list.table.count_summary", {
                            counts: priceSum.full.counts.toLocaleString(),
                        })}
                    </p>
                </div>
                {priceSum.selected.counts > 0 && (
                    <div className="ml-4 flex flex-col space-y-1 text-2xl">
                        <p>
                            {t("market.batch_list.table.selected_sell_summary")}
                            <span className="text-green-500">
                                {priceSum.selected.sell.toLocaleString(undefined, {
                                    maximumFractionDigits: 2,
                                })}
                            </span>
                        </p>
                        <p>
                            {t("market.batch_list.table.selected_buy_summary")}
                            <span className="text-red-500">
                                {priceSum.selected.buy.toLocaleString(undefined, {
                                    maximumFractionDigits: 2,
                                })}
                            </span>
                        </p>
                        <p className="text-lg">
                            {t("market.batch_list.table.selected_count_summary", {
                                counts: priceSum.selected.counts.toLocaleString(),
                            })}
                        </p>
                    </div>
                )}
                <div className="ml-12">
                    <Button
                        variant="default"
                        size="icon"
                        onClick={() => navigate("/market/batch-list")}
                    >
                        <ClipboardPlus />
                    </Button>
                </div>
            </div>
            <div className="w-full">
                <Table className="my-2">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef.header,
                                                  header.getContext()
                                              )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    {t("common.no_results")}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </>
    );
};
