"use client";

import { AnalyticsChartCard } from "@/components/analytics-chart-card";
import {
  formatCompactCurrency,
  formatCurrency,
  formatFullCurrency,
  formatPercent,
} from "@/lib/format";
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
  { light: ["#db2777", "#f472b6"], dark: ["#f472b6", "#f9a8d4"] },
  { light: ["#65a30d", "#a3e635"], dark: ["#a3e635", "#d9f99d"] },
  { light: ["#4f46e5", "#818cf8"], dark: ["#818cf8", "#c7d2fe"] },
  { light: ["#ea580c", "#fb923c"], dark: ["#fb923c", "#fed7aa"] },
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
  const allocationItems = allocation
    .filter((item) => item.value > 0)
    .toSorted((left, right) => right.value - left.value);
  const total = allocationItems.reduce((sum, item) => sum + item.value, 0);
  const latest = equityHistory.at(-1);
  const allocationData = allocationItems.map((item, index) => ({
    id: keyFor(item.category, index),
    value: item.value,
  }));
  const allocationConfig = Object.fromEntries(
    allocationItems.map((item, index) => [
      allocationData[index]!.id,
      { label: item.category, colors: palette[index % palette.length]! },
    ]),
  ) satisfies PieChartConfig;

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 px-4 xl:grid-cols-2 lg:px-6">
      <AnalyticsChartCard
        title={allocationTitle}
        description={`Share of current value by category in ${currency}.`}
        metric={formatCompactCurrency(total, currency)}
        metricTooltip={formatFullCurrency(total, currency)}
        metricLabel="allocated value"
      >
        <div className="grid min-w-0 items-center gap-2 sm:grid-cols-[minmax(220px,0.9fr)_minmax(0,1.1fr)]">
          <EChartsPieChart
            data={allocationData}
            config={allocationConfig}
            dataKey="value"
            nameKey="id"
            className="h-[280px] min-w-0 w-full"
          >
            <EChartsPieChart.Pie
              variant="gradient"
              innerRadius="55%"
              outerRadius="82%"
              cornerRadius={5}
              paddingAngle={2}
              isClickable
            />
            <EChartsPieChart.Tooltip
              variant="frosted-glass"
              roundness="lg"
              valueFormatter={(value) => formatCurrency(value, currency)}
            />
          </EChartsPieChart>

          <ul
            className="grid min-w-0 gap-1 px-2 pb-2 sm:max-h-[280px] sm:overflow-y-auto sm:py-2 sm:pr-3"
            aria-label={`${allocationTitle} breakdown`}
          >
            {allocationItems.map((item, index) => {
              const colors = palette[index % palette.length]!;
              return (
                <li
                  key={item.category}
                  className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
                >
                  <span
                    className="size-2.5 shrink-0 rounded-[3px]"
                    style={{
                      background: `linear-gradient(135deg, ${colors.dark[0]}, ${colors.dark[1]})`,
                    }}
                    aria-hidden="true"
                  />
                  <span className="truncate text-xs font-medium" title={item.category}>
                    {item.category}
                  </span>
                  <span
                    className="whitespace-nowrap text-right text-xs font-medium tabular-nums"
                    title={formatFullCurrency(item.value, currency)}
                  >
                    {formatCompactCurrency(item.value, currency)}
                    <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                      · {formatPercent(total === 0 ? 0 : item.value / total, 1)}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
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
            tickFormatter={(value) => formatCompactCurrency(value, historyCurrency)}
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
