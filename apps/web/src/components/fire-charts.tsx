"use client";

import { AnalyticsChartCard } from "@/components/analytics-chart-card";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";
import {
  EChartsComposedChart,
  type ChartConfig as ComposedChartConfig,
} from "@portfolio/ui/components/evilcharts/charts/echarts-composed-chart";
import {
  EChartsLineChart,
  type ChartConfig as LineChartConfig,
} from "@portfolio/ui/components/evilcharts/charts/echarts-line-chart";
import { Button } from "@portfolio/ui/components/button";
import { useState } from "react";

type ScenarioResult = {
  id: string;
  name: string;
  retirementYear: number;
  deterministic: Array<{
    year: number;
    closingBalance: number;
    expenses: number;
    income: number;
    oneTimeCosts: number;
  }>;
  monteCarlo: Array<{ year: number; p10: number; median: number; p90: number }>;
};

const projectionConfig = {
  p10: { label: "Conservative (P10)", colors: { light: ["#dc2626"], dark: ["#f87171"] } },
  median: {
    label: "Median outcome",
    colors: { light: ["#2563eb", "#7c3aed"], dark: ["#60a5fa", "#a78bfa"] },
  },
  p90: { label: "Optimistic (P90)", colors: { light: ["#059669"], dark: ["#34d399"] } },
  deterministic: {
    label: "Expected path",
    colors: { light: ["#ca8a04"], dark: ["#facc15"] },
  },
} satisfies LineChartConfig;

const cashFlowConfig = {
  expenses: {
    label: "Living expenses",
    colors: { light: ["#2563eb", "#7c3aed"], dark: ["#60a5fa", "#a78bfa"] },
  },
  oneTimeCosts: {
    label: "One-time costs",
    colors: { light: ["#dc2626"], dark: ["#f87171"] },
  },
  income: { label: "Other income", colors: { light: ["#059669"], dark: ["#34d399"] } },
} satisfies ComposedChartConfig;

export function FireCharts({ results, currency }: { results: ScenarioResult[]; currency: string }) {
  const [selectedId, setSelectedId] = useState(results[0]?.id ?? "");
  const selected = results.find((result) => result.id === selectedId) ?? results[0];
  if (!selected) return null;

  const expectedByYear = new Map(
    selected.deterministic.map((row) => [row.year, row.closingBalance]),
  );
  const projection = selected.monteCarlo.map((point) => ({
    ...point,
    deterministic: expectedByYear.get(point.year) ?? 0,
  }));
  const cashFlows = selected.deterministic
    .filter((row) => row.year >= selected.retirementYear)
    .map((row) => ({
      year: row.year,
      expenses: row.expenses,
      income: row.income,
      oneTimeCosts: row.oneTimeCosts,
    }));
  const finalProjection = projection.at(-1);
  const retirementSpend = cashFlows[0];

  return (
    <div className="min-w-0 space-y-4 px-4 lg:px-6">
      <div className="flex flex-wrap gap-2">
        {results.map((result) => (
          <Button
            key={result.id}
            variant={result.id === selected.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedId(result.id)}
          >
            {result.name}
          </Button>
        ))}
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <AnalyticsChartCard
          title="Range of possible outcomes"
          description={`1,000 reproducible return-and-inflation paths for ${selected.name}; a risk range, not a guarantee.`}
          metric={finalProjection ? formatCompactCurrency(finalProjection.median, currency) : "—"}
          metricLabel="median final balance"
        >
          <EChartsLineChart
            data={projection}
            config={projectionConfig}
            xDataKey="year"
            curveType="monotone"
            enableHoverReveal
            className="h-[330px] min-w-0 w-full"
            chartOptions={{ grid: { left: 8, right: 12, top: 48, bottom: 28, containLabel: true } }}
          >
            <EChartsLineChart.Grid />
            <EChartsLineChart.XAxis dataKey="year" hideDots />
            <EChartsLineChart.YAxis
              tickFormatter={(value) => formatCompactCurrency(value, currency)}
              hideDots
            />
            <EChartsLineChart.Tooltip
              variant="frosted-glass"
              roundness="lg"
              valueFormatter={(value) => formatCurrency(value, currency)}
            />
            <EChartsLineChart.Legend align="left" verticalAlign="top" isClickable />
            <EChartsLineChart.Line dataKey="p90" strokeWidth={1.5} isClickable>
              <EChartsLineChart.ActiveDot variant="colored-border" />
            </EChartsLineChart.Line>
            <EChartsLineChart.Line dataKey="median" strokeWidth={2.5} glowing isClickable>
              <EChartsLineChart.ActiveDot variant="ping" />
            </EChartsLineChart.Line>
            <EChartsLineChart.Line
              dataKey="p10"
              strokeVariant="dashed"
              strokeWidth={1.5}
              isClickable
            />
            <EChartsLineChart.Line
              dataKey="deterministic"
              strokeVariant="dashed"
              strokeWidth={2}
              isClickable
            />
          </EChartsLineChart>
        </AnalyticsChartCard>

        <AnalyticsChartCard
          title="Retirement cash-flow map"
          description="Inflation-adjusted living costs, planned events and non-portfolio income by year."
          metric={
            retirementSpend
              ? formatCompactCurrency(
                  retirementSpend.expenses + retirementSpend.oneTimeCosts,
                  currency,
                )
              : "—"
          }
          metricLabel="first retirement-year outflow"
        >
          <EChartsComposedChart
            data={cashFlows}
            config={cashFlowConfig}
            xDataKey="year"
            curveType="monotone"
            className="h-[330px] min-w-0 w-full"
            chartOptions={{ grid: { left: 8, right: 12, top: 48, bottom: 28, containLabel: true } }}
          >
            <EChartsComposedChart.Grid />
            <EChartsComposedChart.XAxis dataKey="year" hideDots />
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
            <EChartsComposedChart.Bar
              dataKey="expenses"
              variant="default"
              glow
              isClickable
              barProps={{ stack: "outflow" }}
            />
            <EChartsComposedChart.Bar
              dataKey="oneTimeCosts"
              variant="hatched"
              isClickable
              barProps={{ stack: "outflow" }}
            />
            <EChartsComposedChart.Line dataKey="income" glow isClickable>
              <EChartsComposedChart.ActiveDot variant="ping" />
            </EChartsComposedChart.Line>
          </EChartsComposedChart>
        </AnalyticsChartCard>
      </div>
    </div>
  );
}
