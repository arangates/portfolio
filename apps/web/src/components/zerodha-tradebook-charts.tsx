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

const cashFlowConfig = {
  buys: {
    label: "Purchases",
    colors: { light: ["#2563eb", "#7c3aed"], dark: ["#60a5fa", "#a78bfa"] },
  },
  sells: { label: "Redemptions", colors: { light: ["#059669"], dark: ["#34d399"] } },
  netInvested: {
    label: "Net invested",
    colors: { light: ["#ca8a04"], dark: ["#facc15"] },
  },
} satisfies ComposedChartConfig;

const fundConfig = {
  buyAmount: {
    label: "Purchases",
    colors: { light: ["#2563eb", "#7c3aed"], dark: ["#60a5fa", "#a78bfa"] },
  },
} satisfies BarChartConfig;

export function ZerodhaTradebookCharts({
  monthly,
  funds,
}: {
  monthly: Array<{ month: string; buys: number; sells: number; netInvested: number }>;
  funds: Array<{ name: string; buyAmount: number }>;
}) {
  const topFunds = funds.slice(0, 8).map((fund) => ({
    ...fund,
    label: fund.name
      .replace(/\s+-\s+DIRECT.*$/i, "")
      .replace(/\s+DIRECT.*$/i, "")
      .slice(0, 34),
  }));
  const netInvested = monthly.reduce((sum, row) => sum + row.netInvested, 0);
  const largestFund = topFunds[0];

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 px-4 xl:grid-cols-2 lg:px-6">
      <AnalyticsChartCard
        title="Monthly investment flow"
        description="Actual purchases, redemptions and net invested cash from imported trades."
        metric={formatCurrency(netInvested, "INR")}
        metricLabel="cumulative net invested"
      >
        <EChartsComposedChart
          data={monthly}
          config={cashFlowConfig}
          xDataKey="month"
          curveType="monotone"
          className="h-[320px] min-w-0 w-full"
          chartOptions={{ grid: { left: 8, right: 12, top: 48, bottom: 28, containLabel: true } }}
        >
          <EChartsComposedChart.Grid />
          <EChartsComposedChart.XAxis dataKey="month" hideDots />
          <EChartsComposedChart.YAxis
            tickFormatter={(value) => formatCompactCurrency(value, "INR")}
            hideDots
          />
          <EChartsComposedChart.Tooltip
            variant="frosted-glass"
            roundness="lg"
            valueFormatter={(value) => formatCurrency(value, "INR")}
          />
          <EChartsComposedChart.Legend align="left" verticalAlign="top" isClickable />
          <EChartsComposedChart.Bar dataKey="buys" variant="gradient" glow isClickable />
          <EChartsComposedChart.Bar dataKey="sells" variant="hatched" isClickable />
          <EChartsComposedChart.Line dataKey="netInvested" glow isClickable>
            <EChartsComposedChart.ActiveDot variant="ping" />
          </EChartsComposedChart.Line>
        </EChartsComposedChart>
      </AnalyticsChartCard>

      <AnalyticsChartCard
        title="Where contributions went"
        description="Top funds by cumulative purchase amount across every imported financial year."
        metric={largestFund ? formatCurrency(largestFund.buyAmount, "INR") : "—"}
        metricLabel={largestFund?.label ?? "largest contribution"}
      >
        <EChartsBarChart
          data={topFunds}
          config={fundConfig}
          xDataKey="label"
          layout="horizontal"
          className="h-[320px] min-w-0 w-full"
          barRadius={5}
          chartOptions={{ grid: { left: 8, right: 12, top: 12, bottom: 24, containLabel: true } }}
        >
          <EChartsBarChart.Grid />
          <EChartsBarChart.XAxis
            tickFormatter={(value) => formatCompactCurrency(Number(value), "INR")}
          />
          <EChartsBarChart.YAxis dataKey="label" hideDots />
          <EChartsBarChart.Tooltip
            variant="frosted-glass"
            roundness="lg"
            valueFormatter={(value) => formatCurrency(value, "INR")}
          />
          <EChartsBarChart.Bar
            dataKey="buyAmount"
            variant="gradient"
            enableHoverHighlight
            glowing
          />
        </EChartsBarChart>
      </AnalyticsChartCard>
    </div>
  );
}
