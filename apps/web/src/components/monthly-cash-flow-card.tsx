"use client";

import { AnalyticsChartCard } from "@/components/analytics-chart-card";
import { useAmountFormat } from "@/components/amount-preferences";
import { formatPercent } from "@/lib/format";
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
    >
      <div className="flex items-start justify-between gap-4 p-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Best {timeBin}</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
              {formatCurrency(
                (binnedMonthly[peakIndex]?.income ?? 0) +
                  (binnedMonthly[peakIndex]?.spending ?? 0) +
                  (binnedMonthly[peakIndex]?.invested ?? 0),
                "EUR",
              )}
            </span>
            <span className="text-sm text-muted-foreground">
              total flow in {binnedMonthly[peakIndex]?.month ?? "N/A"}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-3 pt-1">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Time bin
            <select
              value={timeBin}
              onChange={(event) => setTimeBin(event.target.value as "month" | "quarter" | "year")}
              className="h-8 rounded-md border bg-background px-2 text-foreground"
            >
              <option value="month">Month</option>
              <option value="quarter">Quarter</option>
              <option value="year">Year</option>
            </select>
          </label>
          <div className="flex flex-col items-end gap-1.5">
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
      <div className="mt-3 min-h-0 w-full flex-1">
        <EChartsBarChart
          data={binnedMonthly}
          config={monthlyChartConfig}
          xDataKey="month"
          className="h-[270px] w-full"
          stackType="stacked"
        >
          <EChartsBarChart.XAxis dataKey="month" hideDots />
          <EChartsBarChart.Tooltip
            valueFormatter={(value) => formatCurrency(Number(value), "EUR")}
          />
          <EChartsBarChart.Bar dataKey="invested" radius={6} />
          <EChartsBarChart.Bar dataKey="spending" radius={6} />
          <EChartsBarChart.Bar dataKey="income" radius={6} />
        </EChartsBarChart>
      </div>
    </AnalyticsChartCard>
  );
}
