"use client";

import { AnalyticsChartCard } from "@/components/analytics-chart-card";
import { formatCurrency } from "@/lib/format";
import {
  EChartsAreaChart,
  type ChartConfig as AreaChartConfig,
} from "@portfolio/ui/components/evilcharts/charts/echarts-area-chart";
import {
  EChartsBarChart,
  type ChartConfig as BarChartConfig,
} from "@portfolio/ui/components/evilcharts/charts/echarts-bar-chart";

const allocationConfig = {
  value: {
    label: "Attributable value",
    colors: { light: ["#d97706", "#ea580c"], dark: ["#fbbf24", "#fb923c"] },
  },
} satisfies BarChartConfig;
const historyConfig = {
  value: {
    label: "Attributable value",
    colors: { light: ["#7c3aed", "#db2777"], dark: ["#a78bfa", "#f472b6"] },
  },
} satisfies AreaChartConfig;

function compact(value: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function RealEstateCharts({
  allocation,
  history,
  currency,
}: {
  allocation: Array<{ category: string; value: number }>;
  history: Array<{ date: string; value: number }>;
  currency: string;
}) {
  const total = allocation.reduce((sum, item) => sum + item.value, 0);
  return (
    <div className="grid min-w-0 gap-4 px-4 xl:grid-cols-2 lg:px-6">
      <AnalyticsChartCard
        title="Property allocation"
        description="Attributable value by property type."
        metric={compact(total, currency)}
        metricLabel="owned value"
      >
        <EChartsBarChart
          data={allocation}
          config={allocationConfig}
          xDataKey="category"
          layout="horizontal"
          className="h-[300px] min-w-0 w-full"
          enableMaxValueHighlight
          chartOptions={{ grid: { left: 8, right: 12, top: 12, bottom: 24, containLabel: true } }}
        >
          <EChartsBarChart.Grid />
          <EChartsBarChart.XAxis tickFormatter={(value) => compact(Number(value), currency)} />
          <EChartsBarChart.YAxis dataKey="category" hideDots />
          <EChartsBarChart.Tooltip
            variant="frosted-glass"
            valueFormatter={(value) => formatCurrency(value, currency)}
          />
          <EChartsBarChart.Bar dataKey="value" variant="duotone" glowing enableHoverHighlight />
        </EChartsBarChart>
      </AnalyticsChartCard>
      <AnalyticsChartCard
        title="Valuation history"
        description="Owned value after each dated property snapshot."
        metric={history.at(-1) ? formatCurrency(history.at(-1)!.value, currency) : "—"}
        metricLabel="latest valuation"
      >
        <EChartsAreaChart
          data={history}
          config={historyConfig}
          xDataKey="date"
          curveType="monotone"
          enableHoverReveal
          className="h-[300px] min-w-0 w-full"
          chartOptions={{ grid: { left: 8, right: 12, top: 16, bottom: 28, containLabel: true } }}
        >
          <EChartsAreaChart.Grid />
          <EChartsAreaChart.XAxis dataKey="date" hideDots />
          <EChartsAreaChart.YAxis tickFormatter={(value) => compact(value, currency)} hideDots />
          <EChartsAreaChart.Tooltip
            variant="frosted-glass"
            valueFormatter={(value) => formatCurrency(value, currency)}
          />
          <EChartsAreaChart.Area dataKey="value" variant="dotted" strokeWidth={2}>
            <EChartsAreaChart.ActiveDot variant="ping" />
          </EChartsAreaChart.Area>
        </EChartsAreaChart>
      </AnalyticsChartCard>
    </div>
  );
}
