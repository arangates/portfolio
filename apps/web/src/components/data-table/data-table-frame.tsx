"use client";

import { Button } from "@portfolio/ui/components/button";
import { Input } from "@portfolio/ui/components/input";
import { SearchIcon } from "lucide-react";
import * as React from "react";

export function DataTableFrame({
  children,
  pageSize = 10,
}: {
  children: React.ReactNode;
  pageSize?: number;
}) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(0);
  const [rowCount, setRowCount] = React.useState(0);
  const [filteredCount, setFilteredCount] = React.useState(0);
  const [sortColumn, setSortColumn] = React.useState<number | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");

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
    const matchingRows = rows.filter(
      (row) => !normalizedQuery || row.textContent?.toLocaleLowerCase().includes(normalizedQuery),
    );
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
  }, [children, page, pageSize, query, sortColumn, sortDirection]);

  const pageCount = Math.max(1, Math.ceil(filteredCount / pageSize));

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
        <span className="text-xs text-muted-foreground sm:ml-auto">
          {filteredCount} of {rowCount} rows
        </span>
      </div>
      <div className="overflow-x-auto [&_thead]:bg-muted/40 [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap">
        {children}
      </div>
      {pageCount > 1 ? (
        <div className="flex items-center justify-between gap-3 border-t px-3 py-3 sm:justify-end sm:px-4">
          <span className="mr-auto text-xs text-muted-foreground sm:mr-2">
            Page {page + 1} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={page === 0}
            onClick={() => setPage((value) => Math.max(0, value - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={page >= pageCount - 1}
            onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
