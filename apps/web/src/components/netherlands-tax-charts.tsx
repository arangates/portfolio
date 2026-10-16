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
  box1TaxableIncome: { label: "Box 1", colors: chartColors.primary },
  box2TaxableIncome: { label: "Box 2", colors: chartColors.purple },
  box3TaxableIncome: { label: "Box 3", colors: chartColors.success },
  aggregateIncome: { label: "Aggregate income", colors: chartColors.danger },
} satisfies ComposedChartConfig;

const taxConfig = {
  finalTaxAndSocialInsurance: {
    label: "Final tax",
    colors: chartColors.danger,
  },
  payrollTaxWithheld: { label: "Payroll tax", colors: chartColors.primary },
  totalTaxCredits: { label: "Tax credits", colors: chartColors.warning },
  settlementAmount: { label: "Settlement", colors: chartColors.success },
} satisfies AreaChartConfig;

export type NetherlandsTaxChartPoint = {
  label: string;
  box1TaxableIncome: number;
  box2TaxableIncome: number;
  box3TaxableIncome: number;
  aggregateIncome: number;
  finalTaxAndSocialInsurance: number;
  payrollTaxWithheld: number;
  totalTaxCredits: number;
  settlementAmount: number;
};

export function NetherlandsTaxCharts({ data }: { data: NetherlandsTaxChartPoint[] }) {
  const { formatCurrency } = useAmountFormat();
  const latest = data.at(-1);
  return (
    <div className="grid min-w-0 gap-4 px-4 xl:grid-cols-2 lg:px-6">
      <AnalyticsChartCard
        id="dutch-taxable-income"
        title="Accepted taxable income"
        description="Box 1, Box 2 and Box 3 income recorded in each final assessment."
        metric={latest ? formatCompactCurrency(latest.aggregateIncome, "EUR") : "—"}
        metricTooltip={latest ? formatFullCurrency(latest.aggregateIncome, "EUR") : undefined}
        metricLabel="latest aggregate income"
      >
        <EChartsComposedChart
          data={data}
          config={incomeConfig}
          xDataKey="label"
          className="h-[320px] min-w-0 w-full"
          chartOptions={{ grid: { left: 8, right: 12, top: 48, bottom: 28, containLabel: true } }}
        >
          <EChartsComposedChart.Grid />
          <EChartsComposedChart.XAxis dataKey="label" hideDots />
          <EChartsComposedChart.YAxis
            tickFormatter={(value) => formatCompactCurrency(value, "EUR")}
            hideDots
          />
          <EChartsComposedChart.Tooltip
            variant="frosted-glass"
            valueFormatter={(value) => formatCurrency(value, "EUR")}
          />
          <EChartsComposedChart.Legend align="left" verticalAlign="top" isClickable />
          <EChartsComposedChart.Bar
            dataKey="box1TaxableIncome"
            barProps={{ stack: "income" }}
            enableHoverHighlight
          />
          <EChartsComposedChart.Bar
            dataKey="box2TaxableIncome"
            barProps={{ stack: "income" }}
            enableHoverHighlight
          />
          <EChartsComposedChart.Bar
            dataKey="box3TaxableIncome"
            barProps={{ stack: "income" }}
            enableHoverHighlight
          />
          <EChartsComposedChart.Line dataKey="aggregateIncome" glow isClickable>
            <EChartsComposedChart.ActiveDot variant="ping" />
          </EChartsComposedChart.Line>
        </EChartsComposedChart>
      </AnalyticsChartCard>
      <AnalyticsChartCard
        id="dutch-tax-settlement"
        title="Tax and settlement history"
        description="Accepted liability, payroll withholding, tax credits and final refund or payment."
        metric={latest ? formatCompactCurrency(latest.finalTaxAndSocialInsurance, "EUR") : "—"}
        metricTooltip={
          latest ? formatFullCurrency(latest.finalTaxAndSocialInsurance, "EUR") : undefined
        }
        metricLabel="latest final tax"
      >
        <EChartsAreaChart
          data={data}
          config={taxConfig}
          xDataKey="label"
          curveType="monotone"
          className="h-[320px] min-w-0 w-full"
          chartOptions={{ grid: { left: 8, right: 12, top: 48, bottom: 28, containLabel: true } }}
        >
          <EChartsAreaChart.Grid />
          <EChartsAreaChart.XAxis dataKey="label" hideDots />
          <EChartsAreaChart.YAxis
            tickFormatter={(value) => formatCompactCurrency(value, "EUR")}
            hideDots
          />
          <EChartsAreaChart.Tooltip
            variant="frosted-glass"
            valueFormatter={(value) => formatCurrency(value, "EUR")}
          />
          <EChartsAreaChart.Legend align="left" verticalAlign="top" isClickable />
          <EChartsAreaChart.Area
            dataKey="finalTaxAndSocialInsurance"
            variant="gradient"
            isClickable
          />
          <EChartsAreaChart.Area
            dataKey="payrollTaxWithheld"
            variant="gradient-reverse"
            isClickable
          />
          <EChartsAreaChart.Area dataKey="totalTaxCredits" variant="dotted" isClickable />
          <EChartsAreaChart.Area dataKey="settlementAmount" variant="gradient" isClickable />
        </EChartsAreaChart>
      </AnalyticsChartCard>
    </div>
  );
}
