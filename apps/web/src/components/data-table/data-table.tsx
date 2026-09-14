"use client";

import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { Button } from "@portfolio/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@portfolio/ui/components/dropdown-menu";
import { Input } from "@portfolio/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@portfolio/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@portfolio/ui/components/table";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDownIcon, ListFilterIcon, SearchIcon, XIcon } from "lucide-react";
import * as React from "react";

const FACET_HEADERS = [
  "status",
  "type",
  "category",
  "account",
  "institution",
  "source",
  "relationship",
  "priority",
  "period",
  "year",
  "taxpayer",
  "assessment",
  "return",
  "evidence",
  "grade",
  "phase",
  "owner",
  "currency",
  "liquidity",
  "activity",
];

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Search…",
  pageSize = 10,
  emptyMessage = "No results.",
  toolbar,
}: {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  pageSize?: number;
  emptyMessage?: string;
  toolbar?: React.ReactNode;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const normalizedColumns = React.useMemo<ColumnDef<TData, TValue>[]>(() => {
    const facetedFilter: FilterFn<TData> = (row, columnId, value) =>
      !Array.isArray(value) || value.length === 0 || value.includes(String(row.getValue(columnId)));
    return columns.map(
      (column) =>
        ({ ...column, filterFn: column.filterFn ?? facetedFilter }) as ColumnDef<TData, TValue>,
    );
  }, [columns]);
  const table = useReactTable({
    data,
    columns: normalizedColumns,
    state: { sorting, columnFilters, columnVisibility, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  const hideableColumns = table.getAllColumns().filter((column) => column.getCanHide());
  const facetColumns = table.getAllLeafColumns().flatMap((column) => {
    const header = column.columnDef.header;
    const label = typeof header === "string" ? header : column.id;
    if (!FACET_HEADERS.some((candidate) => label.toLocaleLowerCase().includes(candidate)))
      return [];
    const values = Array.from(column.getFacetedUniqueValues().keys()).filter(
      (value): value is string => typeof value === "string" && value.length > 0 && value !== "—",
    );
    return values.length >= 2 && values.length <= 12
      ? [
          {
            column,
            label,
            values: values.toSorted((a, b) => a.localeCompare(b, undefined, { numeric: true })),
          },
        ]
      : [];
  });
  const filteredCount = table.getFilteredRowModel().rows.length;
  const isFiltered = globalFilter.trim().length > 0 || columnFilters.length > 0;

  return (
    <div className="min-w-0">
      <div className="flex flex-col gap-2 border-b px-3 py-3 sm:flex-row sm:items-center sm:px-4">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 pl-8"
            aria-label={searchPlaceholder}
          />
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {facetColumns.map(({ column, label, values }) => {
            const selected = new Set((column.getFilterValue() as string[] | undefined) ?? []);
            return (
              <DropdownMenu key={column.id}>
                <DropdownMenuTrigger
                  render={<Button variant="outline" size="sm" className="h-8 border-dashed" />}
                >
                  <ListFilterIcon className="size-3.5" />
                  {label}
                  {selected.size > 0 ? (
                    <span className="rounded-sm bg-secondary px-1.5 py-0.5 text-[10px] tabular-nums">
                      {selected.size}
                    </span>
                  ) : null}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-52">
                  {values.map((value) => (
                    <DropdownMenuCheckboxItem
                      key={value}
                      checked={selected.has(value)}
                      onCheckedChange={(checked) => {
                        if (checked) selected.add(value);
                        else selected.delete(value);
                        column.setFilterValue(selected.size > 0 ? Array.from(selected) : undefined);
                        table.setPageIndex(0);
                      }}
                    >
                      <span className="max-w-56 truncate" title={value}>
                        {value}
                      </span>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
          {isFiltered ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => {
                setGlobalFilter("");
                table.resetColumnFilters();
                table.setPageIndex(0);
              }}
            >
              Reset <XIcon className="size-3.5" />
            </Button>
          ) : null}
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          {toolbar}
          {hideableColumns.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="outline" size="sm" className="ml-auto h-8" />}
              >
                Columns <ChevronDownIcon className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-44">
                {hideableColumns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(checked) => column.toggleVisibility(Boolean(checked))}
                  >
                    {typeof column.columnDef.header === "string"
                      ? column.columnDef.header
                      : column.id}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder ? null : typeof header.column.columnDef.header ===
                      "string" ? (
                      <DataTableColumnHeader
                        column={header.column}
                        title={header.column.columnDef.header}
                      />
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-28 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-2 border-t px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <p className="text-muted-foreground">
          {filteredCount.toLocaleString()} {filteredCount === 1 ? "row" : "rows"}
        </p>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:inline">Rows per page</span>
          <Select
            value={String(table.getState().pagination.pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger size="sm" className="h-8 w-[70px]" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <span className="min-w-20 text-center text-xs text-muted-foreground">
            {table.getPageCount() === 0 ? 0 : table.getState().pagination.pageIndex + 1} /{" "}
            {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
