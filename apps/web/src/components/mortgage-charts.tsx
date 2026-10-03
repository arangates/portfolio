"use client";

import { useAmountFormat } from "@/components/amount-preferences";
import { AllocationPieChart } from "@/components/allocation-pie-chart";
import { AnalyticsChartCard } from "@/components/analytics-chart-card";
import { formatCompactCurrency, formatFullCurrency, formatPercent } from "@/lib/format";
import type {
  MortgageModel,
  PaymentComparisonRow,
  simulateScenario,
} from "@portfolio/api/mortgage-calculations";
import {
  EChartsAreaChart,
  type ChartConfig as AreaChartConfig,
} from "@portfolio/ui/components/evilcharts/charts/echarts-area-chart";
import {
  EChartsComposedChart,
  type ChartConfig as ComposedChartConfig,
} from "@portfolio/ui/components/evilcharts/charts/echarts-composed-chart";
import type { ChartConfig as PieChartConfig } from "@portfolio/ui/components/evilcharts/charts/echarts-pie-chart";

const CURRENCY = "EUR";
const CHART_CLASS = "h-[320px] min-w-0 w-full";
const GRID = { grid: { left: 8, right: 12, top: 48, bottom: 28, containLabel: true } };

const monthTick = (value: string) =>
  new Intl.DateTimeFormat("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" }).format(
    new Date(`${value}T12:00:00Z`),
  );
const yearTick = (value: string) => value.slice(0, 4);

const color = (light: string, dark: string) => ({ light: [light], dark: [dark] });
const BLUE = color("#2563eb", "#60a5fa");
const ROSE = color("#e11d48", "#fb7185");
const GREEN = color("#059669", "#34d399");
const AMBER = color("#d97706", "#fbbf24");
const VIOLET = color("#7c3aed", "#a78bfa");
const SLATE = color("#64748b", "#94a3b8");

function useMoney() {
  const { formatCurrency } = useAmountFormat();
  return {
    tooltip: (value: number) => formatCurrency(value, CURRENCY),
    axis: (value: number) => formatCompactCurrency(value, CURRENCY),
  };
}

const balanceConfig = {
  paid: { label: "Outstanding (past)", colors: BLUE },
  projected: { label: "Outstanding (projected)", colors: VIOLET },
} satisfies AreaChartConfig;

export function MortgageBalanceChart({ model }: { model: MortgageModel }) {
  const money = useMoney();
  const asOfDate = model.history.at(-1)?.date;
  const data = [
    ...model.history.map((row) => ({
      date: row.date,
      paid: row.closing,
      projected: row.date === asOfDate ? model.terms.currentBalance : null,
    })),
    ...model.baseline.rows.map((row) => ({
      date: row.date,
      paid: null,
      projected: row.closing,
    })),
  ];
  return (
    <AnalyticsChartCard
      id="mortgage-balance"
      title="Outstanding balance, past to payoff"
      description="Modelled balance since the first instalment, then the projection from the balance your lender reports today."
      metric={formatFullCurrency(model.terms.currentBalance, CURRENCY)}
      metricLabel="outstanding today"
    >
      <EChartsAreaChart
        data={data}
        config={balanceConfig}
        xDataKey="date"
        curveType="monotone"
        className={CHART_CLASS}
        chartOptions={GRID}
      >
        <EChartsAreaChart.Grid />
        <EChartsAreaChart.XAxis dataKey="date" tickFormatter={yearTick} hideDots />
        <EChartsAreaChart.YAxis tickFormatter={money.axis} hideDots />
        <EChartsAreaChart.Tooltip variant="frosted-glass" valueFormatter={money.tooltip} />
        <EChartsAreaChart.Legend align="left" verticalAlign="top" />
        <EChartsAreaChart.Area dataKey="paid" variant="gradient" strokeWidth={2} />
        <EChartsAreaChart.Area dataKey="projected" variant="gradient-reverse" strokeWidth={2} />
      </EChartsAreaChart>
    </AnalyticsChartCard>
  );
}

const paymentConfig = {
  interest: { label: "Interest", colors: ROSE },
  principal: { label: "Principal", colors: GREEN },
  extra: { label: "Extra repayment", colors: AMBER },
  bank: { label: "Bank debit", colors: BLUE },
} satisfies ComposedChartConfig;

