"use client";

import { AnalyticsChartCard } from "@/components/analytics-chart-card";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";
import {
  EChartsBarChart,
  type ChartConfig as BarChartConfig,
} from "@portfolio/ui/components/evilcharts/charts/echarts-bar-chart";

const valueConfig = {
  value: {
    label: "Owned value",
    colors: { light: ["#d97706", "#7c3aed"], dark: ["#fbbf24", "#a78bfa"] },
  },
} satisfies BarChartConfig;
const weightConfig = {
  declared: { label: "Declared weight", colors: { light: ["#2563eb"], dark: ["#60a5fa"] } },
  itemized: { label: "Itemized weight", colors: { light: ["#059669"], dark: ["#34d399"] } },
} satisfies BarChartConfig;

function shortLabel(value: string) {
  return value.length > 23 ? `${value.slice(0, 22)}…` : value;
}

export function CommodityCharts({
  holdings,
  reconciliation,
}: {
  holdings: Array<{
    id: string;
    name: string;
    value: number;
    currency: string;
  }>;
  reconciliation: Array<{
    id: string;
    name: string;
    quantityGrams: number | null;
    itemizedGrossGrams: number;
  }>;
}) {
  const inrHoldings = holdings
    .filter((holding) => holding.currency === "INR")
    .sort((left, right) => right.value - left.value)
    .map((holding) => ({ name: holding.name, value: holding.value }));
  const excludedCurrencies = [
    ...new Set(
      holdings.filter((holding) => holding.currency !== "INR").map((holding) => holding.currency),
    ),
  ];
  const weightData = reconciliation
    .filter(
      (holding): holding is typeof holding & { quantityGrams: number } =>
        holding.quantityGrams != null,
    )
    .map((holding) => ({
      name: holding.name,
      declared: holding.quantityGrams,
      itemized: holding.itemizedGrossGrams,
    }));
  const total = inrHoldings.reduce((sum, holding) => sum + holding.value, 0);

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 px-4 xl:grid-cols-2 lg:px-6">
      <AnalyticsChartCard
        title="Declared value by holding"
        description={
          excludedCurrencies.length === 0
            ? "Ownership-adjusted value from the latest INR snapshot of each holding."
            : `INR holdings only; ${excludedCurrencies.join(", ")} values remain separate to avoid false totals.`
        }
        metric={formatCurrency(total, "INR")}
        metricLabel="declared INR value"
      >
        <EChartsBarChart
          data={inrHoldings}
          config={valueConfig}
          xDataKey="name"
          layout="horizontal"
          className="h-[320px] min-w-0 w-full"
          barRadius={5}
          enableMaxValueHighlight
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
          <EChartsBarChart.Bar dataKey="value" variant="gradient" enableHoverHighlight />
        </EChartsBarChart>
      </AnalyticsChartCard>

      <AnalyticsChartCard
        title="Physical inventory reconciliation"
        description="Declared gross weight versus itemized gross weight for holdings with a known declared total."
        metric={`${weightData.reduce((sum, holding) => sum + holding.itemized, 0).toLocaleString("en-IN", { maximumFractionDigits: 1 })} g`}
        metricLabel="itemized weight in comparable holdings"
      >
        <EChartsBarChart
          data={weightData}
          config={weightConfig}
          xDataKey="name"
          layout="horizontal"
          className="h-[320px] min-w-0 w-full"
          barRadius={4}
          chartOptions={{ grid: { left: 8, right: 12, top: 42, bottom: 24, containLabel: true } }}
        >
          <EChartsBarChart.Grid />
          <EChartsBarChart.XAxis
            tickFormatter={(value) => `${Number(value).toLocaleString("en-IN")} g`}
          />
          <EChartsBarChart.YAxis dataKey="name" tickFormatter={shortLabel} hideDots />
          <EChartsBarChart.Tooltip
            variant="frosted-glass"
            roundness="lg"
            valueFormatter={(value) =>
              `${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })} g`
            }
          />
          <EChartsBarChart.Legend align="left" verticalAlign="top" isClickable />
          <EChartsBarChart.Bar dataKey="declared" variant="gradient" enableHoverHighlight />
          <EChartsBarChart.Bar dataKey="itemized" variant="hatched" enableHoverHighlight />
        </EChartsBarChart>
      </AnalyticsChartCard>
    </div>
  );
}
