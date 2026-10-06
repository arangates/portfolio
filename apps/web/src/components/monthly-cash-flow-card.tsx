"use client";

import { AnalyticsChartCard } from "@/components/analytics-chart-card";
import { useAmountFormat } from "@/components/amount-preferences";
import { formatPercent } from "@/lib/format";
import { Tabs, TabsList, TabsTrigger } from "@portfolio/ui/components/tabs";
import {
  EChartsBarChart,
  type ChartConfig,
} from "@portfolio/ui/components/evilcharts/charts/echarts-bar-chart";
import { useMemo, useState } from "react";
import type { getCashFlowDashboard } from "@portfolio/api/cash-flow-queries";

type Dashboard = Awaited<ReturnType<typeof getCashFlowDashboard>>;

export function MonthlyCashFlowCard({
  data,
  scope = "all",
}: {
  data: Dashboard;
  scope?: "all" | "personal" | "joint";
}) {
  const { formatCurrency } = useAmountFormat();
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

  const peakIndex = useMemo(() => {
    if (!binnedMonthly.length) return 0;
    return binnedMonthly.reduce(
      (best, row, index, rows) =>
        row.income + row.spending + row.invested >
        rows[best]!.income + rows[best]!.spending + rows[best]!.invested
          ? index
          : best,
      0,
    );
  }, [binnedMonthly]);

  const monthlyChartConfig = useMemo(
    () =>
      ({
        income: { label: "Income", colors: { light: ["#10b981"], dark: ["#34d399"] } },
        spending: {
          label: scope === "personal" ? "Personal spending" : "Household spending",
          colors: { light: ["#7c3aed"], dark: ["#a78bfa"] },
        },
        invested: { label: "Invested", colors: { light: ["#0891b2"], dark: ["#22d3ee"] } },
      }) satisfies ChartConfig,
    [scope],
  );

  const LEGEND = [
    { key: "invested", label: "Invested", swatch: "bg-[#0891b2] dark:bg-[#22d3ee]" },
    {
      key: "spending",
      label: scope === "personal" ? "Personal spending" : "Household spending",
      swatch: "bg-[#7c3aed] dark:bg-[#a78bfa]",
    },
    { key: "income", label: "Income", swatch: "bg-[#10b981] dark:bg-[#34d399]" },
  ];

  return (
    <AnalyticsChartCard
      id={`monthly-cash-flow-${scope}`}
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
      chartHeader={
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Best {timeBin}</span>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="whitespace-nowrap text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
                {formatCurrency(
                  (binnedMonthly[peakIndex]?.income ?? 0) +
                    (binnedMonthly[peakIndex]?.spending ?? 0) +
                    (binnedMonthly[peakIndex]?.invested ?? 0),
                  "EUR",
                )}
              </span>
              <span className="whitespace-nowrap text-sm text-muted-foreground">
                total flow in {binnedMonthly[peakIndex]?.month ?? "N/A"}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
            <Tabs
              value={timeBin}
              onValueChange={(value) => {
                if (value === "month" || value === "quarter" || value === "year") setTimeBin(value);
              }}
              aria-label="Cash flow time bin"
            >
              <TabsList className="h-9 gap-0 overflow-hidden rounded-lg border bg-background p-0">
                <TabsTrigger
                  value="month"
                  className="h-full rounded-none border-r px-3 text-xs data-active:bg-muted data-active:text-foreground dark:data-active:border-r-input"
                >
                  Month
                </TabsTrigger>
                <TabsTrigger
                  value="quarter"
                  className="h-full rounded-none border-r px-3 text-xs data-active:bg-muted data-active:text-foreground dark:data-active:border-r-input"
                >
                  Quarter
                </TabsTrigger>
                <TabsTrigger
                  value="year"
                  className="h-full rounded-none px-3 text-xs data-active:bg-muted data-active:text-foreground"
                >
                  Year
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
              {LEGEND.map(({ key, label, swatch }) => (
                <span
                  key={key}
                  className="flex items-center gap-2 text-[11px] text-muted-foreground sm:text-xs"
                >
                  <span className={`size-2.5 shrink-0 rounded-[3px] ${swatch}`} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <EChartsBarChart
        data={binnedMonthly}
        config={monthlyChartConfig}
        xDataKey="month"
        className="h-[280px] w-full"
      >
        <EChartsBarChart.XAxis dataKey="month" hideDots />
        <EChartsBarChart.Tooltip valueFormatter={(value) => formatCurrency(Number(value), "EUR")} />
        <EChartsBarChart.Bar dataKey="invested" radius={6} />
        <EChartsBarChart.Bar dataKey="spending" radius={6} />
        <EChartsBarChart.Bar dataKey="income" radius={6} />
      </EChartsBarChart>
    </AnalyticsChartCard>
  );
}