export function MortgagePaymentChart({
  model,
  comparison,
}: {
  model: MortgageModel;
  comparison: PaymentComparisonRow[];
}) {
  const money = useMoney();
  const bankByDate = new Map(comparison.map((row) => [row.date, row.actual]));
  const hasBank = comparison.some((row) => row.actual !== null);
  const data = model.history.map((row) => ({
    date: row.date,
    interest: row.interest,
    principal: row.principal,
    extra: row.extra,
    bank: bankByDate.get(row.date) ?? null,
  }));
  return (
    <AnalyticsChartCard
      id="mortgage-payments"
      title="Every monthly payment so far"
      description={
        hasBank
          ? "Interest and principal per instalment, with the debit actually found in your bank imports."
          : "Interest and principal per instalment. Import ING statements to overlay the debits actually paid."
      }
      metric={formatFullCurrency(model.summary.paidToDate, CURRENCY)}
      metricLabel={`paid over ${data.length} months`}
    >
      <EChartsComposedChart
        data={data}
        config={paymentConfig}
        xDataKey="date"
        className={CHART_CLASS}
        chartOptions={GRID}
      >
        <EChartsComposedChart.Grid />
        <EChartsComposedChart.XAxis dataKey="date" tickFormatter={monthTick} hideDots />
        <EChartsComposedChart.YAxis tickFormatter={money.axis} hideDots />
        <EChartsComposedChart.Tooltip variant="frosted-glass" valueFormatter={money.tooltip} />
        <EChartsComposedChart.Legend align="left" verticalAlign="top" isClickable />
        <EChartsComposedChart.Bar dataKey="interest" barProps={{ stack: "payment" }} />
        <EChartsComposedChart.Bar dataKey="principal" barProps={{ stack: "payment" }} />
        <EChartsComposedChart.Bar dataKey="extra" barProps={{ stack: "payment" }} />
        {hasBank ? (
          <EChartsComposedChart.Line dataKey="bank" strokeVariant="dashed">
            <EChartsComposedChart.Dot variant="default" />
          </EChartsComposedChart.Line>
        ) : null}
      </EChartsComposedChart>
    </AnalyticsChartCard>
  );
}

const cumulativeConfig = {
  principal: { label: "Principal repaid", colors: GREEN },
  interest: { label: "Interest paid", colors: ROSE },
} satisfies AreaChartConfig;

export function MortgageCumulativeChart({ model }: { model: MortgageModel }) {
  const money = useMoney();
  const data = model.timeline.map((row) => ({
    date: row.date,
    principal: row.cumulativePrincipal,
    interest: row.cumulativeInterest,
  }));
  return (
    <AnalyticsChartCard
      id="mortgage-cumulative"
      title="Principal versus interest, cumulative"
      description="How the total cost builds up. Interest dominates early; principal takes over later."
      metric={formatFullCurrency(model.summary.lifetimeInterest, CURRENCY)}
      metricLabel="lifetime interest"
    >
      <EChartsAreaChart
        data={data}
        config={cumulativeConfig}
        xDataKey="date"
        curveType="monotone"
        className={CHART_CLASS}
        chartOptions={GRID}
      >
        <EChartsAreaChart.Grid />
        <EChartsAreaChart.XAxis dataKey="date" tickFormatter={yearTick} hideDots />
        <EChartsAreaChart.YAxis tickFormatter={money.axis} hideDots />
        <EChartsAreaChart.Tooltip variant="frosted-glass" valueFormatter={money.tooltip} />
        <EChartsAreaChart.Legend align="left" verticalAlign="top" isClickable />
        <EChartsAreaChart.Area dataKey="principal" variant="gradient" />
        <EChartsAreaChart.Area dataKey="interest" variant="gradient-reverse" />
      </EChartsAreaChart>
    </AnalyticsChartCard>
  );
}

const yearlyConfig = {
  interest: { label: "Interest", colors: ROSE },
  principal: { label: "Principal", colors: GREEN },
  closing: { label: "Year-end balance", colors: SLATE },
} satisfies ComposedChartConfig;

