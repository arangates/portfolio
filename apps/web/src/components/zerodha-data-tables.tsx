"use client";

import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { DataTable } from "@/components/data-table/data-table";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@portfolio/ui/components/badge";
import type { ColumnDef } from "@tanstack/react-table";

type Holding = {
  isin: string;
  name: string;
  category: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnl: number;
};

export function HoldingsDataTable({ data }: { data: Holding[] }) {
  const columns: ColumnDef<Holding>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Instrument" />,
      cell: ({ row }) => (
        <div className="min-w-52">
          <div className="font-medium">{row.original.name}</div>
          <div className="text-xs text-muted-foreground">{row.original.isin}</div>
        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => <Badge variant="outline">{row.original.category}</Badge>,
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Quantity" className="ml-auto" />
      ),
      cell: ({ row }) => (
        <div className="text-right tabular-nums">
          {row.original.quantity.toLocaleString("en-IN")}
        </div>
      ),
    },
    {
      accessorKey: "averagePrice",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Average" className="ml-auto" />
      ),
      cell: ({ row }) => <Money value={row.original.averagePrice} />,
    },
    {
      accessorKey: "currentPrice",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Price" className="ml-auto" />
      ),
      cell: ({ row }) => <Money value={row.original.currentPrice} />,
    },
    {
      accessorKey: "marketValue",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Value" className="ml-auto" />
      ),
      cell: ({ row }) => <Money value={row.original.marketValue} />,
    },
    {
      accessorKey: "unrealizedPnl",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="P&L" className="ml-auto" />
      ),
      cell: ({ row }) => <Money value={row.original.unrealizedPnl} />,
    },
  ];
  return (
    <DataTable columns={columns} data={data} searchPlaceholder="Search holdings…" pageSize={12} />
  );
}

type FinancialYear = {
  financialYear: string;
  buys: number;
  sells: number;
  netInvested: number;
  trades: number;
  activeMonths: number;
};

export function FinancialYearsDataTable({ data }: { data: FinancialYear[] }) {
  const columns: ColumnDef<FinancialYear>[] = [
    {
      accessorKey: "financialYear",
      header: "Period",
      cell: ({ row }) => <span className="font-medium">{row.original.financialYear}</span>,
      enableHiding: false,
    },
    {
      accessorKey: "buys",
      header: "Purchases",
      cell: ({ row }) => <Money value={row.original.buys} />,
    },
    {
      accessorKey: "sells",
      header: "Redemptions",
      cell: ({ row }) => <Money value={row.original.sells} />,
    },
    {
      accessorKey: "netInvested",
      header: "Net invested",
      cell: ({ row }) => <Money value={row.original.netInvested} />,
    },
    {
      accessorKey: "trades",
      header: "Trades",
      cell: ({ row }) => <NumberCell value={row.original.trades} />,
    },
    {
      accessorKey: "activeMonths",
      header: "Active months",
      cell: ({ row }) => <NumberCell value={row.original.activeMonths} />,
    },
  ];
  return (
    <DataTable columns={columns} data={data} searchPlaceholder="Search periods…" pageSize={8} />
  );
}

type TradebookImport = {
  id: string;
  fileName: string;
  statementDate: string | null;
  rowCount: number;
  insertedRows: number;
  skippedRows: number;
};

export function TradebookImportsDataTable({ data }: { data: TradebookImport[] }) {
  const columns: ColumnDef<TradebookImport>[] = [
    {
      accessorKey: "fileName",
      header: "File",
      cell: ({ row }) => (
        <div className="max-w-64 truncate font-medium">{row.original.fileName}</div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "statementDate",
      header: "Coverage end",
      cell: ({ row }) => row.original.statementDate ?? "—",
    },
    {
      accessorKey: "rowCount",
      header: "Rows",
      cell: ({ row }) => <NumberCell value={row.original.rowCount} />,
    },
    {
      accessorKey: "insertedRows",
      header: "New",
      cell: ({ row }) => <NumberCell value={row.original.insertedRows} />,
    },
    {
      accessorKey: "skippedRows",
      header: "Overlapping",
      cell: ({ row }) => <NumberCell value={row.original.skippedRows} />,
    },
  ];
  return (
    <DataTable
      columns={columns}
      data={data}
      searchPlaceholder="Search import files…"
      pageSize={8}
    />
  );
}

type FundActivity = {
  isin: string;
  name: string;
  buyAmount: number;
  sellAmount: number;
  averageBuyPrice: number | null;
  buyTrades: number;
  sellTrades: number;
  historyComplete: boolean;
  held: boolean;
};

export function FundActivityDataTable({ data }: { data: FundActivity[] }) {
  const columns: ColumnDef<FundActivity>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Fund" />,
      cell: ({ row }) => (
        <div className="min-w-56">
          <div className="font-medium">{row.original.name}</div>
          <div className="text-xs text-muted-foreground">{row.original.isin}</div>
        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "held",
      header: "Current",
      cell: ({ row }) => <Badge variant="outline">{row.original.held ? "Held" : "Not held"}</Badge>,
    },
    {
      accessorKey: "buyAmount",
      header: "Purchases",
      cell: ({ row }) => <Money value={row.original.buyAmount} />,
    },
    {
      accessorKey: "sellAmount",
      header: "Redemptions",
      cell: ({ row }) => <Money value={row.original.sellAmount} />,
    },
    {
      accessorKey: "averageBuyPrice",
      header: "Average buy NAV",
      cell: ({ row }) =>
        row.original.averageBuyPrice == null ? (
          <div className="text-right">—</div>
        ) : (
          <Money value={row.original.averageBuyPrice} />
        ),
    },
    {
      id: "trades",
      accessorFn: (row) => row.buyTrades + row.sellTrades,
      header: "Trades",
      cell: ({ row }) => <NumberCell value={row.original.buyTrades + row.original.sellTrades} />,
    },
    {
      accessorKey: "historyComplete",
      header: "History quality",
      cell: ({ row }) => (
        <Badge variant={row.original.historyComplete ? "secondary" : "outline"}>
          {row.original.historyComplete ? "Complete" : "Earlier buys needed"}
        </Badge>
      ),
    },
  ];
  return (
    <DataTable
      columns={columns}
      data={data}
      searchPlaceholder="Search funds or ISIN…"
      pageSize={12}
    />
  );
}

function Money({ value }: { value: number }) {
  return <div className="text-right tabular-nums">{formatCurrency(value, "INR")}</div>;
}

function NumberCell({ value }: { value: number }) {
  return <div className="text-right tabular-nums">{value.toLocaleString("en-IN")}</div>;
}
