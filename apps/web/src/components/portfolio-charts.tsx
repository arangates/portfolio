"use client";

import { AnalyticsChartCard } from "@/components/analytics-chart-card";
import { formatCurrency } from "@/lib/format";
import {
  EChartsAreaChart,
  type ChartConfig as AreaChartConfig,
} from "@portfolio/ui/components/evilcharts/charts/echarts-area-chart";
import {
  EChartsPieChart,
  type ChartConfig as PieChartConfig,
} from "@portfolio/ui/components/evilcharts/charts/echarts-pie-chart";

const palette = [
  { light: ["#2563eb", "#60a5fa"], dark: ["#60a5fa", "#93c5fd"] },
  { light: ["#7c3aed", "#a78bfa"], dark: ["#a78bfa", "#c4b5fd"] },
  { light: ["#059669", "#34d399"], dark: ["#34d399", "#6ee7b7"] },
  { light: ["#d97706", "#fbbf24"], dark: ["#fbbf24", "#fde68a"] },
  { light: ["#dc2626", "#fb7185"], dark: ["#f87171", "#fda4af"] },
  { light: ["#0891b2", "#22d3ee"], dark: ["#22d3ee", "#67e8f9"] },
];

const historyConfig = {
  marketValue: {
    label: "Market value",
    colors: { light: ["#2563eb", "#7c3aed"], dark: ["#60a5fa", "#a78bfa"] },
  },
  investedValue: {
    label: "Invested value",
    colors: { light: ["#059669"], dark: ["#34d399"] },
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

function keyFor(category: string, index: number) {
  const key = category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return key ? `${key}-${index}` : `category-${index}`;
}

export function PortfolioCharts({
  allocation,
  equityHistory,
  currency,
  historyCurrency = currency,
  allocationTitle = "Asset allocation",
  historyTitle = "Indian equity history",
  historyDescription = "Invested value versus market value across archived uploads.",
}: {
  allocation: Array<{ category: string; value: number }>;
  equityHistory: Array<{ date: string; investedValue: number; marketValue: number }>;
  currency: string;
  historyCurrency?: string;
  allocationTitle?: string;
  historyTitle?: string;
  historyDescription?: string;
}) {
  const total = allocation.reduce((sum, item) => sum + item.value, 0);
  const latest = equityHistory.at(-1);
  const allocationData = allocation.map((item, index) => ({
    id: keyFor(item.category, index),
    value: item.value,
  }));
  const allocationConfig = Object.fromEntries(
    allocation.map((item, index) => [
      allocationData[index]!.id,
      { label: item.category, colors: palette[index % palette.length]! },
    ]),
  ) satisfies PieChartConfig;

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 px-4 xl:grid-cols-2 lg:px-6">
      <AnalyticsChartCard
        title={allocationTitle}
        description={`Share of current value by category in ${currency}.`}
        metric={compact(total, currency)}
        metricLabel="allocated value"
      >
        <EChartsPieChart
          data={allocationData}
          config={allocationConfig}
          dataKey="value"
          nameKey="id"
          className="h-[320px] min-w-0 w-full"
        >
          <EChartsPieChart.Pie
            variant="gradient"
            innerRadius="55%"
            outerRadius="79%"
            cornerRadius={5}
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
        title={historyTitle}
        description={historyDescription}
        metric={latest ? formatCurrency(latest.marketValue, historyCurrency) : "—"}
        metricLabel="latest market value"
      >
        <EChartsAreaChart
          data={equityHistory}
          config={historyConfig}
          xDataKey="date"
          curveType="monotone"
          enableHoverReveal
          className="h-[300px] min-w-0 w-full"
          chartOptions={{ grid: { left: 8, right: 12, top: 42, bottom: 28, containLabel: true } }}
        >
          <EChartsAreaChart.Grid />
          <EChartsAreaChart.XAxis dataKey="date" hideDots />
          <EChartsAreaChart.YAxis
            tickFormatter={(value) => compact(value, historyCurrency)}
            hideDots
          />
          <EChartsAreaChart.Tooltip
            variant="frosted-glass"
            roundness="lg"
            valueFormatter={(value) => formatCurrency(value, historyCurrency)}
          />
          <EChartsAreaChart.Legend align="left" verticalAlign="top" isClickable />
          <EChartsAreaChart.Area
            dataKey="marketValue"
            variant="gradient"
            strokeWidth={2}
            isClickable
          >
            <EChartsAreaChart.ActiveDot variant="ping" />
          </EChartsAreaChart.Area>
          <EChartsAreaChart.Area
            dataKey="investedValue"
            variant="none"
            strokeVariant="dashed"
            strokeWidth={2}
            isClickable
          >
            <EChartsAreaChart.ActiveDot variant="colored-border" />
          </EChartsAreaChart.Area>
        </EChartsAreaChart>
      </AnalyticsChartCard>
    </div>
  );
}