export function MortgageYearlyChart({ model }: { model: MortgageModel }) {
  const money = useMoney();
  const data = model.yearly.map((row) => ({
    year: String(row.year),
    interest: row.interest,
    principal: row.principal,
    closing: row.closing,
  }));
  return (
    <AnalyticsChartCard
      id="mortgage-yearly"
      title="Yearly interest and principal"
      description="Calendar-year totals. Yearly interest is the figure relevant for the Dutch mortgage interest deduction."
    >
      <EChartsComposedChart
        data={data}
        config={yearlyConfig}
        xDataKey="year"
        className={CHART_CLASS}
        chartOptions={GRID}
      >
        <EChartsComposedChart.Grid />
        <EChartsComposedChart.XAxis dataKey="year" hideDots />
        <EChartsComposedChart.YAxis tickFormatter={money.axis} hideDots />
        <EChartsComposedChart.Tooltip variant="frosted-glass" valueFormatter={money.tooltip} />
        <EChartsComposedChart.Legend align="left" verticalAlign="top" isClickable />
        <EChartsComposedChart.Bar dataKey="interest" barProps={{ stack: "year" }} />
        <EChartsComposedChart.Bar dataKey="principal" barProps={{ stack: "year" }} />
        <EChartsComposedChart.Line dataKey="closing" strokeVariant="dashed" />
      </EChartsComposedChart>
    </AnalyticsChartCard>
  );
}

const COST_COLORS = [
  { light: ["#059669", "#34d399"], dark: ["#34d399", "#6ee7b7"] },
  { light: ["#e11d48", "#fb7185"], dark: ["#fb7185", "#fda4af"] },
  { light: ["#2563eb", "#60a5fa"], dark: ["#60a5fa", "#93c5fd"] },
  { light: ["#d97706", "#fbbf24"], dark: ["#fbbf24", "#fde68a"] },
];

export function MortgageCostChart({ model }: { model: MortgageModel }) {
  const { terms, summary } = model;
  const items = [
    { id: "principal-repaid", label: "Principal repaid", value: summary.repaid },
    { id: "interest-paid", label: "Interest paid", value: summary.interestPaid },
    { id: "principal-left", label: "Principal outstanding", value: terms.currentBalance },
    { id: "interest-left", label: "Interest still to pay", value: summary.remainingInterest },
  ].map((item, index) => ({ ...item, colors: COST_COLORS[index]! }));
  const config = Object.fromEntries(
    items.map(({ id, label, colors }) => [id, { label, colors }]),
  ) satisfies PieChartConfig;
  const total = items.reduce((sum, item) => sum + item.value, 0);
  return (
    <AnalyticsChartCard
      id="mortgage-cost"
      title="Total cost of the loan"
      description="Everything repaid by the payoff date, split between what is behind you and what is ahead."
      metric={formatCompactCurrency(total, CURRENCY)}
      metricTooltip={formatFullCurrency(total, CURRENCY)}
      metricLabel="total repayments"
    >
      <AllocationPieChart
        data={items.map(({ id, value }) => ({ id, value }))}
        config={config}
        currency={CURRENCY}
        className="h-[340px]"
        ariaLabel="Total mortgage cost split"
      />
    </AnalyticsChartCard>
  );
}

const equityConfig = {
  value: { label: "Property value (assumed)", colors: SLATE },
  debt: { label: "Mortgage debt", colors: ROSE },
  equity: { label: "Equity", colors: GREEN },
} satisfies ComposedChartConfig;

const YEAR_MS = 31_557_600_000;

export function MortgageEquityChart({
  model,
  appreciation,
}: {
  model: MortgageModel;
  appreciation: number;
}) {
  const money = useMoney();
  const valuationTime = new Date(`${model.terms.valuationDate}T12:00:00Z`).getTime();
  const data = model.timeline
    .filter((_, index) => index % 3 === 0)
    .map((row) => {
      const years = (new Date(`${row.date}T12:00:00Z`).getTime() - valuationTime) / YEAR_MS;
      const value = model.terms.propertyValue * (1 + appreciation) ** Math.max(0, years);
      return { date: row.date, value, debt: row.closing, equity: value - row.closing };
    });
  const todayDate = model.history.at(-1)?.date ?? "";
  const today = data.find((row) => row.date >= todayDate) ?? data[0];
  return (
    <AnalyticsChartCard
      id="mortgage-equity"
      title="Equity build-up"
      description={`Property value grows ${formatPercent(appreciation, 1)} a year from the last valuation (adjust in Settings). Equity = value − debt.`}
      metric={today ? formatFullCurrency(today.equity, CURRENCY) : undefined}
      metricLabel="equity today"
    >
      <EChartsComposedChart
        data={data}
        config={equityConfig}
        xDataKey="date"
        curveType="monotone"
        className={CHART_CLASS}
        chartOptions={GRID}
      >
        <EChartsComposedChart.Grid />
        <EChartsComposedChart.XAxis dataKey="date" tickFormatter={yearTick} hideDots />
        <EChartsComposedChart.YAxis tickFormatter={money.axis} hideDots />
        <EChartsComposedChart.Tooltip variant="frosted-glass" valueFormatter={money.tooltip} />
        <EChartsComposedChart.Legend align="left" verticalAlign="top" isClickable />
        <EChartsComposedChart.Line dataKey="value" strokeVariant="dashed" />
        <EChartsComposedChart.Line dataKey="debt" />
        <EChartsComposedChart.Line dataKey="equity" glow />
      </EChartsComposedChart>
    </AnalyticsChartCard>
  );
}

