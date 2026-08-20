"use client";

import { Button } from "@portfolio/ui/components/button";
import type { Column } from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react";

export function DataTableColumnHeader<TData>({
  column,
  title,
  className,
}: {
  column: Column<TData>;
  title: string;
  className?: string;
}) {
  if (!column.getCanSort()) return <span className={className}>{title}</span>;
  const sorted = column.getIsSorted();
  return (
    <Button
      variant="ghost"
      size="sm"
      className={`-ml-3 h-8 ${className ?? ""}`}
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {title}
      {sorted === "desc" ? (
        <ArrowDownIcon className="size-3.5" />
      ) : sorted === "asc" ? (
        <ArrowUpIcon className="size-3.5" />
      ) : (
        <ArrowUpDownIcon className="size-3.5 text-muted-foreground" />
      )}
    </Button>
  );
}
