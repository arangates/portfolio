"use client";

import { AnalyticsChartCard } from "@/components/analytics-chart-card";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";
import {
  EChartsAreaChart,
  type ChartConfig as AreaChartConfig,
} from "@portfolio/ui/components/evilcharts/charts/echarts-area-chart";
import {
  EChartsComposedChart,
  type ChartConfig as ComposedChartConfig,
} from "@portfolio/ui/components/evilcharts/charts/echarts-composed-chart";

const earningsConfig = {
  baseSalary: { label: "Base salary", colors: { light: ["#2563eb"], dark: ["#60a5fa"] } },
  supplementalGross: {
    label: "Bonus & special",
    colors: { light: ["#7c3aed"], dark: ["#a78bfa"] },
  },
  netPay: {
    label: "Net pay",
    colors: { light: ["#059669", "#10b981"], dark: ["#34d399", "#6ee7b7"] },
  },
} satisfies ComposedChartConfig;

const deductionsConfig = {
  wageTax: { label: "Wage tax", colors: { light: ["#dc2626"], dark: ["#f87171"] } },
  pensionContribution: { label: "Pension", colors: { light: ["#d97706"], dark: ["#fbbf24"] } },
  socialInsurance: { label: "Insurance", colors: { light: ["#7c3aed"], dark: ["#a78bfa"] } },
} satisfies AreaChartConfig;

type SalaryPoint = {
  month: string;
  baseSalary: number;
  supplementalGross: number;
  netPay: number;
  wageTax: number;
  pensionContribution: number;
  socialInsurance: number;
};

export function SalaryCharts({ data, currency }: { data: SalaryPoint[]; currency: string }) {
  const latest = data.at(-1);
  const totalDeductions = data.reduce(
    (sum, row) => sum + row.wageTax + row.pensionContribution + row.socialInsurance,
    0,
  );
  return (
    <div className="grid min-w-0 gap-4 px-4 xl:grid-cols-2 lg:px-6">
      <AnalyticsChartCard
        title="Earnings and take-home"
        description="Recurring pay, special earnings and deposited net pay."
        metric={latest ? formatCurrency(latest.netPay, currency) : "—"}
        metricLabel="latest net pay"
      >
        <EChartsComposedChart
          data={data}
          config={earningsConfig}
          xDataKey="month"
          curveType="monotone"
          className="h-[320px] min-w-0 w-full"
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
            valueFormatter={(value) => formatCurrency(value, currency)}
          />
          <EChartsComposedChart.Legend align="left" verticalAlign="top" isClickable />
          <EChartsComposedChart.Bar
            dataKey="baseSalary"
            variant="gradient"
            barProps={{ stack: "gross" }}
            enableHoverHighlight
          />
          <EChartsComposedChart.Bar
            dataKey="supplementalGross"
            variant="duotone"
            barProps={{ stack: "gross" }}
            enableHoverHighlight
          />
          <EChartsComposedChart.Line dataKey="netPay" glow isClickable>
            <EChartsComposedChart.ActiveDot variant="ping" />
          </EChartsComposedChart.Line>
        </EChartsComposedChart>
      </AnalyticsChartCard>
      <AnalyticsChartCard
        title="Tax and retirement contributions"
        description="Wage tax, employee pension and social insurance over time."
        metric={formatCompactCurrency(totalDeductions, currency)}
        metricLabel="total deductions"
      >
        <EChartsAreaChart
          data={data}
          config={deductionsConfig}
          xDataKey="month"
          curveType="monotone"
          stackType="stacked"
          className="h-[320px] min-w-0 w-full"
          chartOptions={{ grid: { left: 8, right: 12, top: 48, bottom: 28, containLabel: true } }}
        >
          <EChartsAreaChart.Grid />
          <EChartsAreaChart.XAxis dataKey="month" hideDots />
          <EChartsAreaChart.YAxis
            tickFormatter={(value) => formatCompactCurrency(value, currency)}
            hideDots
          />
          <EChartsAreaChart.Tooltip
            variant="frosted-glass"
            valueFormatter={(value) => formatCurrency(value, currency)}
          />
          <EChartsAreaChart.Legend align="left" verticalAlign="top" isClickable />
          <EChartsAreaChart.Area dataKey="wageTax" variant="gradient" isClickable />
          <EChartsAreaChart.Area
            dataKey="pensionContribution"
            variant="gradient-reverse"
            isClickable
          />
          <EChartsAreaChart.Area dataKey="socialInsurance" variant="dotted" isClickable />
        </EChartsAreaChart>
      </AnalyticsChartCard>
    </div>
  );
}
