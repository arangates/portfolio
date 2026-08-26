"use client";

import { AnalyticsChartCard } from "@/components/analytics-chart-card";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";
import {
  EChartsBarChart,
  type ChartConfig as BarChartConfig,
} from "@portfolio/ui/components/evilcharts/charts/echarts-bar-chart";
import {
  EChartsComposedChart,
  type ChartConfig as ComposedChartConfig,
} from "@portfolio/ui/components/evilcharts/charts/echarts-composed-chart";

const categoryConfig = {
  amount: {
    label: "Monthly expense",
    colors: { light: ["#0891b2", "#2563eb"], dark: ["#22d3ee", "#60a5fa"] },
  },
} satisfies BarChartConfig;
const scenarioConfig = {
  grossExpenses: { label: "Gross expenses", colors: { light: ["#2563eb"], dark: ["#60a5fa"] } },
  refunds: { label: "Refunds", colors: { light: ["#059669"], dark: ["#34d399"] } },
  netMonthly: {
    label: "Net household cost",
    colors: { light: ["#7c3aed", "#db2777"], dark: ["#a78bfa", "#f472b6"] },
  },
} satisfies ComposedChartConfig;

export function HouseholdCharts({
  categories,
  scenarios,
  currency,
}: {
  categories: Array<{ category: string; amount: number }>;
  scenarios: Array<{ name: string; grossExpenses: number; refunds: number; netMonthly: number }>;
  currency: string;
}) {
  const total = categories.reduce((sum, row) => sum + row.amount, 0);
  const current = scenarios[0];
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 px-4 xl:grid-cols-2 lg:px-6">
      <AnalyticsChartCard
        title="Where the monthly budget goes"
        description="Current gross expenses grouped by category."
        metric={formatCurrency(total, currency)}
        metricLabel="monthly gross spend"
      >
        <EChartsBarChart
          data={categories}
          config={categoryConfig}
          xDataKey="category"
          className="h-[320px] min-w-0 w-full"
          chartOptions={{ grid: { left: 8, right: 12, top: 12, bottom: 38, containLabel: true } }}
        >
          <EChartsBarChart.Grid />
          <EChartsBarChart.XAxis
            dataKey="category"
            tickFormatter={(value) => (value.length > 10 ? `${value.slice(0, 9)}…` : value)}
            hideDots
          />
          <EChartsBarChart.YAxis
            tickFormatter={(value) => formatCompactCurrency(Number(value), currency)}
            hideDots
          />
          <EChartsBarChart.Tooltip
            variant="frosted-glass"
            valueFormatter={(value) => formatCurrency(value, currency)}
          />
          <EChartsBarChart.Bar dataKey="amount" variant="default" enableHoverHighlight glowing />
        </EChartsBarChart>
      </AnalyticsChartCard>
      <AnalyticsChartCard
        title="Scenario comparison"
        description="Gross costs, refunds and the resulting monthly household cost."
        metric={current ? formatCurrency(current.netMonthly, currency) : "—"}
        metricLabel="primary scenario net"
      >
        <EChartsComposedChart
          data={scenarios}
          config={scenarioConfig}
          xDataKey="name"
          curveType="monotone"
          className="h-[320px] min-w-0 w-full"
          chartOptions={{ grid: { left: 8, right: 12, top: 48, bottom: 28, containLabel: true } }}
        >
          <EChartsComposedChart.Grid />
          <EChartsComposedChart.XAxis dataKey="name" hideDots />
          <EChartsComposedChart.YAxis
            tickFormatter={(value) => formatCompactCurrency(value, currency)}
            hideDots
          />
          <EChartsComposedChart.Tooltip
            variant="frosted-glass"
            valueFormatter={(value) => formatCurrency(value, currency)}
          />
          <EChartsComposedChart.Legend align="left" verticalAlign="top" isClickable />
          <EChartsComposedChart.Bar
            dataKey="grossExpenses"
            variant="default"
            enableHoverHighlight
          />
          <EChartsComposedChart.Bar dataKey="refunds" variant="duotone" enableHoverHighlight />
          <EChartsComposedChart.Line dataKey="netMonthly" glow isClickable>
            <EChartsComposedChart.ActiveDot variant="ping" />
          </EChartsComposedChart.Line>
        </EChartsComposedChart>
      </AnalyticsChartCard>
    </div>
  );
}
