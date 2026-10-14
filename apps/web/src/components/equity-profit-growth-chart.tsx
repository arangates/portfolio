"use client";

import { useAmountFormat } from "@/components/amount-preferences";
import { AnalyticsChartCard } from "@/components/analytics-chart-card";
import { formatCompactCurrency, formatFullCurrency, formatPercent } from "@/lib/format";
import {
  calculateEquityProfitGrowth,
  type EquityHistoryInput,
} from "@portfolio/api/equity-profit-calculations";
import type { StoredExchangeRate } from "@portfolio/api/currency-conversion";
import {
  EChartsAreaChart,
  type ChartConfig as AreaChartConfig,
} from "@portfolio/ui/components/evilcharts/charts/echarts-area-chart";
import { Tabs, TabsList, TabsTrigger } from "@portfolio/ui/components/tabs";
import { useMemo, useState } from "react";

const combinedConfig = {
  totalProfitBase: {
    label: "Total equity profit",
    colors: { light: ["#059669", "#10b981"], dark: ["#10b981", "#6ee7b7"] },
  },
  indianProfitBase: {
    label: "Indian equity profit",
    colors: { light: ["#ea580c", "#f97316"], dark: ["#f97316", "#fdba74"] },
  },
  globalProfitBase: {
    label: "Global equity profit",
    colors: { light: ["#0284c7", "#38bdf8"], dark: ["#38bdf8", "#bae6fd"] },
  },
} satisfies AreaChartConfig;

const percentConfig = {
  totalReturnPercent: {
    label: "Combined return %",
    colors: { light: ["#059669", "#10b981"], dark: ["#10b981", "#6ee7b7"] },
  },
  indianReturnPercent: {
    label: "Indian return %",
    colors: { light: ["#ea580c", "#f97316"], dark: ["#f97316", "#fdba74"] },
  },
  globalReturnPercent: {
    label: "Global return %",
    colors: { light: ["#0284c7", "#38bdf8"], dark: ["#38bdf8", "#bae6fd"] },
  },
} satisfies AreaChartConfig;

const indianConfig = {
  indianProfitInr: {
    label: "Indian equity profit",
    colors: { light: ["#ea580c", "#f97316"], dark: ["#f97316", "#fdba74"] },
  },
} satisfies AreaChartConfig;

const globalConfig = {
  globalProfitEur: {
    label: "Global equity profit",
    colors: { light: ["#0284c7", "#38bdf8"], dark: ["#38bdf8", "#bae6fd"] },
  },
} satisfies AreaChartConfig;

type ViewMode = "combined" | "percent" | "indian" | "global";