const sensitivityConfig = {
  payment: { label: "Payment after reset", colors: VIOLET },
  current: { label: "Current payment", colors: SLATE },
} satisfies ComposedChartConfig;

export function MortgageSensitivityChart({ model }: { model: MortgageModel }) {
  const money = useMoney();
  const data = model.sensitivity.map((row) => ({
    rate: `${(row.rate * 100).toFixed(2)}%`,
    payment: row.payment,
    current: model.terms.monthlyPayment,
  }));
  return (
    <AnalyticsChartCard
      id="mortgage-sensitivity"
      title="Payment after the fixed-rate period"
      description="The balance at the reset date is re-amortised over the months left until the loan end date."
      metric={formatFullCurrency(model.summary.balanceAtFixedEnd, CURRENCY)}
      metricLabel="balance at rate reset"
    >
      <EChartsComposedChart
        data={data}
        config={sensitivityConfig}
        xDataKey="rate"
        className={CHART_CLASS}
        chartOptions={GRID}
      >
        <EChartsComposedChart.Grid />
        <EChartsComposedChart.XAxis dataKey="rate" hideDots />
        <EChartsComposedChart.YAxis tickFormatter={money.axis} hideDots />
        <EChartsComposedChart.Tooltip variant="frosted-glass" valueFormatter={money.tooltip} />
        <EChartsComposedChart.Legend align="left" verticalAlign="top" isClickable />
        <EChartsComposedChart.Bar dataKey="payment" radius={6} enableHoverHighlight />
        <EChartsComposedChart.Line dataKey="current" strokeVariant="dashed" />
      </EChartsComposedChart>
    </AnalyticsChartCard>
  );
}

const scenarioConfig = {
  baseline: { label: "Current plan", colors: SLATE },
  scenario: { label: "With extra repayments", colors: GREEN },
} satisfies AreaChartConfig;

export function MortgageScenarioChart({
  model,
  result,
}: {
  model: MortgageModel;
  result: ReturnType<typeof simulateScenario>;
}) {
  const money = useMoney();
  const scenarioByDate = new Map(result.scenario.rows.map((row) => [row.date, row.closing]));
  const data = model.baseline.rows.map((row) => ({
    date: row.date,
    baseline: row.closing,
    scenario: scenarioByDate.get(row.date) ?? 0,
  }));
  return (
    <AnalyticsChartCard
      id="mortgage-scenario"
      title="Balance: current plan versus scenario"
      description="The gap between the areas is debt you no longer carry and interest you no longer pay."
      metric={formatFullCurrency(result.interestSaved, CURRENCY)}
      metricLabel="interest saved"
    >
      <EChartsAreaChart
        data={data}
        config={scenarioConfig}
        xDataKey="date"
        curveType="monotone"
        className={CHART_CLASS}
        chartOptions={GRID}
      >
        <EChartsAreaChart.Grid />
        <EChartsAreaChart.XAxis dataKey="date" tickFormatter={yearTick} hideDots />
        <EChartsAreaChart.YAxis tickFormatter={money.axis} hideDots />
        <EChartsAreaChart.Tooltip variant="frosted-glass" valueFormatter={money.tooltip} />
        <EChartsAreaChart.Legend align="left" verticalAlign="top" isClickable />
        <EChartsAreaChart.Area dataKey="baseline" variant="gradient" />
        <EChartsAreaChart.Area dataKey="scenario" variant="gradient-reverse" />
      </EChartsAreaChart>
    </AnalyticsChartCard>
  );
}
