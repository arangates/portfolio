"use client";
import { useAmountFormat } from "@/components/amount-preferences";

import { AnalyticsChartCard } from "@/components/analytics-chart-card";
import { AllocationPieChart } from "@/components/allocation-pie-chart";
import { formatCompactCurrency } from "@/lib/format";
import {
  EChartsBarChart,
  type ChartConfig as BarChartConfig,
} from "@portfolio/ui/components/evilcharts/charts/echarts-bar-chart";
import {
  EChartsComposedChart,
  type ChartConfig as ComposedChartConfig,
} from "@portfolio/ui/components/evilcharts/charts/echarts-composed-chart";
import { type ChartConfig as PieChartConfig } from "@portfolio/ui/components/evilcharts/charts/echarts-pie-chart";
import { chartColors } from "@portfolio/ui/lib/chart-theme";

const categoryConfig = {
  amount: {
    label: "Monthly expense",
    colors: chartColors.cyan,
  },
} satisfies BarChartConfig;
const scenarioConfig = {
  grossExpenses: { label: "Gross expenses", colors: chartColors.primary },
  refunds: { label: "Refunds", colors: chartColors.success },
  netMonthly: {
    label: "Net household cost",
    colors: chartColors.purple,
  },
} satisfies ComposedChartConfig;
const mixConfig = {
  essential: {
    label: "Essential expenses",
    colors: chartColors.primary,
  },
  flexible: {
    label: "Flexible expenses",
    colors: chartColors.warning,
  },
} satisfies PieChartConfig;
const perAdultConfig = {
  perAdult: {
    label: "Net cost per adult",
    colors: chartColors.purple,
  },
} satisfies BarChartConfig;

export function HouseholdCharts({
  categories,
  scenarios,
  currency,
  essentialExpenses,
  flexibleExpenses,
}: {
  categories: Array<{ category: string; amount: number }>;
  scenarios: Array<{
    name: string;
    grossExpenses: number;
    refunds: number;
    netMonthly: number;
    perAdult: number;
  }>;
  currency: string;
  essentialExpenses?: number;
  flexibleExpenses?: number;
}) {
  const { formatCurrency } = useAmountFormat();
  const total = categories.reduce((sum, row) => sum + row.amount, 0);
  const current = scenarios[0];
  const mixData = [
    { name: "essential", value: essentialExpenses ?? 0 },
    { name: "flexible", value: flexibleExpenses ?? 0 },
  ];
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 px-4 xl:grid-cols-2 lg:px-6">
      <AnalyticsChartCard
        id="household-budget-breakdown"
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
        id="essential-flexible-spend"
        title="Essential versus flexible"
        description="How current recurring expenses split between needs and choices."
        metric={formatCurrency(total, currency)}
        metricLabel="gross recurring spend"
      >
        <AllocationPieChart
          data={mixData.map(({ name, value }) => ({ id: name, value }))}
          config={mixConfig}
          currency={currency}
          className="h-[320px]"
          ariaLabel="Essential and flexible household spending breakdown"
        />
      </AnalyticsChartCard>
      <AnalyticsChartCard
        id="household-scenario-comparison"
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
      <AnalyticsChartCard
        id="household-cost-per-adult"
        title="Cost per adult by scenario"
        description="The monthly net cost each adult carries under every scenario."
        metric={current ? formatCurrency(current.perAdult, currency) : "—"}
        metricLabel="primary scenario per adult"
      >
        <EChartsBarChart
          data={scenarios}
          config={perAdultConfig}
          xDataKey="name"
          className="h-[320px] min-w-0 w-full"
          chartOptions={{ grid: { left: 8, right: 12, top: 12, bottom: 38, containLabel: true } }}
        >
          <EChartsBarChart.Grid />
          <EChartsBarChart.XAxis
            dataKey="name"
            tickFormatter={(value) => (value.length > 12 ? `${value.slice(0, 11)}…` : value)}
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
          <EChartsBarChart.Bar dataKey="perAdult" variant="default" enableHoverHighlight glowing />
        </EChartsBarChart>
      </AnalyticsChartCard>
    </div>
  );
}
