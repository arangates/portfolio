"use client";

import { AnalyticsChartCard } from "@/components/analytics-chart-card";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";
import {
  EChartsAreaChart,
  type ChartConfig as AreaChartConfig,
} from "@portfolio/ui/components/evilcharts/charts/echarts-area-chart";
import {
  EChartsBarChart,
  type ChartConfig as BarChartConfig,
} from "@portfolio/ui/components/evilcharts/charts/echarts-bar-chart";

const pnlConfig = {
  value: {
    label: "Unrealized P&L",
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

function shortLabel(value: string) {
  return value.length > 22 ? `${value.slice(0, 21)}…` : value;
}

export function EquityPerformanceCharts({
  holdings,
  history,
}: {
  holdings: Array<{
    name: string;
    investedValue: number;
    marketValue: number;
    unrealizedPnl: number;
  }>;
  history: Array<{ date: string; investedValue: number; marketValue: number }>;
}) {
  const sorted = [...holdings].sort(
    (left, right) => Math.abs(right.unrealizedPnl) - Math.abs(left.unrealizedPnl),
  );
  const visible = sorted.slice(0, 9).map((holding) => ({
    name: holding.name,
    value: holding.unrealizedPnl,
  }));
  if (sorted.length > 9) {
    visible.push({
      name: `Other ${sorted.length - 9} holdings`,
      value: sorted.slice(9).reduce((sum, holding) => sum + holding.unrealizedPnl, 0),
    });
  }
  const totalPnl = holdings.reduce((sum, holding) => sum + holding.unrealizedPnl, 0);
  const latest = history.at(-1);

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 px-4 xl:grid-cols-2 lg:px-6">
      <AnalyticsChartCard
        id="equity-performance"
        title="What drives Indian equity P&L"
        description="Current unrealized profit or loss by holding; smaller positions are grouped exactly."
        metric={formatCurrency(totalPnl, "INR")}
        metricLabel="total unrealized P&L"
      >
        <EChartsBarChart
          data={visible}
          config={pnlConfig}
          xDataKey="name"
          layout="horizontal"
          className="h-[340px] min-w-0 w-full"
          barRadius={5}
          chartOptions={{ grid: { left: 8, right: 12, top: 12, bottom: 24, containLabel: true } }}
        >
          <EChartsBarChart.Grid />
          <EChartsBarChart.XAxis
            tickFormatter={(value) => formatCompactCurrency(Number(value), "INR")}
          />
          <EChartsBarChart.YAxis dataKey="name" tickFormatter={shortLabel} hideDots />
          <EChartsBarChart.Tooltip
            variant="frosted-glass"
            roundness="lg"
            valueFormatter={(value) => formatCurrency(value, "INR")}
          />
          <EChartsBarChart.Bar dataKey="value" variant="default" enableHoverHighlight />
        </EChartsBarChart>
      </AnalyticsChartCard>
      <AnalyticsChartCard
        id="indian-equity-trajectory"
        title="Indian equity trajectory"
        description="Invested capital versus market value across imported holdings snapshots."
        metric={latest ? formatCurrency(latest.marketValue, "INR") : "—"}
        metricLabel="latest market value"
      >
        <EChartsAreaChart
          data={history}
          config={historyConfig}
          xDataKey="date"
          curveType="monotone"
          enableHoverReveal
          className="h-[340px] min-w-0 w-full"
          chartOptions={{ grid: { left: 8, right: 12, top: 42, bottom: 28, containLabel: true } }}
        >
          <EChartsAreaChart.Grid />
          <EChartsAreaChart.XAxis dataKey="date" hideDots />
          <EChartsAreaChart.YAxis
            tickFormatter={(value) => formatCompactCurrency(value, "INR")}
            hideDots
          />
          <EChartsAreaChart.Tooltip
            variant="frosted-glass"
            roundness="lg"
            valueFormatter={(value) => formatCurrency(value, "INR")}
          />
          <EChartsAreaChart.Legend align="left" verticalAlign="top" isClickable />
          <EChartsAreaChart.Area dataKey="marketValue" variant="gradient" strokeWidth={2}>
            <EChartsAreaChart.ActiveDot variant="ping" />
          </EChartsAreaChart.Area>
          <EChartsAreaChart.Area
            dataKey="investedValue"
            variant="none"
            strokeVariant="dashed"
            strokeWidth={2}
          />
        </EChartsAreaChart>
      </AnalyticsChartCard>
    </div>
  );
}
