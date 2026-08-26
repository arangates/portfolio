"use client";

import { AnalyticsChartCard } from "@/components/analytics-chart-card";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatCurrency, formatPercent } from "@/lib/format";
import {
  EChartsSankeyChart,
  type ChartConfig,
  type SankeyData,
} from "@portfolio/ui/components/evilcharts/charts/echarts-sankey-chart";

type FlowAsset = {
  category: string;
  baseValue: number | null;
  liquidBaseValue?: number | null;
  isLiquid: boolean;
};

const palette = [
  { light: ["#7c3aed", "#a78bfa"], dark: ["#8b5cf6", "#c4b5fd"] },
  { light: ["#d97706", "#f59e0b"], dark: ["#f59e0b", "#fcd34d"] },
  { light: ["#2563eb", "#60a5fa"], dark: ["#3b82f6", "#93c5fd"] },
  { light: ["#e11d48", "#fb7185"], dark: ["#f43f5e", "#fda4af"] },
  { light: ["#0891b2", "#22d3ee"], dark: ["#06b6d4", "#67e8f9"] },
  { light: ["#ea580c", "#fb923c"], dark: ["#f97316", "#fdba74"] },
];

const rootColors = { light: ["#0f766e", "#14b8a6"], dark: ["#14b8a6", "#5eead4"] };
const liquidColors = { light: ["#047857", "#10b981"], dark: ["#10b981", "#6ee7b7"] };
const longTermColors = { light: ["#a16207", "#eab308"], dark: ["#ca8a04", "#fde047"] };

