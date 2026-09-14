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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@portfolio/ui/components/select";
import { ListFilterIcon, SearchIcon, XIcon } from "lucide-react";
import * as React from "react";

type Facet = { column: number; label: string; values: string[] };

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

export function DataTableFrame({
  children,
  pageSize: initialPageSize = 10,
}: {
  children: React.ReactNode;
  pageSize?: number;
}) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(initialPageSize);
  const [rowCount, setRowCount] = React.useState(0);
  const [filteredCount, setFilteredCount] = React.useState(0);
  const [facets, setFacets] = React.useState<Facet[]>([]);
  const [facetFilters, setFacetFilters] = React.useState<Record<number, string[]>>({});
  const [sortColumn, setSortColumn] = React.useState<number | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const headers = Array.from(root.querySelectorAll<HTMLTableCellElement>("thead th"));
    const rows = Array.from(root.querySelectorAll<HTMLTableRowElement>("tbody > tr"));
    const discovered = headers.flatMap((header, column) => {
      const label = header.textContent?.trim() ?? "";
      if (!FACET_HEADERS.some((candidate) => label.toLocaleLowerCase().includes(candidate))) {
        return [];
      }
      const values = Array.from(
        new Set(
          rows
            .map((row) => row.cells[column]?.textContent?.trim() ?? "")
            .filter((value) => value && value !== "—"),
        ),
      ).toSorted((left, right) => left.localeCompare(right, undefined, { numeric: true }));
      return values.length >= 2 && values.length <= 12 ? [{ column, label, values }] : [];
    });
    setFacets(discovered);
  }, [children]);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const headers = Array.from(root.querySelectorAll<HTMLTableCellElement>("thead th"));
    const rows = Array.from(root.querySelectorAll<HTMLTableRowElement>("tbody > tr"));
    const originalOrder = new Map<HTMLTableRowElement, number>();
    rows.forEach((row, index) => originalOrder.set(row, index));
    const headerCleanups = headers.map((header, index) => {
      const indicator = document.createElement("span");
      indicator.setAttribute("aria-hidden", "true");
      indicator.className = "text-muted-foreground";
      header.append(indicator);
      header.title = "Click to sort";
      header.classList.add("cursor-pointer", "select-none");
      header.setAttribute(
        "aria-sort",
        sortColumn === index ? (sortDirection === "asc" ? "ascending" : "descending") : "none",
      );
      indicator.textContent = sortColumn === index ? (sortDirection === "asc" ? " ↑" : " ↓") : "";

      const onClick = () => {
        if (sortColumn === index) {
          setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
        } else {
          setSortColumn(index);
          setSortDirection("asc");
        }
      };
      header.addEventListener("click", onClick);

      return () => {
        header.removeEventListener("click", onClick);
        indicator.remove();
        header.removeAttribute("aria-sort");
        header.removeAttribute("title");
        header.classList.remove("cursor-pointer", "select-none");
      };
    });

    setRowCount(rows.length);
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const matchingRows = rows.filter((row) => {
      if (normalizedQuery && !row.textContent?.toLocaleLowerCase().includes(normalizedQuery)) {
        return false;
      }
      return Object.entries(facetFilters).every(([column, selected]) => {
        if (selected.length === 0) return true;
        const value = row.cells[Number(column)]?.textContent?.trim() ?? "";
        return selected.includes(value);
      });
    });
    const sortedRows = [...matchingRows].sort((left, right) => {
      if (sortColumn === null) return originalOrder.get(left)! - originalOrder.get(right)!;

      const leftValue = left.cells[sortColumn]?.textContent?.trim().toLocaleLowerCase() ?? "";
      const rightValue = right.cells[sortColumn]?.textContent?.trim().toLocaleLowerCase() ?? "";
      const leftNumber = Number(leftValue.replace(/[^\d.-]/g, ""));
      const rightNumber = Number(rightValue.replace(/[^\d.-]/g, ""));
      const comparison =
        Number.isNaN(leftNumber) || Number.isNaN(rightNumber)
          ? leftValue.localeCompare(rightValue, undefined, { numeric: true })
          : leftNumber - rightNumber;
      return sortDirection === "asc" ? comparison : -comparison;
    });

    setFilteredCount(matchingRows.length);
    const pageCount = Math.max(1, Math.ceil(matchingRows.length / pageSize));
    const safePage = Math.min(page, pageCount - 1);
    if (safePage !== page) setPage(safePage);
    const visible = new Set(sortedRows.slice(safePage * pageSize, (safePage + 1) * pageSize));
    const body = root.querySelector("tbody");
    for (const row of sortedRows) body?.append(row);
    for (const row of rows) row.hidden = !visible.has(row);

    return () => {
      for (const cleanup of headerCleanups) cleanup();
      for (const row of rows) row.hidden = false;
    };
  }, [children, facetFilters, page, pageSize, query, sortColumn, sortDirection]);

  const pageCount = Math.max(1, Math.ceil(filteredCount / pageSize));
  const isFiltered =
    query.trim().length > 0 || Object.values(facetFilters).some((values) => values.length > 0);

  function toggleFacet(column: number, value: string, checked: boolean) {
    setFacetFilters((current) => {
      const selected = current[column] ?? [];
      const next = checked
        ? Array.from(new Set([...selected, value]))
        : selected.filter((item) => item !== value);
      return { ...current, [column]: next };
    });
    setPage(0);
  }

  function resetFilters() {
    setQuery("");
    setFacetFilters({});
    setPage(0);
  }

  return (
    <div ref={rootRef} className="min-w-0">
      <div className="flex flex-col gap-2 border-b px-3 py-3 sm:flex-row sm:items-center sm:px-4">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
            placeholder="Search all columns…"
            className="h-8 pl-8"
            aria-label="Search all table columns"
          />
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {facets.map((facet) => {
            const selected = facetFilters[facet.column] ?? [];
            return (
              <DropdownMenu key={`${facet.column}-${facet.label}`}>
                <DropdownMenuTrigger
                  render={<Button variant="outline" size="sm" className="h-8 border-dashed" />}
                >
                  <ListFilterIcon className="size-3.5" />
                  {facet.label}
                  {selected.length > 0 ? (
                    <span className="rounded-sm bg-secondary px-1.5 py-0.5 text-[10px] tabular-nums">
                      {selected.length}
                    </span>
                  ) : null}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-52">
                  {facet.values.map((value) => (
                    <DropdownMenuCheckboxItem
                      key={value}
                      checked={selected.includes(value)}
                      onCheckedChange={(checked) =>
                        toggleFacet(facet.column, value, Boolean(checked))
                      }
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
            <Button variant="ghost" size="sm" className="h-8" onClick={resetFilters}>
              Reset <XIcon className="size-3.5" />
            </Button>
          ) : null}
        </div>
        <span className="whitespace-nowrap text-xs text-muted-foreground sm:ml-auto">
          {filteredCount} of {rowCount} rows
        </span>
      </div>
      <div className="overflow-x-auto [&_thead]:bg-muted/40 [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap">
        {children}
      </div>
      {rowCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-3 py-3 sm:justify-end sm:px-4">
          <span className="mr-auto text-xs text-muted-foreground sm:mr-2">
            Page {page + 1} of {pageCount}
          </span>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">Rows per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPage(0);
              }}
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
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={pageCount <= 1 || page === 0}
            onClick={() => setPage((value) => Math.max(0, value - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={pageCount <= 1 || page >= pageCount - 1}
            onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
