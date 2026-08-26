"use client";

import { AnalyticsChartCard } from "@/components/analytics-chart-card";
import { formatCurrency, formatPercent } from "@/lib/format";
import {
  EChartsPieChart,
  type ChartConfig,
} from "@portfolio/ui/components/evilcharts/charts/echarts-pie-chart";

const palette = [
  { light: ["#2563eb", "#60a5fa"], dark: ["#60a5fa", "#93c5fd"] },
  { light: ["#7c3aed", "#a78bfa"], dark: ["#a78bfa", "#c4b5fd"] },
  { light: ["#059669", "#34d399"], dark: ["#34d399", "#6ee7b7"] },
  { light: ["#d97706", "#fbbf24"], dark: ["#fbbf24", "#fde68a"] },
  { light: ["#dc2626", "#fb7185"], dark: ["#f87171", "#fda4af"] },
  { light: ["#0891b2", "#22d3ee"], dark: ["#22d3ee", "#67e8f9"] },
];

function keyFor(category: string, index: number) {
  const key = category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return key ? `${key}-${index}` : `category-${index}`;
}

export function WealthMixCharts({
  allocation,
  netWorth,
  liquidValue,
  currency,
}: {
  allocation: Array<{ category: string; value: number }>;
  netWorth: number;
  liquidValue: number;
  currency: string;
}) {
  const allocationData = allocation.map((item, index) => ({
    id: keyFor(item.category, index),
    value: item.value,
  }));
  const allocationConfig = Object.fromEntries(
    allocation.map((item, index) => [
      allocationData[index]!.id,
      { label: item.category, colors: palette[index % palette.length] },
    ]),
  ) satisfies ChartConfig;
  const illiquidValue = Math.max(0, netWorth - liquidValue);
  const liquidityData = [
    { id: "liquid", value: liquidValue },
    { id: "long-term", value: illiquidValue },
  ];
  const liquidityConfig = {
    liquid: {
      label: "Liquid assets",
      colors: { light: ["#059669", "#34d399"], dark: ["#34d399", "#6ee7b7"] },
    },
    "long-term": {
      label: "Long-term assets",
      colors: { light: ["#2563eb", "#7c3aed"], dark: ["#60a5fa", "#a78bfa"] },
    },
  } satisfies ChartConfig;

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 px-4 xl:grid-cols-2 lg:px-6">
      <AnalyticsChartCard
        id="wealth-mix"
        title="Wealth mix"
        description="Every valued asset grouped by its role in your portfolio."
        metric={formatCurrency(netWorth, currency)}
        metricLabel="total net worth"
      >
        <EChartsPieChart
          data={allocationData}
          config={allocationConfig}
          dataKey="value"
          nameKey="id"
          className="h-[320px] min-w-0 w-full"
        >
          <EChartsPieChart.Background variant="dots" />
          <EChartsPieChart.Pie
            variant="gradient"
            innerRadius="52%"
            outerRadius="78%"
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
        id="liquidity-structure"
        title="Liquidity structure"
        description="How much wealth is readily available versus tied to long-term assets."
        metric={formatPercent(netWorth === 0 ? 0 : liquidValue / netWorth, 0)}
        metricLabel="of net worth is liquid"
      >
        <EChartsPieChart
          data={liquidityData}
          config={liquidityConfig}
          dataKey="value"
          nameKey="id"
          className="h-[320px] min-w-0 w-full"
        >
          <EChartsPieChart.Background variant="cross-hatch" />
          <EChartsPieChart.Pie
            variant="gradient"
            innerRadius="64%"
            outerRadius="82%"
            cornerRadius={8}
            paddingAngle={3}
            startAngle={90}
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
    </div>
  );
}
