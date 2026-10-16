"use client";
import { useAmountFormat } from "@/components/amount-preferences";

import { AnalyticsChartCard } from "@/components/analytics-chart-card";
import { formatCompactCurrency, formatFullCurrency } from "@/lib/format";
import {
  EChartsAreaChart,
  type ChartConfig as AreaChartConfig,
} from "@portfolio/ui/components/evilcharts/charts/echarts-area-chart";
import {
  EChartsComposedChart,
  type ChartConfig as ComposedChartConfig,
} from "@portfolio/ui/components/evilcharts/charts/echarts-composed-chart";

import { chartColors } from "@portfolio/ui/lib/chart-theme";

const incomeConfig = {
  salaryIncome: { label: "Salary", colors: chartColors.primary },
  businessIncome: { label: "Business", colors: chartColors.purple },
  capitalGains: { label: "Capital gains", colors: chartColors.success },
  otherSourcesIncome: { label: "Other sources", colors: chartColors.warning },
  totalIncome: { label: "Taxable income", colors: chartColors.danger },
} satisfies ComposedChartConfig;

const taxConfig = {
  aggregateTaxLiability: {
    label: "Tax liability",
    colors: chartColors.danger,
  },
  totalTaxesPaid: { label: "Taxes paid", colors: chartColors.primary },
  refundDue: { label: "Refund due", colors: chartColors.success },
} satisfies AreaChartConfig;

export type IncomeTaxChartPoint = {
  year: string;
  salaryIncome: number;
  businessIncome: number;
  capitalGains: number;
  otherSourcesIncome: number;
  totalIncome: number;
  aggregateTaxLiability: number;
  totalTaxesPaid: number;
  refundDue: number;
};

export function IncomeTaxCharts({ data }: { data: IncomeTaxChartPoint[] }) {
  const { formatCurrency } = useAmountFormat();
  const latest = data.at(-1);
  const totalRefunds = data.reduce((sum, row) => sum + row.refundDue, 0);
  return (
    <div className="grid min-w-0 gap-4 px-4 xl:grid-cols-2 lg:px-6">
      <AnalyticsChartCard
        id="income-composition"
        title="Income composition"
        description="Income heads reported in each return, with taxable income after deductions."
        metric={latest ? formatCompactCurrency(latest.totalIncome, "INR") : "—"}
        metricTooltip={latest ? formatFullCurrency(latest.totalIncome, "INR") : undefined}
        metricLabel="latest taxable income"
      >
        <EChartsComposedChart
          data={data}
          config={incomeConfig}
          xDataKey="year"
          className="h-[320px] min-w-0 w-full"
          chartOptions={{ grid: { left: 8, right: 12, top: 48, bottom: 28, containLabel: true } }}
        >
          <EChartsComposedChart.Grid />
          <EChartsComposedChart.XAxis dataKey="year" hideDots />
          <EChartsComposedChart.YAxis
            tickFormatter={(value) => formatCompactCurrency(value, "INR")}
            hideDots
          />
          <EChartsComposedChart.Tooltip
            variant="frosted-glass"
            valueFormatter={(value) => formatCurrency(value, "INR")}
          />
          <EChartsComposedChart.Legend align="left" verticalAlign="top" isClickable />
          <EChartsComposedChart.Bar
            dataKey="salaryIncome"
            barProps={{ stack: "income" }}
            enableHoverHighlight
          />
          <EChartsComposedChart.Bar
            dataKey="businessIncome"
            barProps={{ stack: "income" }}
            enableHoverHighlight
          />
          <EChartsComposedChart.Bar
            dataKey="capitalGains"
            barProps={{ stack: "income" }}
            enableHoverHighlight
          />
          <EChartsComposedChart.Bar
            dataKey="otherSourcesIncome"
            barProps={{ stack: "income" }}
            enableHoverHighlight
          />
          <EChartsComposedChart.Line dataKey="totalIncome" glow isClickable>
            <EChartsComposedChart.ActiveDot variant="ping" />
          </EChartsComposedChart.Line>
        </EChartsComposedChart>
      </AnalyticsChartCard>
      <AnalyticsChartCard
        id="tax-settlement-history"
        title="Tax settlement history"
        description="Final liability, taxes credited in the return and refund due by assessment year."
        metric={formatCompactCurrency(totalRefunds, "INR")}
        metricTooltip={formatFullCurrency(totalRefunds, "INR")}
        metricLabel="refunds across imported years"
      >
        <EChartsAreaChart
          data={data}
          config={taxConfig}
          xDataKey="year"
          curveType="monotone"
          className="h-[320px] min-w-0 w-full"
          chartOptions={{ grid: { left: 8, right: 12, top: 48, bottom: 28, containLabel: true } }}
        >
          <EChartsAreaChart.Grid />
          <EChartsAreaChart.XAxis dataKey="year" hideDots />
          <EChartsAreaChart.YAxis
            tickFormatter={(value) => formatCompactCurrency(value, "INR")}
            hideDots
          />
          <EChartsAreaChart.Tooltip
            variant="frosted-glass"
            valueFormatter={(value) => formatCurrency(value, "INR")}
          />
          <EChartsAreaChart.Legend align="left" verticalAlign="top" isClickable />
          <EChartsAreaChart.Area dataKey="aggregateTaxLiability" variant="gradient" isClickable />
          <EChartsAreaChart.Area dataKey="totalTaxesPaid" variant="gradient-reverse" isClickable />
          <EChartsAreaChart.Area dataKey="refundDue" variant="dotted" isClickable />
        </EChartsAreaChart>
      </AnalyticsChartCard>
    </div>
  );
}
