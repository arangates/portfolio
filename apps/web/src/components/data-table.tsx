"use client";

import { formatCurrency } from "@/lib/format";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { DataTable as ShadcnDataTable } from "@/components/data-table/data-table";
import { Badge } from "@portfolio/ui/components/badge";
import type { ColumnDef } from "@tanstack/react-table";

export type AssetRow = {
  key: string;
  name: string;
  category: string;
  nativeValue: number;
  currency: string;
  baseValue: number | null;
  isLiquid: boolean;
  risk: string;
  location: string;
};

export function DataTable({ assets, baseCurrency }: { assets: AssetRow[]; baseCurrency: string }) {
  const columns: ColumnDef<AssetRow>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Asset" />,
      cell: ({ row }) => (
        <div className="min-w-44">
          <div className="font-medium">{row.original.name}</div>
          <div className="text-xs text-muted-foreground">{row.original.category}</div>
        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => (
        <div className="max-w-64 truncate text-muted-foreground">{row.original.location}</div>
      ),
    },
    { accessorKey: "category", header: "Category" },
    {
      accessorKey: "isLiquid",
      header: "Liquidity",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.isLiquid ? "Liquid" : "Long term"}</Badge>
      ),
    },
    {
      accessorKey: "nativeValue",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Native value" className="ml-auto" />
      ),
      cell: ({ row }) => (
        <div className="text-right tabular-nums">
          {formatCurrency(row.original.nativeValue, row.original.currency)}
        </div>
      ),
    },
    {
      accessorKey: "baseValue",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={`Value in ${baseCurrency}`}
          className="ml-auto"
        />
      ),
      cell: ({ row }) => (
        <div className="text-right tabular-nums">
          {row.original.baseValue === null
            ? "FX rate needed"
            : formatCurrency(row.original.baseValue, baseCurrency)}
        </div>
      ),
    },
  ];
  return (
    <div className="px-4 lg:px-6">
      <div className="overflow-hidden rounded-lg border bg-card shadow-xs">
        <ShadcnDataTable
          columns={columns}
          data={assets}
          searchPlaceholder="Search assets…"
          pageSize={12}
        />
      </div>
    </div>
  );
}
