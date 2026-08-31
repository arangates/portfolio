"use client";

import { AnalyticsChartCard } from "@/components/analytics-chart-card";
import { formatCompactCurrency, formatCurrency, formatPercent } from "@/lib/format";
import {
  EChartsBarChart,
  type ChartConfig as BarChartConfig,
} from "@portfolio/ui/components/evilcharts/charts/echarts-bar-chart";
import {
  EChartsComposedChart,
  type ChartConfig as ComposedChartConfig,
} from "@portfolio/ui/components/evilcharts/charts/echarts-composed-chart";

const allocationConfig = {
  current: {
    label: "Current",
    colors: { light: ["#2563eb", "#7c3aed"], dark: ["#60a5fa", "#a78bfa"] },
  },
  target: { label: "Policy target", colors: { light: ["#059669"], dark: ["#34d399"] } },
} satisfies BarChartConfig;

const flowConfig = {
  purchases: {
    label: "Purchases",
    colors: { light: ["#2563eb", "#7c3aed"], dark: ["#60a5fa", "#a78bfa"] },
  },
  redemptions: { label: "Redemptions", colors: { light: ["#059669"], dark: ["#34d399"] } },
  netPurchases: {
    label: "Net purchases",
    colors: { light: ["#ca8a04"], dark: ["#facc15"] },
  },
} satisfies ComposedChartConfig;

const maturityConfig = {
  value: {
    label: "Scheduled proceeds",
    colors: { light: ["#7c3aed", "#2563eb"], dark: ["#a78bfa", "#60a5fa"] },
  },
} satisfies BarChartConfig;

export function CapitalDeploymentCharts({
  allocation,
  flows,
  maturityWindows,
  currency,
}: {
  allocation: Array<{
    label: string;
    currentWeight: number;
    targetWeight: number | null;
  }>;
  flows: Array<{
    month: string;
    purchases: number;
    redemptions: number;
    netPurchases: number;
  }>;
  maturityWindows: Array<{ days: number; value: number; deposits: number }>;
  currency: string;
}) {
  const allocationData = allocation.map((item) => ({
    name: item.label,
    current: item.currentWeight * 100,
    target: (item.targetWeight ?? 0) * 100,
  }));
  const latestFlows = flows.slice(-36);
  const netPurchases = latestFlows.reduce((sum, item) => sum + item.netPurchases, 0);
  const maturityData = maturityWindows.map((item) => ({
    name: `Next ${item.days} days`,
    value: item.value,
    deposits: item.deposits,
  }));
  const largestWindow = maturityWindows.at(-1);

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 px-4 xl:grid-cols-2 lg:px-6">
      <AnalyticsChartCard
        id="deployment-allocation"
        title="Current allocation versus policy"
        description="Only deployable investment buckets; property and reserved physical assets are excluded."
        metric={formatPercent(
          allocation.find((item) => item.label === "Indian equity")?.currentWeight ?? 0,
          1,
        )}
        metricLabel="currently in Indian equity"
      >
        <EChartsBarChart
          data={allocationData}
          config={allocationConfig}
          xDataKey="name"
          layout="horizontal"
          className="h-[340px] min-w-0 w-full"
          barRadius={4}
          chartOptions={{ grid: { left: 8, right: 12, top: 44, bottom: 20, containLabel: true } }}
        >
          <EChartsBarChart.Grid />
          <EChartsBarChart.XAxis tickFormatter={(value) => `${Number(value).toFixed(0)}%`} />
          <EChartsBarChart.YAxis dataKey="name" hideDots />
          <EChartsBarChart.Tooltip
            variant="frosted-glass"
            roundness="lg"
            valueFormatter={(value) => `${value.toFixed(1)}%`}
          />
          <EChartsBarChart.Legend align="left" verticalAlign="top" isClickable />
          <EChartsBarChart.Bar dataKey="current" variant="default" enableHoverHighlight />
          <EChartsBarChart.Bar dataKey="target" variant="hatched" enableHoverHighlight />
        </EChartsBarChart>
      </AnalyticsChartCard>

      <AnalyticsChartCard
        id="capital-flow-history"
        title="Purchase and redemption flow"
        description="Imported trades converted with the latest stored FX rate; this is trading activity, not portfolio return."
        metric={formatCurrency(netPurchases, currency)}
        metricLabel="net purchases in visible period"
      >
        <EChartsComposedChart
          data={latestFlows}
          config={flowConfig}
          xDataKey="month"
          curveType="monotone"
          className="h-[340px] min-w-0 w-full"
          chartOptions={{ grid: { left: 8, right: 12, top: 48, bottom: 28, containLabel: true } }}
        >
          <EChartsComposedChart.Grid />
          <EChartsComposedChart.XAxis dataKey="month" hideDots />
          <EChartsComposedChart.YAxis
            tickFormatter={(value) => formatCompactCurrency(value, currency)}
            hideDots
          />
          <EChartsComposedChart.Tooltip
            variant="frosted-glass"
            roundness="lg"
            valueFormatter={(value) => formatCurrency(value, currency)}
          />
          <EChartsComposedChart.Legend align="left" verticalAlign="top" isClickable />
          <EChartsComposedChart.Bar dataKey="purchases" variant="default" isClickable />
          <EChartsComposedChart.Bar dataKey="redemptions" variant="hatched" isClickable />
          <EChartsComposedChart.Line dataKey="netPurchases" glow isClickable>
            <EChartsComposedChart.ActiveDot variant="ping" />
          </EChartsComposedChart.Line>
        </EChartsComposedChart>
      </AnalyticsChartCard>

      <div className="xl:col-span-2">
        <AnalyticsChartCard
          id="scheduled-liquidity"
          title="Fixed-deposit liquidity ladder"
          description="Cumulative maturity proceeds by policy window; active status is never changed automatically."
          metric={formatCurrency(largestWindow?.value ?? 0, currency)}
          metricLabel={`${largestWindow?.deposits ?? 0} deposits in ${largestWindow?.days ?? 0} days`}
        >
          <EChartsBarChart
            data={maturityData}
            config={maturityConfig}
            xDataKey="name"
            className="h-[280px] min-w-0 w-full"
            barRadius={6}
            enableMaxValueHighlight
            chartOptions={{ grid: { left: 8, right: 12, top: 20, bottom: 24, containLabel: true } }}
          >
            <EChartsBarChart.Grid />
            <EChartsBarChart.XAxis dataKey="name" hideDots />
            <EChartsBarChart.YAxis
              tickFormatter={(value) => formatCompactCurrency(Number(value), currency)}
              hideDots
            />
            <EChartsBarChart.Tooltip
              variant="frosted-glass"
              roundness="lg"
              valueFormatter={(value) => formatCurrency(value, currency)}
            />
            <EChartsBarChart.Bar dataKey="value" variant="default" glowing enableHoverHighlight />
          </EChartsBarChart>
        </AnalyticsChartCard>
      </div>
    </div>
  );
}
