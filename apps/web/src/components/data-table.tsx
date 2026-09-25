"use client";
import { useAmountFormat } from "@/components/amount-preferences";

import { FreshnessBadge } from "./freshness-badge";
import { RecordDetailsDrawer } from "./record-details-drawer";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { DataTable as ShadcnDataTable } from "@/components/data-table/data-table";
import { formatDate, formatPercent } from "@/lib/format";
import type { compareSnapshots } from "@portfolio/api/insight-calculations";
import { sourceFreshness } from "@portfolio/api/insight-calculations";
import { Badge } from "@portfolio/ui/components/badge";
import type { ColumnDef } from "@tanstack/react-table";

type SnapshotChange = ReturnType<typeof compareSnapshots>[number];

export type AssetRow = {
  asOf?: string | Date | null;
  key: string;
  name: string;
  category: string;
  nativeValue: number;
  currency: string;
  baseValue: number | null;
  liquidBaseValue?: number | null;
  isLiquid: boolean;
  risk: string;
  location: string;
  change?: SnapshotChange | null;
};

export function DataTable({
  assets,
  baseCurrency,
  netWorth,
  categoryTotals,
}: {
  assets: AssetRow[];
  baseCurrency: string;
  netWorth: number;
  categoryTotals: Record<string, number>;
}) {
  const { formatCurrency } = useAmountFormat();
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
      accessorKey: "asOf",
      header: "Source freshness",
      cell: ({ row }) => (
        <FreshnessBadge
          asOf={row.original.asOf}
          maxAgeDays={row.original.category === "Real estate" ? 365 : 31}
        />
      ),
    },
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
    {
      id: "details",
      header: () => <span className="sr-only">Details</span>,
      cell: ({ row }) => {
        const asset = row.original;
        const freshness = sourceFreshness(asset.asOf, asset.category === "Real estate" ? 365 : 31);
        const categoryTotal = categoryTotals[asset.category] ?? 0;
        const hasPartialLiquidity =
          asset.liquidBaseValue !== undefined &&
          asset.liquidBaseValue !== null &&
          asset.baseValue !== null &&
          asset.liquidBaseValue < asset.baseValue;
        const change = asset.change;

        return (
          <RecordDetailsDrawer
            title={asset.name}
            description={`${asset.category} · ${asset.location}`}
            insights={[
              {
                label: "Portfolio weight",
                value:
                  asset.baseValue === null
                    ? "Unavailable"
                    : formatPercent(netWorth === 0 ? 0 : asset.baseValue / netWorth, 1),
                detail:
                  asset.baseValue === null
                    ? "A stored FX rate is needed to include this asset in totals."
                    : "Share of current net worth.",
              },
              {
                label: "Category share",
                value:
                  asset.baseValue === null
                    ? "Unavailable"
                    : formatPercent(categoryTotal === 0 ? 0 : asset.baseValue / categoryTotal, 1),
                detail: `Share of total ${asset.category} value.`,
              },
              {
                label: "Change since previous snapshot",
                value:
                  change && change.delta !== null
                    ? `${change.delta > 0 ? "+" : ""}${formatCurrency(change.delta, asset.currency)}`
                    : "No comparison",
                detail:
                  change && change.percent !== null
                    ? `${formatPercent(change.percent, 2)} versus the prior dated record`
                    : (change?.reason ?? "A previous dated snapshot is needed."),
              },
              {
                label: "Source freshness",
                value: freshness.label,
                detail: asset.asOf
                  ? `Recorded as of ${formatDate(asset.asOf)}`
                  : "No source date recorded.",
              },
            ]}
            breakdown={
              hasPartialLiquidity && asset.baseValue !== null
                ? {
                    title: "Liquidity composition",
                    description:
                      "How much of this asset's value is classified as readily sellable.",
                    segments: [
                      {
                        label: "Liquid portion",
                        amount: asset.liquidBaseValue ?? 0,
                        value: formatCurrency(asset.liquidBaseValue ?? 0, baseCurrency),
                      },
                      {
                        label: "Long-term portion",
                        amount: asset.baseValue - (asset.liquidBaseValue ?? 0),
                        value: formatCurrency(
                          asset.baseValue - (asset.liquidBaseValue ?? 0),
                          baseCurrency,
                        ),
                      },
                    ],
                  }
                : undefined
            }
            items={[
              { label: "Category", value: asset.category },
              { label: "Location", value: asset.location },
              { label: "Risk level", value: asset.risk },
              { label: "Native value", value: formatCurrency(asset.nativeValue, asset.currency) },
              {
                label: `Value in ${baseCurrency}`,
                value:
                  asset.baseValue === null
                    ? "FX rate needed"
                    : formatCurrency(asset.baseValue, baseCurrency),
              },
              { label: "Liquidity", value: asset.isLiquid ? "Liquid" : "Long term" },
            ]}
          />
        );
      },
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
