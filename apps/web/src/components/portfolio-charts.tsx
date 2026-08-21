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
    label: "Value",
    colors: { light: ["#2563eb", "#7c3aed"], dark: ["#60a5fa", "#a78bfa"] },
  },
} satisfies BarChartConfig;

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

function shortLabel(value: string) {
  return value.length > 18 ? `${value.slice(0, 17)}…` : value;
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

  return (
    <div className="grid min-w-0 gap-4 px-4 xl:grid-cols-2 lg:px-6">
      <AnalyticsChartCard
        title={allocationTitle}
        description={`Current value by category in ${currency}.`}
        metric={compact(total, currency)}
        metricLabel="allocated value"
      >
        <EChartsBarChart
          data={allocation}
          config={allocationConfig}
          xDataKey="category"
          layout="horizontal"
          className="h-[300px] min-w-0 w-full"
          barRadius={5}
          enableMaxValueHighlight
          chartOptions={{ grid: { left: 8, right: 12, top: 12, bottom: 24, containLabel: true } }}
        >
          <EChartsBarChart.Grid />
          <EChartsBarChart.XAxis tickFormatter={(value) => compact(Number(value), currency)} />
          <EChartsBarChart.YAxis dataKey="category" tickFormatter={shortLabel} hideDots />
          <EChartsBarChart.Tooltip
            variant="frosted-glass"
            roundness="lg"
            valueFormatter={(value) => formatCurrency(value, currency)}
          />
          <EChartsBarChart.Bar dataKey="value" variant="gradient" enableHoverHighlight glowing />
        </EChartsBarChart>
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
