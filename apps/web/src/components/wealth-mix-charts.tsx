"use client";
import { useAmountFormat } from "@/components/amount-preferences";

import { AnalyticsChartCard } from "@/components/analytics-chart-card";
import { AllocationPieChart } from "@/components/allocation-pie-chart";
import { formatPercent } from "@/lib/format";
import { type ChartConfig } from "@portfolio/ui/components/evilcharts/charts/echarts-pie-chart";
import { UNIFIED_CATEGORICAL_PALETTE, UNIFIED_CHART_CONFIGS } from "@portfolio/ui/lib/chart-theme";

const palette = UNIFIED_CATEGORICAL_PALETTE;

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
  const { formatCurrency } = useAmountFormat();
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
  const liquidityConfig = UNIFIED_CHART_CONFIGS.wealthMix satisfies ChartConfig;

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 px-4 xl:grid-cols-2 lg:px-6">
      <AnalyticsChartCard
        id="wealth-mix"
        title="Wealth mix"
        description="Every valued asset grouped by its role in your portfolio."
        metric={formatCurrency(netWorth, currency)}
        metricLabel="total net worth"
      >
        <AllocationPieChart
          data={allocationData}
          config={allocationConfig}
          currency={currency}
          ariaLabel="Wealth mix breakdown"
        />
      </AnalyticsChartCard>

      <AnalyticsChartCard
        id="liquidity-structure"
        title="Liquidity structure"
        description="How much wealth is readily available versus tied to long-term assets."
        metric={formatPercent(netWorth === 0 ? 0 : liquidValue / netWorth, 0)}
        metricLabel="of net worth is liquid"
      >
        <AllocationPieChart
          data={liquidityData}
          config={liquidityConfig}
          currency={currency}
          ariaLabel="Liquidity structure breakdown"
        />
      </AnalyticsChartCard>
    </div>
  );
}
