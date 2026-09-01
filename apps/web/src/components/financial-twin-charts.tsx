"use client";

import { AnalyticsChartCard } from "@/components/analytics-chart-card";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";
import {
  EChartsBarChart,
  type ChartConfig as BarChartConfig,
} from "@portfolio/ui/components/evilcharts/charts/echarts-bar-chart";
import {
  EChartsSankeyChart,
  type ChartConfig as SankeyChartConfig,
  type SankeyData,
} from "@portfolio/ui/components/evilcharts/charts/echarts-sankey-chart";

const flowColors = {
  income: { light: ["#0f766e", "#14b8a6"], dark: ["#14b8a6", "#5eead4"] },
  expense: { light: ["#be123c", "#fb7185"], dark: ["#f43f5e", "#fda4af"] },
  surplus: { light: ["#1d4ed8", "#60a5fa"], dark: ["#3b82f6", "#93c5fd"] },
  retained: { light: ["#a16207", "#facc15"], dark: ["#eab308", "#fde047"] },
  gap: { light: ["#9f1239", "#e11d48"], dark: ["#be123c", "#fb7185"] },
};

const allocationColors = [
  { light: ["#6d28d9", "#a78bfa"], dark: ["#8b5cf6", "#c4b5fd"] },
  { light: ["#0369a1", "#38bdf8"], dark: ["#0ea5e9", "#7dd3fc"] },
  { light: ["#047857", "#34d399"], dark: ["#10b981", "#6ee7b7"] },
  { light: ["#c2410c", "#fb923c"], dark: ["#f97316", "#fdba74"] },
  { light: ["#a21caf", "#e879f9"], dark: ["#d946ef", "#f0abfc"] },
];

const capacityConfig = {
  value: {
    label: "Monthly amount",
    colors: { light: ["#2563eb", "#7c3aed"], dark: ["#60a5fa", "#a78bfa"] },
  },
} satisfies BarChartConfig;

type Contribution = { bucket: string; label: string; amount: number };

