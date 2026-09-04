"use client";

import { AnalyticsChartCard } from "@/components/analytics-chart-card";
import { formatCompactCurrency, formatCurrency, formatPercent } from "@/lib/format";
import { EChartsVisualization } from "@portfolio/ui/components/echarts-visualization";
import type { EChartsVisualizationOption } from "@portfolio/ui/components/echarts-visualization";
import { useTheme } from "next-themes";
import { useMemo } from "react";

const COLORS = [
  "#60a5fa",
  "#a78bfa",
  "#34d399",
  "#fbbf24",
  "#fb7185",
  "#22d3ee",
  "#f472b6",
  "#a3e635",
  "#818cf8",
  "#fb923c",
  "#2dd4bf",
  "#e879f9",
];
const HORIZONS = ["1m", "3m", "6m", "1y", "3y", "5y"] as const;
const HORIZON_LABELS = ["1M", "3M", "6M", "1Y", "3Y CAGR", "5Y CAGR"];

type Fund = {
  instrumentId: string;
  schemeCode: number | null;
  shortName: string;
  schemeCategory: string | null;
  marketValue: number;
  investedValue: number;
  unrealizedPnl: number;
  unrealizedReturn: number | null;
  returns: Record<(typeof HORIZONS)[number], number | null>;
  volatility3y: number | null;
  maxDrawdown5y: number | null;
  rolling1y: Array<{ date: string; value: number }>;
  drawdowns: Array<{ date: string; drawdown: number }>;
  returnEligible: boolean;
};

type Category = { category: string; funds: number; marketValue: number };
type Correlation = {
  labels: string[];
  values: Array<{ leftIndex: number; rightIndex: number; value: number | null }>;
};

function chartTheme(dark: boolean) {
  return {
    text: dark ? "#e5e7eb" : "#111827",
    muted: dark ? "#9ca3af" : "#6b7280",
    grid: dark ? "rgba(255,255,255,0.09)" : "rgba(15,23,42,0.10)",
    tooltipBackground: dark ? "rgba(15,15,17,0.94)" : "rgba(255,255,255,0.96)",
    border: dark ? "rgba(255,255,255,0.14)" : "rgba(15,23,42,0.13)",
  };
}

function baseCartesian(dark: boolean) {
  const theme = chartTheme(dark);
  return {
    animationDuration: 500,
    textStyle: { color: theme.text, fontFamily: "var(--font-sans)" },
    tooltip: {
      trigger: "axis" as const,
      confine: true,
      backgroundColor: theme.tooltipBackground,
      borderColor: theme.border,
      textStyle: { color: theme.text },
      axisPointer: { type: "shadow" as const },
    },
    grid: { left: 16, right: 20, top: 24, bottom: 28, containLabel: true },
  };
}

function cleanLabel(value: string, max = 28) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function callbackValue(params: unknown) {
  if (!params || typeof params !== "object" || !("value" in params)) return undefined;
  return (params as { value?: unknown }).value;
}

function callbackName(params: unknown) {
  if (!params || typeof params !== "object" || !("name" in params)) return "";
  const name = (params as { name?: unknown }).name;
  return typeof name === "string" ? name : "";
}

function tupleValue(params: unknown) {
  const value = callbackValue(params);
  return Array.isArray(value) ? value : [];
}

