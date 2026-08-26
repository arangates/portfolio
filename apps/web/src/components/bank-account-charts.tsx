"use client";

import { AnalyticsChartCard } from "@/components/analytics-chart-card";
import { formatCurrency } from "@/lib/format";
import {
  EChartsAreaChart,
  type ChartConfig as AreaChartConfig,
} from "@portfolio/ui/components/evilcharts/charts/echarts-area-chart";
import {
  EChartsBarChart,
  type ChartConfig as BarChartConfig,
} from "@portfolio/ui/components/evilcharts/charts/echarts-bar-chart";

const balanceConfig = {
  balance: {
    label: "Current balance",
    colors: { light: ["#2563eb", "#7c3aed"], dark: ["#60a5fa", "#a78bfa"] },
  },
} satisfies BarChartConfig;
const headroomConfig = {
  balance: { label: "Current balance", colors: { light: ["#2563eb"], dark: ["#60a5fa"] } },
  minimum: { label: "Required minimum", colors: { light: ["#d97706"], dark: ["#fbbf24"] } },
} satisfies BarChartConfig;
const historyConfig = {
  value: {
    label: "Total INR cash",
    colors: { light: ["#059669", "#2563eb"], dark: ["#34d399", "#60a5fa"] },
  },
} satisfies AreaChartConfig;

function compact(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function shortLabel(value: string) {
  return value.length > 23 ? `${value.slice(0, 22)}…` : value;
}

export function BankAccountCharts({
  accounts,
  history,
}: {
  accounts: Array<{
    id: string;
    institution: string;
    name: string;
    amount: number;
    minimumBalance: number | null;
  }>;
  history: Array<{ date: string; value: number }>;
}) {
  const data = [...accounts]
    .sort((left, right) => right.amount - left.amount)
    .map((account) => ({
      name: `${account.institution} · ${account.name}`,
      balance: account.amount,
      minimum: account.minimumBalance ?? 0,
    }));
  const total = accounts.reduce((sum, account) => sum + account.amount, 0);
  const latestHistory = history.at(-1)?.value ?? total;

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 px-4 xl:grid-cols-2 lg:px-6">
      <AnalyticsChartCard
        title="Cash by account"
        description="Latest dated balance for every INR account, sorted by value."
        metric={formatCurrency(total, "INR")}
        metricLabel="total INR cash"
      >
        <EChartsBarChart
          data={data}
          config={balanceConfig}
          xDataKey="name"
          layout="horizontal"
          className="h-[320px] min-w-0 w-full"
          barRadius={5}
          enableMaxValueHighlight
          chartOptions={{ grid: { left: 8, right: 12, top: 12, bottom: 24, containLabel: true } }}
        >
          <EChartsBarChart.Grid />
          <EChartsBarChart.XAxis tickFormatter={(value) => compact(Number(value))} />
          <EChartsBarChart.YAxis dataKey="name" tickFormatter={shortLabel} hideDots />
          <EChartsBarChart.Tooltip
            variant="frosted-glass"
            roundness="lg"
            valueFormatter={(value) => formatCurrency(value, "INR")}
          />
          <EChartsBarChart.Bar dataKey="balance" variant="gradient" enableHoverHighlight />
        </EChartsBarChart>
      </AnalyticsChartCard>

      <AnalyticsChartCard
        title="Minimum-balance safety"
        description="Current cash against each configured minimum; missing minimums are shown as zero."
        metric={formatCurrency(
          total - data.reduce((sum, account) => sum + account.minimum, 0),
          "INR",
        )}
        metricLabel="aggregate headroom"
      >
        <EChartsBarChart
          data={data}
          config={headroomConfig}
          xDataKey="name"
          layout="horizontal"
          className="h-[320px] min-w-0 w-full"
          barRadius={4}
          chartOptions={{ grid: { left: 8, right: 12, top: 42, bottom: 24, containLabel: true } }}
        >
          <EChartsBarChart.Grid />
          <EChartsBarChart.XAxis tickFormatter={(value) => compact(Number(value))} />
          <EChartsBarChart.YAxis dataKey="name" tickFormatter={shortLabel} hideDots />
          <EChartsBarChart.Tooltip
            variant="frosted-glass"
            roundness="lg"
            valueFormatter={(value) => formatCurrency(value, "INR")}
          />
          <EChartsBarChart.Legend align="left" verticalAlign="top" isClickable />
          <EChartsBarChart.Bar dataKey="balance" variant="gradient" enableHoverHighlight />
          <EChartsBarChart.Bar dataKey="minimum" variant="hatched" enableHoverHighlight />
        </EChartsBarChart>
      </AnalyticsChartCard>

      {history.length > 1 ? (
        <div className="xl:col-span-2">
          <AnalyticsChartCard
            title="INR cash history"
            description="End-of-day total reconstructed from every saved account snapshot."
            metric={formatCurrency(latestHistory, "INR")}
            metricLabel="latest saved total"
          >
            <EChartsAreaChart
              data={history}
              config={historyConfig}
              xDataKey="date"
              curveType="monotone"
              enableHoverReveal
              className="h-[300px] min-w-0 w-full"
              chartOptions={{
                grid: { left: 8, right: 12, top: 16, bottom: 28, containLabel: true },
              }}
            >
              <EChartsAreaChart.Grid />
              <EChartsAreaChart.XAxis dataKey="date" hideDots />
              <EChartsAreaChart.YAxis tickFormatter={compact} hideDots />
              <EChartsAreaChart.Tooltip
                variant="frosted-glass"
                roundness="lg"
                valueFormatter={(value) => formatCurrency(value, "INR")}
              />
              <EChartsAreaChart.Area dataKey="value" variant="gradient" strokeWidth={2}>
                <EChartsAreaChart.ActiveDot variant="ping" />
              </EChartsAreaChart.Area>
            </EChartsAreaChart>
          </AnalyticsChartCard>
        </div>
      ) : null}
    </div>
  );
}