export function FinancialTwinCharts({
  currency,
  typicalNetIncome,
  householdCost,
  observedSurplus,
  policyDeployment,
  supportedDeployment,
  retainedCash,
  fireMonthlySavings,
  contributionPlan,
}: {
  currency: string;
  typicalNetIncome: number | null;
  householdCost: number | null;
  observedSurplus: number | null;
  policyDeployment: number;
  supportedDeployment: number | null;
  retainedCash: number | null;
  fireMonthlySavings: number | null;
  contributionPlan: Contribution[];
}) {
  const isMobile = useIsMobile();
  const income = Math.max(0, typicalNetIncome ?? 0);
  const cost = Math.max(0, householdCost ?? 0);
  const surplus = Math.max(0, observedSurplus ?? 0);
  const supported = Math.max(0, supportedDeployment ?? 0);
  const retained = Math.max(0, retainedCash ?? 0);
  const uncovered = Math.max(0, cost - income);
  const coveredCost = Math.min(cost, income);
  const nodes: SankeyData["nodes"] = [{ name: "income" }];
  const config: SankeyChartConfig = {
    income: { label: "Typical net pay", colors: flowColors.income },
  };
  const links: SankeyData["links"] = [];
  const addNode = (name: string, label: string, colors: SankeyChartConfig[string]) => {
    const index = nodes.length;
    nodes.push({ name });
    config[name] = { label, ...colors };
    return index;
  };

  if (coveredCost > 0) {
    const expenseIndex = addNode("household", "Household cost", {
      colors: flowColors.expense,
    });
    links.push({ source: 0, target: expenseIndex, value: coveredCost });
  }
  if (uncovered > 0) {
    const fundingIndex = addNode("untracked", "Untracked funding", { colors: flowColors.gap });
    const expenseIndex = nodes.findIndex((node) => node.name === "household");
    const target =
      expenseIndex >= 0
        ? expenseIndex
        : addNode("household", "Household cost", { colors: flowColors.expense });
    links.push({ source: fundingIndex, target, value: uncovered });
  }
  if (surplus > 0) {
    const surplusIndex = addNode("surplus", "Observed surplus", { colors: flowColors.surplus });
    links.push({ source: 0, target: surplusIndex, value: surplus });
    if (supported > 0) {
      const deploymentIndex = addNode("deployment", "Policy deployment", {
        colors: allocationColors[0],
      });
      links.push({ source: surplusIndex, target: deploymentIndex, value: supported });
      contributionPlan.forEach((item, index) => {
        const target = addNode(`allocation-${item.bucket}`, item.label, {
          colors: allocationColors[(index + 1) % allocationColors.length],
        });
        links.push({ source: deploymentIndex, target, value: item.amount });
      });
    }
    if (retained > 0) {
      const retainedIndex = addNode("retained", "Uncommitted surplus", {
        colors: flowColors.retained,
      });
      links.push({ source: surplusIndex, target: retainedIndex, value: retained });
    }
  }

  const capacityData = [
    { name: "FIRE plan", value: Math.max(0, fireMonthlySavings ?? 0) },
    { name: "Observed surplus", value: surplus },
    { name: "Policy amount", value: Math.max(0, policyDeployment) },
    { name: "Supported now", value: supported },
  ];

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 px-4 xl:grid-cols-2 lg:px-6">
      <AnalyticsChartCard
        id="twin-monthly-flow"
        title="From salary to investment policy"
        description="A monthly flow using median imported take-home and the current household budget."
        metric={observedSurplus === null ? "—" : formatCurrency(surplus, currency)}
        metricLabel="owner-only observed surplus"
      >
        {nodes.length > 1 && links.length > 0 ? (
          <EChartsSankeyChart
            data={{ nodes, links }}
            config={config}
            className="h-[360px] min-w-0 w-full sm:h-[420px]"
            nodeWidth={isMobile ? 58 : 88}
            nodePadding={isMobile ? 10 : 14}
            linkCurvature={0.55}
          >
            <EChartsSankeyChart.Tooltip variant="frosted-glass" roundness="lg" />
            <EChartsSankeyChart.Link variant="gradient" />
            <EChartsSankeyChart.Node radius={5} isClickable>
              <EChartsSankeyChart.NodeLabel
                position="inside"
                showValues={!isMobile}
                valueFormatter={(value) => formatCompactCurrency(value, currency)}
              />
            </EChartsSankeyChart.Node>
          </EChartsSankeyChart>
        ) : (
          <div className="flex h-[360px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
            Import recent payslips and configure the household budget to activate the verified
            monthly flow.
          </div>
        )}
      </AnalyticsChartCard>

      <AnalyticsChartCard
        id="twin-capacity-check"
        title="Contribution reality check"
        description="Configured intentions are shown beside evidence-backed owner-only capacity; no amount is silently substituted."
        metric={supportedDeployment === null ? "—" : formatCurrency(supported, currency)}
        metricLabel="supported monthly deployment"
      >
        <EChartsBarChart
          data={capacityData}
          config={capacityConfig}
          xDataKey="name"
          layout="horizontal"
          className="h-[360px] min-w-0 w-full sm:h-[420px]"
          barRadius={6}
          chartOptions={{ grid: { left: 8, right: 12, top: 20, bottom: 24, containLabel: true } }}
        >
          <EChartsBarChart.Grid />
          <EChartsBarChart.XAxis
            tickFormatter={(value) => formatCompactCurrency(Number(value), currency)}
          />
          <EChartsBarChart.YAxis dataKey="name" hideDots />
          <EChartsBarChart.Tooltip
            variant="frosted-glass"
            roundness="lg"
            valueFormatter={(value) => formatCurrency(value, currency)}
          />
          <EChartsBarChart.Bar dataKey="value" variant="default" glowing enableHoverHighlight />
        </EChartsBarChart>
      </AnalyticsChartCard>
    </div>
  );
}
