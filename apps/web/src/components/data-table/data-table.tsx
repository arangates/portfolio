"use client";

import { Button } from "@portfolio/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@portfolio/ui/components/dropdown-menu";
import { Input } from "@portfolio/ui/components/input";
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
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDownIcon, SearchIcon } from "lucide-react";
import * as React from "react";

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
  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  const hideableColumns = table.getAllColumns().filter((column) => column.getCanHide());
  const filteredCount = table.getFilteredRowModel().rows.length;

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
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
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
