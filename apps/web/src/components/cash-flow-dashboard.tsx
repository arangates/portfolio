"use client";

import { AnalyticsChartCard } from "@/components/analytics-chart-card";
import { useAmountFormat } from "@/components/amount-preferences";
import { DataTable } from "@/components/data-table/data-table";
import { appFetch } from "@/lib/app-activity";
import { formatDate, formatPercent } from "@/lib/format";
import { BANK_CATEGORIES } from "@portfolio/api/bank-statement-parser";
import { Badge } from "@portfolio/ui/components/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@portfolio/ui/components/tabs";
import {
  EChartsVisualization,
  type EChartsVisualizationOption,
} from "@portfolio/ui/components/echarts-visualization";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Dashboard = Awaited<
  ReturnType<typeof import("@portfolio/api/cash-flow-queries").getCashFlowDashboard>
>;
type Transaction = Dashboard["transactions"][number];
const label = (value: string) =>
  value
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");

export function CashFlowDashboard({
  data,
  scope = "all",
}: {
  data: Dashboard;
  scope?: "all" | "personal" | "joint";
}) {
  const { formatCurrency } = useAmountFormat();
  const router = useRouter();
  const [saving, setSaving] = useState<string | null>(null);
  const [timeBin, setTimeBin] = useState<"month" | "quarter" | "year">("month");
  const binnedMonthly = useMemo(() => {
    if (timeBin === "month") return data.monthly;
    const bins = new Map<string, (typeof data.monthly)[number]>();
    for (const row of data.monthly) {
      const [year, month = "01"] = row.month.split("-");
      const key = timeBin === "year" ? year : `${year} Q${Math.floor((Number(month) - 1) / 3) + 1}`;
      const current = bins.get(key);
      bins.set(key, {
        ...row,
        month: key,
        income: (current?.income ?? 0) + row.income,
        spending: (current?.spending ?? 0) + row.spending,
        invested: (current?.invested ?? 0) + row.invested,
      });
    }
    return [...bins.values()];
  }, [data.monthly, timeBin]);
  const axis = {
    axisLine: { lineStyle: { color: "#52525b" } },
    axisLabel: { color: "#a1a1aa" },
    splitLine: { lineStyle: { color: "rgba(113,113,122,.2)" } },
  };
  const monthlyOption = useMemo<EChartsVisualizationOption>(() => {
    const peakIndex = binnedMonthly.reduce(
      (best, row, index, rows) =>
        row.income + row.spending + row.invested >
        rows[best].income + rows[best].spending + rows[best].invested
          ? index
          : best,
      0,
    );
    const seriesData = (key: "income" | "spending" | "invested") =>
      binnedMonthly.map((row, index) => ({
        value: row[key],
        itemStyle: { opacity: index === peakIndex ? 1 : 0.45 },
      }));
    return {
      tooltip: {
        trigger: "axis",
        valueFormatter: (value: unknown) => formatCurrency(Number(value), "EUR"),
      },
      legend: { bottom: 0, textStyle: { color: "#a1a1aa" } },
      grid: { left: 12, right: 14, top: 20, bottom: 44, containLabel: true },
      xAxis: { type: "category", data: binnedMonthly.map((row) => row.month), ...axis },
      yAxis: { type: "value", ...axis },
      series: [
        {
          name: "Income",
          type: "bar",
          data: seriesData("income"),
          showBackground: true,
          backgroundStyle: { color: "rgba(113,113,122,.08)", borderRadius: [5, 5, 0, 0] },
          itemStyle: { color: "#34d399", borderRadius: [5, 5, 0, 0] },
        },
        {
          name: "Household spending",
          type: "bar",
          data: seriesData("spending"),
          showBackground: true,
          backgroundStyle: { color: "rgba(113,113,122,.08)", borderRadius: [5, 5, 0, 0] },
          itemStyle: { color: "#fb7185", borderRadius: [5, 5, 0, 0] },
        },
        {
          name: "Invested",
          type: "bar",
          data: seriesData("invested"),
          showBackground: true,
          backgroundStyle: { color: "rgba(113,113,122,.08)", borderRadius: [5, 5, 0, 0] },
          itemStyle: { color: "#60a5fa", borderRadius: [5, 5, 0, 0] },
        },
      ],
    };
  }, [binnedMonthly, formatCurrency]);
  const categoryOption = useMemo<EChartsVisualizationOption>(
    () => ({
      tooltip: { trigger: "item" },
      legend: {
        type: "scroll",
        orient: "vertical",
        right: 8,
        top: "middle",
        textStyle: { color: "#a1a1aa" },
        formatter: label,
      },
      series: [
        {
          type: "pie",
          radius: ["48%", "76%"],
          center: ["35%", "50%"],
          padAngle: 2,
          itemStyle: { borderRadius: 5, borderColor: "#18181b", borderWidth: 2 },
          label: { show: false },
          data: data.categories.map((row) => ({ ...row, name: label(row.name) })),
        },
      ],
    }),
    [data.categories],
  );
  const accountOption = useMemo<EChartsVisualizationOption>(
    () => ({
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      legend: { bottom: 0, textStyle: { color: "#a1a1aa" } },
      grid: { left: 12, right: 12, top: 20, bottom: 42, containLabel: true },
      xAxis: { type: "value", ...axis },
      yAxis: { type: "category", data: data.accounts.map((row) => row.name), ...axis },
      series: [
        {
          name: "Inflow",
          type: "bar",
          stack: "flow",
          data: data.accounts.map((row) => row.inflow),
          itemStyle: { color: "#2dd4bf" },
        },
        {
          name: "Outflow",
          type: "bar",
          stack: "flow",
          data: data.accounts.map((row) => -row.outflow),
          itemStyle: { color: "#f97316" },
        },
      ],
    }),
    [data.accounts],
  );
  const merchantOption = useMemo<EChartsVisualizationOption>(
    () => ({
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      grid: { left: 12, right: 14, top: 12, bottom: 18, containLabel: true },
      xAxis: { type: "value", ...axis },
      yAxis: {
        type: "category",
        inverse: true,
        data: data.merchants.map((row) =>
          row.name.length > 24 ? `${row.name.slice(0, 23)}…` : row.name,
        ),
        ...axis,
      },
      series: [
        {
          name: "Spending",
          type: "bar",
          data: data.merchants.map((row) => row.value),
          itemStyle: { color: "#a78bfa", borderRadius: [0, 5, 5, 0] },
        },
      ],
    }),
    [data.merchants],
  );
  async function changeCategory(id: string, category: string) {
    setSaving(id);
    try {
      await appFetch(`/api/cash-flow/transactions/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ category }),
      });
      router.refresh();
    } finally {
      setSaving(null);
    }
  }
  const columns = useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        accessorKey: "bookedAt",
        header: "Date",
        cell: ({ row }) => formatDate(row.original.bookedAt),
      },
      {
        accessorKey: "name",
        header: "Description",
        cell: ({ row }) => (
          <div className="max-w-[22rem] whitespace-normal">
            <p className="font-medium">{row.original.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.accountName} · {row.original.transactionType ?? "Transaction"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <select
            aria-label={`Category for ${row.original.name}`}
            className="h-8 max-w-40 rounded-md border bg-background px-2 text-xs"
            value={row.original.category}
            disabled={saving === row.original.id}
            onChange={(event) => void changeCategory(row.original.id, event.target.value)}
          >
            {BANK_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {label(category)}
              </option>
            ))}
          </select>
        ),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => (
          <span
            className={`font-medium tabular-nums ${row.original.amount > 0 ? "text-emerald-600 dark:text-emerald-400" : ""}`}
          >
            {formatCurrency(row.original.amount, row.original.currency)}
          </span>
        ),
      },
      {
        accessorKey: "categoryConfidence",
        header: "Evidence",
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.categorySource === "manual" || row.original.categoryConfidence >= 0.9
                ? "secondary"
                : "outline"
            }
          >
            {row.original.categorySource === "manual"
              ? "Confirmed"
              : `${Math.round(row.original.categoryConfidence * 100)}% rule`}
          </Badge>
        ),
      },
    ],
    [formatCurrency, saving],
  );
  return (
    <Tabs defaultValue="insights" className="min-w-0 gap-4">
      <div className="px-4 lg:px-6">
        <TabsList>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="insights">
        <div className="grid min-w-0 grid-cols-1 gap-4 px-4 xl:grid-cols-2 lg:px-6">
          <AnalyticsChartCard
            id="monthly-cash-flow"
            title={
              scope === "personal"
                ? "Salary, personal spending and investing"
                : scope === "joint"
                  ? "Household income and spending"
                  : "Income, spending and investing"
            }
            description="Internal transfers are removed so money is counted once."
            metric={formatPercent(data.metrics.savingsRate, 1)}
            metricLabel="income retained before investing"
          >
            <div className="flex justify-end px-2 pt-1">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                Time bin
                <select
                  value={timeBin}
                  onChange={(event) =>
                    setTimeBin(event.target.value as "month" | "quarter" | "year")
                  }
                  className="h-8 rounded-md border bg-background px-2 text-foreground"
                >
                  <option value="month">Month</option>
                  <option value="quarter">Quarter</option>
                  <option value="year">Year</option>
                </select>
              </label>
            </div>
            <EChartsVisualization
              option={monthlyOption}
              className="h-[330px] w-full"
              ariaLabel="Monthly income, household spending, and investing"
            />
          </AnalyticsChartCard>
          <AnalyticsChartCard
            id="spending-by-category"
            title={scope === "personal" ? "Where personal cash went" : "Where household cash went"}
            description={`Actual external spending from ${scope === "all" ? "all imported" : scope} accounts.`}
            metric={formatCurrency(data.metrics.totalSpending, "EUR")}
            metricLabel="external spending"
          >
            <EChartsVisualization
              option={categoryOption}
              className="h-[330px] w-full"
              ariaLabel="Spending by category"
            />
          </AnalyticsChartCard>
          <AnalyticsChartCard
            id="cash-by-account"
            title="Cash movement by account"
            description="Full inflows and outflows. Joint-account values are not divided."
            metric={`${data.accounts.length}`}
            metricLabel="imported accounts"
          >
            <EChartsVisualization
              option={accountOption}
              className="h-[310px] w-full"
              ariaLabel="Cash inflows and outflows by account"
            />
          </AnalyticsChartCard>
          {scope === "joint" ? (
            <AnalyticsChartCard
              id="top-household-merchants"
              title="Largest household merchants"
              description="Where repeated or high-value household payments accumulated."
              metric={formatCurrency(data.merchants[0]?.value ?? 0, "EUR")}
              metricLabel={data.merchants[0]?.name ?? "no merchant data"}
            >
              <EChartsVisualization
                option={merchantOption}
                className="h-[310px] w-full"
                ariaLabel="Largest household merchants by total spending"
              />
            </AnalyticsChartCard>
          ) : (
            <AnalyticsChartCard
              id="salary-reconciliation"
              title="Salary reconciliation"
              description="One-to-one verification of imported payslips against original external payroll credits across every owned account."
              metric={`${data.metrics.salaryMatches}/${data.metrics.salaryPayslips}`}
              metricLabel="payslips verified"
            >
              <div className="flex h-[310px] items-center justify-center p-6 text-center">
                <div>
                  <p className="text-5xl font-semibold tabular-nums">
                    {data.metrics.salaryPayslips
                      ? formatPercent(data.metrics.salaryMatches / data.metrics.salaryPayslips, 0)
                      : "—"}
                  </p>
                  <p className="mt-3 max-w-sm text-sm text-muted-foreground">
                    Transfers between owned accounts and unrelated payroll credits are excluded. A
                    match requires the same month and an amount difference no greater than €0.02.
                    {` ${data.metrics.salaryMissing} missing · ${data.metrics.salaryMismatches} amount mismatches.`}
                  </p>
                </div>
              </div>
            </AnalyticsChartCard>
          )}
        </div>
      </TabsContent>
      <TabsContent value="transactions" className="px-4 lg:px-6">
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="border-b px-4 py-4">
            <h2 className="font-semibold">Transactions</h2>
            <p className="text-sm text-muted-foreground">
              Search {scope === "all" ? "all imported" : scope} transactions and confirm categories
              when a rule is uncertain.
            </p>
          </div>
          <DataTable
            columns={columns}
            data={data.transactions}
            pageSize={20}
            searchPlaceholder="Search merchant, account, or category…"
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