function compact(value: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function safeKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function compactLabel(value: string) {
  const labels: Record<string, string> = {
    "Marketable securities": "Securities",
    "Fixed deposits": "Deposits",
    "Other assets": "Other",
  };
  return labels[value] ?? value;
}

export function PortfolioFlowChart({
  assets,
  netWorth,
  liquidValue,
  currency,
}: {
  assets: FlowAsset[];
  netWorth: number;
  liquidValue: number;
  currency: string;
}) {
  const isMobile = useIsMobile();
  const branches = new Map<string, number>();
  for (const asset of assets) {
    if (asset.baseValue == null || asset.baseValue <= 0) continue;
    const liquid = Math.min(
      asset.baseValue,
      Math.max(
        0,
        asset.liquidBaseValue !== undefined
          ? (asset.liquidBaseValue ?? 0)
          : asset.isLiquid
            ? asset.baseValue
            : 0,
      ),
    );
    const longTerm = asset.baseValue - liquid;
    if (liquid > 0) {
      const key = `Liquid · ${asset.category}`;
      branches.set(key, (branches.get(key) ?? 0) + liquid);
    }
    if (longTerm > 0) {
      const key = `Long-term · ${asset.category}`;
      branches.set(key, (branches.get(key) ?? 0) + longTerm);
    }
  }

  const longTermValue = Math.max(0, netWorth - liquidValue);
  const flowLiquidValue = [...branches.entries()]
    .filter(([key]) => key.startsWith("Liquid ·"))
    .reduce((sum, [, value]) => sum + value, 0);
  const flowLongTermValue = [...branches.entries()]
    .filter(([key]) => key.startsWith("Long-term ·"))
    .reduce((sum, [, value]) => sum + value, 0);
  const grossFlowValue = flowLiquidValue + flowLongTermValue;
  const hasNegativeAdjustments = Math.abs(grossFlowValue - netWorth) > 0.01;
  const bucketRows = [
    {
      id: "bucket-liquid",
      label: "Liquid assets",
      value: flowLiquidValue,
      prefix: "Liquid ·",
      colors: liquidColors,
    },
    {
      id: "bucket-long-term",
      label: "Long-term assets",
      value: flowLongTermValue,
      prefix: "Long-term ·",
      colors: longTermColors,
    },
  ].filter((row) => row.value > 0);
  const rootLabel = hasNegativeAdjustments ? "Gross assets" : "Net worth";
  const nodes: SankeyData["nodes"] = [
    { name: "portfolio-total" },
    ...bucketRows.map((row) => ({ name: row.id })),
  ];
  const links: Array<{ source: number; target: number; value: number }> = [];
  for (let index = 0; index < bucketRows.length; index += 1) {
    links.push({ source: 0, target: index + 1, value: bucketRows[index]!.value });
  }

  const groupedBranches = new Map<string, { bucketIndex: number; label: string; value: number }>();
  for (const [branch, value] of branches) {
    const bucketIndex = bucketRows.findIndex((row) => branch.startsWith(row.prefix));
    if (bucketIndex < 0) continue;
    const category = branch.split(" · ")[1] ?? branch;
    const isSmall = grossFlowValue > 0 && value / grossFlowValue < 0.015;
    const key = isSmall ? `${bucketIndex}:other` : `${bucketIndex}:${category}`;
    const existing = groupedBranches.get(key);
    groupedBranches.set(key, {
      bucketIndex,
      label: isSmall ? "Other assets" : category,
      value: (existing?.value ?? 0) + value,
    });
  }

  const branchRows = [...groupedBranches.values()].sort((left, right) => right.value - left.value);
  for (const [index, branch] of branchRows.entries()) {
    const target = nodes.length;
    nodes.push({
      name: `category-${branch.bucketIndex}-${safeKey(branch.label)}-${index}`,
      showValue: false,
      hideLabel: grossFlowValue > 0 && branch.value / grossFlowValue < 0.025,
    });
    links.push({ source: branch.bucketIndex + 1, target, value: branch.value });
  }

  const config = {
    "portfolio-total": { label: rootLabel, colors: rootColors },
    ...Object.fromEntries(
      bucketRows.map((bucket) => [
        bucket.id,
        {
          label: isMobile ? bucket.label.replace(" assets", "") : bucket.label,
          colors: bucket.colors,
        },
      ]),
    ),
    ...Object.fromEntries(
      branchRows.map((branch, index) => [
        `category-${branch.bucketIndex}-${safeKey(branch.label)}-${index}`,
        {
          label: isMobile ? compactLabel(branch.label) : branch.label,
          colors: palette[index % palette.length]!,
        },
      ]),
    ),
  } satisfies ChartConfig;

  return (
    <div className="px-4 lg:px-6">
      <AnalyticsChartCard
        id="wealth-flow"
        title="Where your net worth sits"
        description={
          hasNegativeAdjustments
            ? `Positive assets by liquidity and class in ${currency}; negative balances remain reflected in net worth.`
            : `An exact flow from total wealth to liquidity and asset class in ${currency}.`
        }
        metric={formatCurrency(netWorth, currency)}
        metricLabel="included net worth"
      >
        <EChartsSankeyChart
          data={{ nodes, links }}
          config={config}
          className="h-[410px] min-w-0 w-full sm:h-[450px]"
          nodeWidth={isMobile ? 72 : 104}
          nodePadding={isMobile ? 12 : 16}
          linkCurvature={0.55}
        >
          <EChartsSankeyChart.Tooltip variant="frosted-glass" roundness="lg" />
          <EChartsSankeyChart.Link variant="gradient" />
          <EChartsSankeyChart.Node radius={5} isClickable>
            <EChartsSankeyChart.NodeLabel
              position="inside"
              showValues={!isMobile}
              valueFormatter={(value) => compact(value, currency)}
            />
          </EChartsSankeyChart.Node>
        </EChartsSankeyChart>
        <div className="grid gap-2 border-t px-2 pt-3 sm:grid-cols-3">
          {[
            ["Net worth", netWorth],
            ["Liquid", liquidValue],
            ["Long-term", longTermValue],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-medium tabular-nums">{compact(Number(value), currency)}</p>
              {label !== "Net worth" ? (
                <p className="text-[11px] text-muted-foreground">
                  {formatPercent(netWorth === 0 ? 0 : Number(value) / netWorth, 1)} of net worth
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </AnalyticsChartCard>
    </div>
  );
}
