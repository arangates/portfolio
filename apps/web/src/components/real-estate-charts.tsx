"use client";

import { AnalyticsChartCard } from "@/components/analytics-chart-card";
import { formatCompactCurrency, formatCurrency, formatFullCurrency } from "@/lib/format";
import {
  EChartsAreaChart,
  type ChartConfig as AreaChartConfig,
} from "@portfolio/ui/components/evilcharts/charts/echarts-area-chart";
import {
  EChartsPieChart,
  type ChartConfig as PieChartConfig,
} from "@portfolio/ui/components/evilcharts/charts/echarts-pie-chart";

const ALLOCATION_COLORS: Array<{ light: string[]; dark: string[] }> = [
  { light: ["#2563eb", "#60a5fa"], dark: ["#60a5fa", "#93c5fd"] },
  { light: ["#7c3aed", "#a78bfa"], dark: ["#a78bfa", "#c4b5fd"] },
  { light: ["#059669", "#34d399"], dark: ["#34d399", "#6ee7b7"] },
  { light: ["#d97706", "#fbbf24"], dark: ["#fbbf24", "#fde68a"] },
  { light: ["#dc2626", "#fb7185"], dark: ["#fb7185", "#fda4af"] },
  { light: ["#0891b2", "#22d3ee"], dark: ["#22d3ee", "#67e8f9"] },
];
const historyConfig = {
  value: {
    label: "Attributable value",
    colors: { light: ["#7c3aed", "#db2777"], dark: ["#a78bfa", "#f472b6"] },
  },
} satisfies AreaChartConfig;

export function RealEstateCharts({
  allocation,
  history,
  currency,
}: {
  allocation: Array<{ category: string; value: number }>;
  history: Array<{ date: string; value: number }>;
  currency: string;
}) {
  const series = allocation
    .filter((item) => item.value > 0)
    .toSorted((left, right) => right.value - left.value)
    .map((item, index) => ({
      id: `property-${index}`,
      label: item.category,
      value: item.value,
      colors: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length]!,
    }));
  const allocationData = series.map(({ id, value }) => ({ id, value }));
  const allocationConfig = Object.fromEntries(
    series.map(({ id, label, colors }) => [id, { label, colors }]),
  ) satisfies PieChartConfig;
  const total = series.reduce((sum, item) => sum + item.value, 0);
  return (
    <div className="grid min-w-0 gap-4 px-4 xl:grid-cols-2 lg:px-6">
      <AnalyticsChartCard
        id="property-allocation"
        title="Property allocation"
        description={`Every property compared in ${currency} after ownership and currency conversion.`}
        metric={formatCompactCurrency(total, currency)}
        metricTooltip={formatFullCurrency(total, currency)}
        metricLabel="owned value"
      >
        <EChartsPieChart
          data={allocationData}
          config={allocationConfig}
          dataKey="value"
          nameKey="id"
          className="h-[340px] min-w-0 w-full sm:h-[360px]"
        >
          <EChartsPieChart.Background variant="dots" />
          <EChartsPieChart.Pie
            variant="gradient"
            innerRadius="54%"
            outerRadius="78%"
            cornerRadius={6}
            paddingAngle={2}
            isClickable
          />
          <EChartsPieChart.Tooltip
            variant="frosted-glass"
            roundness="lg"
            valueFormatter={(value) => formatCurrency(value, currency)}
          />
          <EChartsPieChart.Legend align="center" verticalAlign="bottom" isClickable />
        </EChartsPieChart>
      </AnalyticsChartCard>
      <AnalyticsChartCard
        id="property-valuation-history"
        title="Valuation history"
        description={`Combined attributable value in ${currency}, normalized with the latest saved exchange rates.`}
        metric={history.at(-1) ? formatCurrency(history.at(-1)!.value, currency) : "—"}
        metricLabel="latest valuation"
      >
        <EChartsAreaChart
          data={history}
          config={historyConfig}
          xDataKey="date"
          curveType="monotone"
          enableHoverReveal
          className="h-[340px] min-w-0 w-full sm:h-[360px]"
          chartOptions={{ grid: { left: 8, right: 12, top: 16, bottom: 28, containLabel: true } }}
        >
          <EChartsAreaChart.Grid />
          <EChartsAreaChart.XAxis dataKey="date" hideDots />
          <EChartsAreaChart.YAxis
            tickFormatter={(value) => formatCompactCurrency(value, currency)}
            hideDots
          />
          <EChartsAreaChart.Tooltip
            variant="frosted-glass"
            valueFormatter={(value) => formatCurrency(value, currency)}
          />
          <EChartsAreaChart.Area dataKey="value" variant="gradient" strokeWidth={2}>
            <EChartsAreaChart.Dot variant="default" />
            <EChartsAreaChart.ActiveDot variant="ping" />
          </EChartsAreaChart.Area>
        </EChartsAreaChart>
      </AnalyticsChartCard>
    </div>
  );
}