export function EquityProfitGrowthChart({
  indianHistory = [],
  globalHistory = [],
  rates = [],
  baseCurrency = "EUR",
  id = "equity-profit-growth",
  title = "Equity profit growth",
  description = "Historical growth of unrealized profit across Indian equity and Global equity, without the distorting scale of invested principal.",
  defaultMode,
  showModeTabs = true,
}: {
  indianHistory?: EquityHistoryInput[];
  globalHistory?: EquityHistoryInput[];
  rates?: StoredExchangeRate[];
  baseCurrency?: string;
  id?: string;
  title?: string;
  description?: string;
  defaultMode?: ViewMode;
  showModeTabs?: boolean;
}) {
  const { formatCurrency } = useAmountFormat();

  const { timeline, summary } = useMemo(
    () =>
      calculateEquityProfitGrowth({
        indianHistory,
        globalHistory,
        rates,
        baseCurrency,
      }),
    [indianHistory, globalHistory, rates, baseCurrency],
  );

  const initialMode: ViewMode = useMemo(() => {
    if (defaultMode) return defaultMode;
    if (summary.hasIndianData && summary.hasGlobalData) return "combined";
    if (summary.hasIndianData) return "indian";
    return "global";
  }, [defaultMode, summary.hasIndianData, summary.hasGlobalData]);

  const [mode, setMode] = useState<ViewMode>(initialMode);

  if (!summary.hasData) {
    return null;
  }

  const metricValue = (() => {
    switch (mode) {
      case "combined":
        return formatCurrency(summary.latestTotalProfitBase, baseCurrency);
      case "percent":
        return formatPercent(summary.latestTotalReturnPercent / 100, 2);
      case "indian":
        return formatCurrency(summary.latestIndianProfitInr, "INR");
      case "global":
        return formatCurrency(summary.latestGlobalProfitEur, "EUR");
    }
  })();

  const metricTooltip = (() => {
    switch (mode) {
      case "combined":
        return formatFullCurrency(summary.latestTotalProfitBase, baseCurrency);
      case "percent":
        return `${summary.latestTotalReturnPercent.toFixed(2)}%`;
      case "indian":
        return formatFullCurrency(summary.latestIndianProfitInr, "INR");
      case "global":
        return formatFullCurrency(summary.latestGlobalProfitEur, "EUR");
    }
  })();

  const metricLabel = (() => {
    switch (mode) {
      case "combined":
        return summary.latestTotalProfitBase >= 0 ? "total equity profit" : "total equity loss";
      case "percent":
        return "combined return on investment";
      case "indian":
        return "Indian equity unrealized P&L";
      case "global":
        return "Global equity unrealized P&L";
    }
  })();

  return (
    <AnalyticsChartCard
      id={id}
      title={title}
      description={description}
      metric={metricValue}
      metricTooltip={metricTooltip}
      metricLabel={metricLabel}
      chartHeader={
        <div className="flex flex-col gap-3 px-3 pt-2 pb-1 sm:px-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {showModeTabs && (summary.hasIndianData || summary.hasGlobalData) ? (
              <Tabs
                value={mode}
                onValueChange={(val) => setMode(val as ViewMode)}
                aria-label="Equity profit growth view modes"
              >
                <TabsList className="h-8 gap-0 overflow-hidden rounded-lg border bg-background p-0">
                  {summary.hasIndianData && summary.hasGlobalData ? (
                    <TabsTrigger
                      value="combined"
                      className="h-8 px-2.5 text-xs font-medium data-[state=active]:bg-muted"
                    >
                      Combined ({baseCurrency})
                    </TabsTrigger>
                  ) : null}
                  <TabsTrigger
                    value="percent"
                    className="h-8 px-2.5 text-xs font-medium data-[state=active]:bg-muted"
                  >
                    Return %
                  </TabsTrigger>
                  {summary.hasIndianData ? (
                    <TabsTrigger
                      value="indian"
                      className="h-8 px-2.5 text-xs font-medium data-[state=active]:bg-muted"
                    >
                      Indian (INR)
                    </TabsTrigger>
                  ) : null}
                  {summary.hasGlobalData ? (
                    <TabsTrigger
                      value="global"
                      className="h-8 px-2.5 text-xs font-medium data-[state=active]:bg-muted"
                    >
                      Global (EUR)
                    </TabsTrigger>
                  ) : null}
                </TabsList>
              </Tabs>
            ) : (
              <div />
            )}

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {summary.hasIndianData ? (
                <div
                  className="flex items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1 shadow-2xs"
                  title="Indian equity latest unrealized profit"
                >
                  <span className="size-2 rounded-full bg-orange-500" aria-hidden="true" />
                  <span className="text-muted-foreground">Indian:</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatCompactCurrency(summary.latestIndianProfitInr, "INR")}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    ({formatPercent(summary.latestIndianReturnPercent / 100, 1)})
                  </span>
                </div>
              ) : null}
              {summary.hasGlobalData ? (
                <div
                  className="flex items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1 shadow-2xs"
                  title="Global equity latest unrealized profit"
                >
                  <span className="size-2 rounded-full bg-sky-500" aria-hidden="true" />
                  <span className="text-muted-foreground">Global:</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatCompactCurrency(summary.latestGlobalProfitEur, "EUR")}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    ({formatPercent(summary.latestGlobalReturnPercent / 100, 1)})
                  </span>
                </div>
              ) : null}
              {summary.hasIndianData && summary.hasGlobalData ? (
                <div
                  className="flex items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1 shadow-2xs"
                  title="Total combined equity profit converted to base currency"
                >
                  <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatCompactCurrency(summary.latestTotalProfitBase, baseCurrency)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    ({formatPercent(summary.latestTotalReturnPercent / 100, 1)})
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      }
    >
      {mode === "combined" && (
        <EChartsAreaChart
          data={timeline}
          config={combinedConfig}
          xDataKey="label"
          curveType="monotone"
          enableHoverReveal
          className="h-[340px] min-w-0 w-full"
          chartOptions={{ grid: { left: 8, right: 12, top: 42, bottom: 28, containLabel: true } }}
        >
          <EChartsAreaChart.Grid />
          <EChartsAreaChart.XAxis dataKey="label" hideDots />
          <EChartsAreaChart.YAxis
            tickFormatter={(value) => formatCompactCurrency(value, baseCurrency)}
            hideDots
          />
          <EChartsAreaChart.Tooltip
            variant="frosted-glass"
            roundness="lg"
            valueFormatter={(value) => formatCurrency(value, baseCurrency)}
          />
          <EChartsAreaChart.Legend align="left" verticalAlign="top" isClickable />
          <EChartsAreaChart.Area
            dataKey="totalProfitBase"
            variant="gradient"
            strokeWidth={2.5}
            isClickable
          >
            <EChartsAreaChart.ActiveDot variant="ping" />
          </EChartsAreaChart.Area>
          {summary.hasIndianData ? (
            <EChartsAreaChart.Area
              dataKey="indianProfitBase"
              variant="none"
              strokeWidth={2}
              isClickable
            >
              <EChartsAreaChart.ActiveDot variant="colored-border" />
            </EChartsAreaChart.Area>
          ) : null}
          {summary.hasGlobalData ? (
            <EChartsAreaChart.Area
              dataKey="globalProfitBase"
              variant="none"
              strokeVariant="dashed"
              strokeWidth={2}
              isClickable
            >
              <EChartsAreaChart.ActiveDot variant="colored-border" />
            </EChartsAreaChart.Area>
          ) : null}
        </EChartsAreaChart>
      )}

      {mode === "percent" && (
        <EChartsAreaChart
          data={timeline}
          config={percentConfig}
          xDataKey="label"
          curveType="monotone"
          enableHoverReveal
          className="h-[340px] min-w-0 w-full"
          chartOptions={{ grid: { left: 8, right: 12, top: 42, bottom: 28, containLabel: true } }}
        >
          <EChartsAreaChart.Grid />
          <EChartsAreaChart.XAxis dataKey="label" hideDots />
          <EChartsAreaChart.YAxis
            tickFormatter={(value) => `${Number(value).toFixed(1)}%`}
            hideDots
          />
          <EChartsAreaChart.Tooltip
            variant="frosted-glass"
            roundness="lg"
            valueFormatter={(value) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`}
          />
          <EChartsAreaChart.Legend align="left" verticalAlign="top" isClickable />
          <EChartsAreaChart.Area
            dataKey="totalReturnPercent"
            variant="gradient"
            strokeWidth={2.5}
            isClickable
          >
            <EChartsAreaChart.ActiveDot variant="ping" />
          </EChartsAreaChart.Area>
          {summary.hasIndianData ? (
            <EChartsAreaChart.Area
              dataKey="indianReturnPercent"
              variant="none"
              strokeWidth={2}
              isClickable
            >
              <EChartsAreaChart.ActiveDot variant="colored-border" />
            </EChartsAreaChart.Area>
          ) : null}
          {summary.hasGlobalData ? (
            <EChartsAreaChart.Area
              dataKey="globalReturnPercent"
              variant="none"
              strokeVariant="dashed"
              strokeWidth={2}
              isClickable
            >
              <EChartsAreaChart.ActiveDot variant="colored-border" />
            </EChartsAreaChart.Area>
          ) : null}
        </EChartsAreaChart>
      )}

      {mode === "indian" && (
        <EChartsAreaChart
          data={timeline}
          config={indianConfig}
          xDataKey="label"
          curveType="monotone"
          enableHoverReveal
          className="h-[340px] min-w-0 w-full"
          chartOptions={{ grid: { left: 8, right: 12, top: 42, bottom: 28, containLabel: true } }}
        >
          <EChartsAreaChart.Grid />
          <EChartsAreaChart.XAxis dataKey="label" hideDots />
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
          <EChartsAreaChart.Area
            dataKey="indianProfitInr"
            variant="gradient"
            strokeWidth={2.5}
            isClickable
          >
            <EChartsAreaChart.ActiveDot variant="ping" />
          </EChartsAreaChart.Area>
        </EChartsAreaChart>
      )}

      {mode === "global" && (
        <EChartsAreaChart
          data={timeline}
          config={globalConfig}
          xDataKey="label"
          curveType="monotone"
          enableHoverReveal
          className="h-[340px] min-w-0 w-full"
          chartOptions={{ grid: { left: 8, right: 12, top: 42, bottom: 28, containLabel: true } }}
        >
          <EChartsAreaChart.Grid />
          <EChartsAreaChart.XAxis dataKey="label" hideDots />
          <EChartsAreaChart.YAxis
            tickFormatter={(value) => formatCompactCurrency(value, "EUR")}
            hideDots
          />
          <EChartsAreaChart.Tooltip
            variant="frosted-glass"
            roundness="lg"
            valueFormatter={(value) => formatCurrency(value, "EUR")}
          />
          <EChartsAreaChart.Legend align="left" verticalAlign="top" isClickable />
          <EChartsAreaChart.Area
            dataKey="globalProfitEur"
            variant="gradient"
            strokeWidth={2.5}
            isClickable
          >
            <EChartsAreaChart.ActiveDot variant="ping" />
          </EChartsAreaChart.Area>
        </EChartsAreaChart>
      )}
    </AnalyticsChartCard>
  );
}
