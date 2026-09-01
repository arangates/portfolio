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

const flowConfig = {
  contributions: {
    label: "Contributions",
    colors: { light: ["#2563eb", "#7c3aed"], dark: ["#60a5fa", "#a78bfa"] },
  },
  withdrawals: { label: "Withdrawals", colors: { light: ["#059669"], dark: ["#34d399"] } },
  cumulativeNetContributions: {
    label: "Cumulative net contributions",
    colors: { light: ["#ca8a04"], dark: ["#facc15"] },
  },
} satisfies ComposedChartConfig;

const returnConfig = {
  value: {
    label: "Annualized return",
    colors: { light: ["#7c3aed", "#2563eb"], dark: ["#a78bfa", "#60a5fa"] },
  },
} satisfies BarChartConfig;

const intervalConfig = {
  value: {
    label: "Modified Dietz interval",
    colors: { light: ["#0891b2", "#2563eb"], dark: ["#22d3ee", "#60a5fa"] },
  },
} satisfies BarChartConfig;

type FlowPoint = {
  month: string;
  contributions: number;
  withdrawals: number;
  cumulativeNetContributions: number;
};

function FlowChart({
  id,
  title,
  description,
  data,
  currency,
}: {
  id: string;
  title: string;
  description: string;
  data: FlowPoint[];
  currency: string;
}) {
  const visible = data.slice(-48);
  const cumulative = visible.at(-1)?.cumulativeNetContributions ?? 0;
  return (
    <AnalyticsChartCard
      id={id}
      title={title}
      description={description}
      metric={formatCurrency(cumulative, currency)}
      metricLabel="cumulative net contribution"
    >
      <EChartsComposedChart
        data={visible}
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
        <EChartsComposedChart.Bar dataKey="contributions" variant="default" isClickable />
        <EChartsComposedChart.Bar dataKey="withdrawals" variant="hatched" isClickable />
        <EChartsComposedChart.Line dataKey="cumulativeNetContributions" glow isClickable>
          <EChartsComposedChart.ActiveDot variant="ping" />
        </EChartsComposedChart.Line>
      </EChartsComposedChart>
    </AnalyticsChartCard>
  );
}

export function VerifiedReturnsCharts({
  scopes,
}: {
  scopes: Array<{
    id: "zerodha" | "degiro";
    label: string;
    currency: string;
    monthly: FlowPoint[];
    intervals: Array<{ from: string; to: string; return: number | null }>;
    positions: Array<{ name: string; currentValue: number; xirr: number | null }>;
  }>;
}) {
  const zerodha = scopes.find((scope) => scope.id === "zerodha");
  const degiro = scopes.find((scope) => scope.id === "degiro");
  const instrumentReturns = scopes
    .flatMap((scope) =>
      scope.positions
        .filter((position) => position.xirr !== null && Number.isFinite(position.xirr))
        .map((position) => ({
          name: `${scope.id === "zerodha" ? "IN" : "EU"} · ${position.name}`,
          value: position.xirr! * 100,
          currentValue: position.currentValue,
        })),
    )
    .sort((left, right) => right.currentValue - left.currentValue)
    .slice(0, 12);
  const intervalData =
    zerodha?.intervals
      .filter((interval) => interval.return !== null)
      .map((interval) => ({
        name: `${interval.from.slice(5)} → ${interval.to.slice(5)}`,
        value: interval.return! * 100,
      })) ?? [];

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 px-4 xl:grid-cols-2 lg:px-6">
      {zerodha ? (
        <FlowChart
          id="verified-indian-cash-flows"
          title="Indian investor cash flows"
          description="Reconciled purchases and redemptions; excluded instruments stay out of the return calculation."
          data={zerodha.monthly}
          currency={zerodha.currency}
        />
      ) : null}
      {degiro ? (
        <FlowChart
          id="global-account-cash-flows"
          title="Degiro external cash flows"
          description="Only bank deposits and withdrawals; trades, FX conversions and cash sweeps remain internal."
          data={degiro.monthly}
          currency={degiro.currency}
        />
      ) : null}
      {instrumentReturns.length > 0 ? (
        <AnalyticsChartCard
          id="instrument-money-weighted-returns"
          title="Annualized return by instrument"
          description="XIRR for the largest positions with a solvable, non-ambiguous cash-flow history."
          metric={`${instrumentReturns.length}`}
          metricLabel="comparable instruments"
        >
          <EChartsBarChart
            data={instrumentReturns}
            config={returnConfig}
            xDataKey="name"
            layout="horizontal"
            className="h-[420px] min-w-0 w-full"
            barRadius={5}
            chartOptions={{ grid: { left: 8, right: 12, top: 16, bottom: 24, containLabel: true } }}
          >
            <EChartsBarChart.Grid />
            <EChartsBarChart.XAxis tickFormatter={(value) => `${Number(value).toFixed(0)}%`} />
            <EChartsBarChart.YAxis
              dataKey="name"
              tickFormatter={(value) => (value.length > 28 ? `${value.slice(0, 27)}…` : value)}
              hideDots
            />
            <EChartsBarChart.Tooltip
              variant="frosted-glass"
              roundness="lg"
              valueFormatter={(value) => formatPercent(value / 100, 2)}
            />
            <EChartsBarChart.Bar dataKey="value" variant="default" enableHoverHighlight />
          </EChartsBarChart>
        </AnalyticsChartCard>
      ) : null}
      {intervalData.length > 0 ? (
        <AnalyticsChartCard
          id="snapshot-linked-return"
          title="Snapshot interval returns"
          description="Modified Dietz estimates between Zerodha valuations—not true time-weighted returns."
          metric={formatPercent(zerodha?.intervals.at(-1)?.return ?? 0, 2)}
          metricLabel="latest interval estimate"
        >
          <EChartsBarChart
            data={intervalData}
            config={intervalConfig}
            xDataKey="name"
            className="h-[420px] min-w-0 w-full"
            barRadius={6}
            chartOptions={{ grid: { left: 8, right: 12, top: 16, bottom: 28, containLabel: true } }}
          >
            <EChartsBarChart.Grid />
            <EChartsBarChart.XAxis dataKey="name" hideDots />
            <EChartsBarChart.YAxis
              tickFormatter={(value) => `${Number(value).toFixed(1)}%`}
              hideDots
            />
            <EChartsBarChart.Tooltip
              variant="frosted-glass"
              roundness="lg"
              valueFormatter={(value) => formatPercent(value / 100, 2)}
            />
            <EChartsBarChart.Bar dataKey="value" variant="default" glowing enableHoverHighlight />
          </EChartsBarChart>
        </AnalyticsChartCard>
      ) : null}
    </div>
  );
}