export function MutualFundIntelligenceCharts({
  funds,
  categories,
  correlation,
}: {
  funds: Fund[];
  categories: Category[];
  correlation: Correlation;
}) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const theme = chartTheme(dark);
  const chartFunds = funds.filter((fund) => fund.schemeCode !== null && fund.marketValue > 0);
  const returnFunds = chartFunds.filter((fund) => fund.returnEligible);
  const topLines = returnFunds.slice(0, 5);
  const totalValue = chartFunds.reduce((sum, fund) => sum + fund.marketValue, 0);

  const allocationOption = useMemo<EChartsVisualizationOption>(
    () => ({
      animationDuration: 600,
      color: COLORS,
      textStyle: { color: theme.text, fontFamily: "var(--font-sans)" },
      tooltip: {
        trigger: "item",
        confine: true,
        backgroundColor: theme.tooltipBackground,
        borderColor: theme.border,
        textStyle: { color: theme.text },
        valueFormatter: (value) => formatCurrency(Number(value), "INR"),
      },
      legend: {
        type: "scroll",
        orient: "vertical",
        right: 8,
        top: "middle",
        width: "47%",
        textStyle: { color: theme.text },
        formatter: (name: string) => cleanLabel(name, 32),
      },
      series: [
        {
          type: "pie",
          radius: ["48%", "73%"],
          center: ["27%", "50%"],
          avoidLabelOverlap: true,
          padAngle: 2,
          itemStyle: { borderRadius: 6, borderColor: dark ? "#171717" : "#ffffff", borderWidth: 2 },
          label: { show: false },
          emphasis: { scaleSize: 8, label: { show: false } },
          data: chartFunds.map((fund) => ({ name: fund.shortName, value: fund.marketValue })),
        },
      ],
      media: [
        {
          query: { maxWidth: 620 },
          option: {
            legend: { orient: "horizontal", left: 8, right: 8, top: "72%", width: "auto" },
            series: [{ center: ["50%", "35%"], radius: ["34%", "56%"] }],
          },
        },
      ],
    }),
    [chartFunds, dark, theme],
  );

  const fundAllocationOption = useMemo<EChartsVisualizationOption>(() => {
    const data = chartFunds.slice(0, 15).toReversed();
    return {
      ...baseCartesian(dark),
      xAxis: {
        type: "value",
        axisLabel: {
          color: theme.muted,
          formatter: (value: number) => formatCompactCurrency(value, "INR"),
        },
        splitLine: { lineStyle: { color: theme.grid, type: "dashed" } },
      },
      yAxis: {
        type: "category",
        data: data.map((fund) => cleanLabel(fund.shortName, 27)),
        axisLabel: { color: theme.muted, width: 155, overflow: "truncate" },
        axisTick: { show: false },
        axisLine: { show: false },
      },
      series: [
        {
          type: "bar",
          data: data.map((fund, index) => ({
            value: fund.marketValue,
            itemStyle: { color: COLORS[index % COLORS.length] },
          })),
          barMaxWidth: 18,
          itemStyle: { borderRadius: [0, 5, 5, 0] },
          label: {
            show: true,
            position: "right",
            color: theme.muted,
            formatter: (params: unknown) =>
              formatCompactCurrency(Number(callbackValue(params) ?? 0), "INR"),
          },
        },
      ],
    };
  }, [chartFunds, dark, theme]);

  const pnlOption = useMemo<EChartsVisualizationOption>(() => {
    const data = [...chartFunds].sort((a, b) => a.unrealizedPnl - b.unrealizedPnl).slice(-15);
    return {
      ...baseCartesian(dark),
      xAxis: {
        type: "value",
        axisLabel: {
          color: theme.muted,
          formatter: (value: number) => formatCompactCurrency(value, "INR"),
        },
        splitLine: { lineStyle: { color: theme.grid, type: "dashed" } },
      },
      yAxis: {
        type: "category",
        data: data.map((fund) => cleanLabel(fund.shortName, 26)),
        axisLabel: { color: theme.muted, width: 150, overflow: "truncate" },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: "bar",
          data: data.map((fund) => ({
            value: fund.unrealizedPnl,
            itemStyle: { color: fund.unrealizedPnl >= 0 ? "#34d399" : "#fb7185" },
          })),
          barMaxWidth: 18,
          itemStyle: { borderRadius: 4 },
        },
      ],
    };
  }, [chartFunds, dark, theme]);

  const trailingOption = useMemo<EChartsVisualizationOption>(() => {
    const data = returnFunds
      .filter((fund) => fund.returns["1y"] !== null)
      .sort((a, b) => (a.returns["1y"] ?? 0) - (b.returns["1y"] ?? 0));
    return {
      ...baseCartesian(dark),
      xAxis: {
        type: "value",
        axisLabel: { color: theme.muted, formatter: (value: number) => `${value.toFixed(0)}%` },
        splitLine: { lineStyle: { color: theme.grid, type: "dashed" } },
      },
      yAxis: {
        type: "category",
        data: data.map((fund) => cleanLabel(fund.shortName, 26)),
        axisLabel: { color: theme.muted, width: 150, overflow: "truncate" },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: "bar",
          data: data.map((fund) => {
            const value = (fund.returns["1y"] ?? 0) * 100;
            return { value, itemStyle: { color: value >= 0 ? "#60a5fa" : "#fb7185" } };
          }),
          barMaxWidth: 18,
          itemStyle: { borderRadius: 4 },
          markLine: {
            symbol: "none",
            lineStyle: { color: theme.muted, type: "dashed" },
            data: [{ xAxis: 0 }],
          },
        },
      ],
    };
  }, [dark, returnFunds, theme]);

  const horizonOption = useMemo<EChartsVisualizationOption>(() => {
    const rows = returnFunds.slice(0, 14);
    const data = rows.flatMap((fund, rowIndex) =>
      HORIZONS.map((horizon, columnIndex) => [
        columnIndex,
        rowIndex,
        fund.returns[horizon] === null
          ? "-"
          : Number(((fund.returns[horizon] ?? 0) * 100).toFixed(2)),
      ]),
    );
    return {
      animationDuration: 500,
      tooltip: {
        position: "top",
        confine: true,
        backgroundColor: theme.tooltipBackground,
        borderColor: theme.border,
        textStyle: { color: theme.text },
      },
      grid: { left: 14, right: 18, top: 18, bottom: 24, containLabel: true },
      xAxis: {
        type: "category",
        data: HORIZON_LABELS,
        axisLabel: { color: theme.muted },
        splitArea: { show: true },
      },
      yAxis: {
        type: "category",
        data: rows.map((fund) => cleanLabel(fund.shortName, 23)),
        axisLabel: { color: theme.muted, width: 145, overflow: "truncate" },
        splitArea: { show: true },
      },
      visualMap: {
        min: -30,
        max: 30,
        calculable: false,
        orient: "horizontal",
        left: "center",
        bottom: 0,
        show: false,
        inRange: { color: ["#fb7185", dark ? "#27272a" : "#f3f4f6", "#34d399"] },
      },
      series: [
        {
          type: "heatmap",
          data,
          label: {
            show: true,
            color: theme.text,
            formatter: (params: unknown) => {
              const value = tupleValue(params)[2];
              return typeof value === "number" ? `${value.toFixed(1)}%` : "—";
            },
          },
          itemStyle: { borderColor: dark ? "#18181b" : "#ffffff", borderWidth: 2, borderRadius: 3 },
          emphasis: { itemStyle: { shadowBlur: 8, shadowColor: "rgba(0,0,0,0.25)" } },
        },
      ],
    };
  }, [dark, returnFunds, theme]);

  const riskReturnOption = useMemo<EChartsVisualizationOption>(() => {
    const data = returnFunds
      .filter((fund) => fund.volatility3y !== null && fund.returns["3y"] !== null)
      .map((fund, index) => ({
        name: fund.shortName,
        value: [
          Number(((fund.volatility3y ?? 0) * 100).toFixed(2)),
          Number(((fund.returns["3y"] ?? 0) * 100).toFixed(2)),
          fund.marketValue,
        ],
        itemStyle: { color: COLORS[index % COLORS.length] },
      }));
    return {
      ...baseCartesian(dark),
      tooltip: {
        trigger: "item",
        confine: true,
        backgroundColor: theme.tooltipBackground,
        borderColor: theme.border,
        textStyle: { color: theme.text },
        formatter: (params: unknown) => {
          const value = tupleValue(params);
          return `${callbackName(params)}<br/>3Y CAGR: ${Number(value[1] ?? 0).toFixed(2)}%<br/>Volatility: ${Number(value[0] ?? 0).toFixed(2)}%<br/>Value: ${formatCurrency(Number(value[2] ?? 0), "INR")}`;
        },
      },
      xAxis: {
        type: "value",
        name: "Annualized volatility (3Y)",
        nameLocation: "middle",
        nameGap: 28,
        nameTextStyle: { color: theme.muted },
        axisLabel: { color: theme.muted, formatter: "{value}%" },
        splitLine: { lineStyle: { color: theme.grid, type: "dashed" } },
      },
      yAxis: {
        type: "value",
        name: "3Y CAGR",
        nameTextStyle: { color: theme.muted },
        axisLabel: { color: theme.muted, formatter: "{value}%" },
        splitLine: { lineStyle: { color: theme.grid, type: "dashed" } },
      },
      series: [
        {
          type: "scatter",
          data,
          symbolSize: (value: number[]) =>
            Math.max(12, Math.min(44, Math.sqrt(value[2] ?? 0) / 18)),
          emphasis: { focus: "self", scale: 1.25 },
          label: { show: data.length <= 8, position: "top", color: theme.muted, formatter: "{b}" },
        },
      ],
    };
  }, [dark, returnFunds, theme]);

  const correlationOption = useMemo<EChartsVisualizationOption>(
    () => ({
      animationDuration: 500,
      tooltip: {
        confine: true,
        backgroundColor: theme.tooltipBackground,
        borderColor: theme.border,
        textStyle: { color: theme.text },
        formatter: (params: unknown) => {
          const [x, y, value] = tupleValue(params);
          return `${correlation.labels[y] ?? ""} × ${correlation.labels[x] ?? ""}<br/>Correlation: ${typeof value === "number" ? value.toFixed(3) : "insufficient history"}`;
        },
      },
      grid: { left: 20, right: 20, top: 16, bottom: 20, containLabel: true },
      xAxis: {
        type: "category",
        data: correlation.labels.map((label) => cleanLabel(label, 12)),
        axisLabel: { color: theme.muted, rotate: 45, interval: 0, fontSize: 10 },
        splitArea: { show: true },
      },
      yAxis: {
        type: "category",
        data: correlation.labels.map((label) => cleanLabel(label, 12)),
        axisLabel: { color: theme.muted, fontSize: 10, width: 90, overflow: "truncate" },
        splitArea: { show: true },
      },
      visualMap: {
        min: -1,
        max: 1,
        show: false,
        inRange: { color: ["#fb7185", dark ? "#27272a" : "#f8fafc", "#60a5fa"] },
      },
      series: [
        {
          type: "heatmap",
          data: correlation.values.map((item) => [
            item.rightIndex,
            item.leftIndex,
            item.value ?? "-",
          ]),
          label: {
            show: correlation.labels.length <= 9,
            color: theme.text,
            formatter: (params: unknown) => {
              const value = tupleValue(params)[2];
              return typeof value === "number" ? value.toFixed(2) : "—";
            },
          },
          itemStyle: { borderColor: dark ? "#18181b" : "#ffffff", borderWidth: 2, borderRadius: 2 },
        },
      ],
    }),
    [correlation, dark, theme],
  );

  const rollingOption = useMemo<EChartsVisualizationOption>(
    () => ({
      ...baseCartesian(dark),
      color: COLORS,
      tooltip: {
        ...baseCartesian(dark).tooltip,
        trigger: "axis",
        valueFormatter: (value) => formatPercent(Number(value), 1),
      },
      legend: { type: "scroll", top: 0, textStyle: { color: theme.muted } },
      grid: { left: 12, right: 18, top: 48, bottom: 26, containLabel: true },
      xAxis: { type: "time", axisLabel: { color: theme.muted }, splitLine: { show: false } },
      yAxis: {
        type: "value",
        axisLabel: { color: theme.muted, formatter: (value: number) => formatPercent(value, 0) },
        splitLine: { lineStyle: { color: theme.grid, type: "dashed" } },
      },
      series: topLines.map((fund) => ({
        type: "line",
        name: cleanLabel(fund.shortName, 24),
        data: fund.rolling1y.map((point) => [point.date, point.value]),
        showSymbol: false,
        smooth: 0.2,
        lineStyle: { width: 2 },
        emphasis: { focus: "series" },
      })),
    }),
    [dark, theme, topLines],
  );

  const drawdownOption = useMemo<EChartsVisualizationOption>(
    () => ({
      ...baseCartesian(dark),
      color: COLORS,
      tooltip: {
        ...baseCartesian(dark).tooltip,
        trigger: "axis",
        valueFormatter: (value) => formatPercent(Number(value), 1),
      },
      legend: { type: "scroll", top: 0, textStyle: { color: theme.muted } },
      grid: { left: 12, right: 18, top: 48, bottom: 26, containLabel: true },
      xAxis: { type: "time", axisLabel: { color: theme.muted }, splitLine: { show: false } },
      yAxis: {
        type: "value",
        max: 0,
        axisLabel: { color: theme.muted, formatter: (value: number) => formatPercent(value, 0) },
        splitLine: { lineStyle: { color: theme.grid, type: "dashed" } },
      },
      series: topLines.map((fund) => ({
        type: "line",
        name: cleanLabel(fund.shortName, 24),
        data: fund.drawdowns.map((point) => [point.date, point.drawdown]),
        showSymbol: false,
        smooth: false,
        lineStyle: { width: 1.5 },
        areaStyle: { opacity: 0.04 },
        emphasis: { focus: "series" },
      })),
    }),
    [dark, theme, topLines],
  );

  const categoriesOption = useMemo<EChartsVisualizationOption>(
    () => ({
      ...baseCartesian(dark),
      xAxis: {
        type: "category",
        data: categories.map((category) => cleanLabel(category.category, 18)),
        axisLabel: { color: theme.muted, rotate: categories.length > 5 ? 25 : 0, interval: 0 },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: theme.grid } },
      },
      yAxis: {
        type: "value",
        minInterval: 1,
        axisLabel: { color: theme.muted },
        splitLine: { lineStyle: { color: theme.grid, type: "dashed" } },
      },
      series: [
        {
          type: "bar",
          data: categories.map((category, index) => ({
            value: category.funds,
            itemStyle: { color: category.funds > 1 ? "#fbbf24" : COLORS[index % COLORS.length] },
          })),
          barMaxWidth: 36,
          itemStyle: { borderRadius: [5, 5, 0, 0] },
          label: { show: true, position: "top", color: theme.muted },
        },
      ],
    }),
    [categories, dark, theme],
  );

  const totalPnl = chartFunds.reduce((sum, fund) => sum + fund.unrealizedPnl, 0);
  const weightedReturnFunds = returnFunds.filter((fund) => fund.returns["1y"] !== null);
  const weightedReturnValue = weightedReturnFunds.reduce((sum, fund) => sum + fund.marketValue, 0);
  const weightedReturn =
    weightedReturnValue > 0
      ? weightedReturnFunds.reduce(
          (sum, fund) => sum + (fund.returns["1y"] ?? 0) * fund.marketValue,
          0,
        ) / weightedReturnValue
      : null;

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 px-4 xl:grid-cols-2 lg:px-6">
      <AnalyticsChartCard
        title="Portfolio allocation"
        description="Current imported market value by exactly matched mutual-fund scheme."
        metric={formatCompactCurrency(totalValue, "INR")}
        metricLabel={`${chartFunds.length} linked funds`}
      >
        <EChartsVisualization
          option={allocationOption}
          className="h-[390px] w-full"
          ariaLabel="Mutual fund portfolio allocation donut chart"
        />
      </AnalyticsChartCard>
      <AnalyticsChartCard
        title="Individual fund allocation"
        description="Current value by fund; position size is not a recommendation."
        metric={chartFunds[0] ? formatCompactCurrency(chartFunds[0].marketValue, "INR") : "—"}
        metricLabel="largest position"
      >
        <EChartsVisualization
          option={fundAllocationOption}
          className="h-[390px] w-full"
          ariaLabel="Individual mutual fund allocation bar chart"
        />
      </AnalyticsChartCard>
      <AnalyticsChartCard
        title="Unrealized P&L by fund"
        description="Statement-reported current value minus cost basis; not time-weighted performance."
        metric={formatCompactCurrency(totalPnl, "INR")}
        metricLabel="current unrealized P&L"
      >
        <EChartsVisualization
          option={pnlOption}
          className="h-[390px] w-full"
          ariaLabel="Unrealized profit and loss by mutual fund"
        />
      </AnalyticsChartCard>
      <AnalyticsChartCard
        title="One-year scheme return"
        description="Point-to-point Growth-option NAV return from MFAPI; independent of your cash-flow timing."
        metric={
          weightedReturn === null || !Number.isFinite(weightedReturn)
            ? "—"
            : formatPercent(weightedReturn, 1)
        }
        metricLabel="current-value weighted"
      >
        <EChartsVisualization
          option={trailingOption}
          className="h-[390px] w-full"
          ariaLabel="One-year mutual fund NAV returns"
        />
      </AnalyticsChartCard>
      <AnalyticsChartCard
        title="Performance across horizons"
        description="Simple return below one year; annualized CAGR at one year and beyond. Missing history stays blank."
      >
        <EChartsVisualization
          option={horizonOption}
          className="h-[430px] w-full"
          ariaLabel="Mutual fund performance horizon heatmap"
        />
      </AnalyticsChartCard>
      <AnalyticsChartCard
        title="Risk versus return"
        description="Three-year CAGR versus annualized daily NAV volatility; bubble size is current value."
      >
        <EChartsVisualization
          option={riskReturnOption}
          className="h-[430px] w-full"
          ariaLabel="Mutual fund risk return scatter chart"
        />
      </AnalyticsChartCard>
      <AnalyticsChartCard
        title="NAV-return correlation"
        description="Correlation of aligned daily returns over up to three years. This is not stock overlap."
      >
        <EChartsVisualization
          option={correlationOption}
          className="h-[470px] w-full"
          ariaLabel="Mutual fund NAV return correlation heatmap"
        />
      </AnalyticsChartCard>
      <AnalyticsChartCard
        title="Category redundancy signal"
        description="Number of owned schemes per MFAPI category. Multiple funds can still hold different stocks."
      >
        <EChartsVisualization
          option={categoriesOption}
          className="h-[470px] w-full"
          ariaLabel="Mutual fund count by category"
        />
      </AnalyticsChartCard>
      <AnalyticsChartCard
        title="Rolling one-year returns"
        description="One-year annualized return recalculated through time for the five largest eligible funds."
      >
        <EChartsVisualization
          option={rollingOption}
          className="h-[360px] w-full"
          ariaLabel="Rolling one-year mutual fund returns"
        />
      </AnalyticsChartCard>
      <AnalyticsChartCard
        title="Five-year drawdowns"
        description="Decline from each fund's prior NAV peak; the five largest eligible funds are shown."
      >
        <EChartsVisualization
          option={drawdownOption}
          className="h-[360px] w-full"
          ariaLabel="Mutual fund drawdown history"
        />
      </AnalyticsChartCard>
    </div>
  );
}
