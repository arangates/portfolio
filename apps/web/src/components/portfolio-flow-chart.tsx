"use client";

import { AnalyticsChartCard } from "@/components/analytics-chart-card";
import { formatCurrency, formatPercent } from "@/lib/format";
import {
  EChartsSankeyChart,
  type ChartConfig,
} from "@portfolio/ui/components/evilcharts/charts/echarts-sankey-chart";

type FlowAsset = {
  category: string;
  baseValue: number | null;
  liquidBaseValue?: number | null;
  isLiquid: boolean;
};

const palette = [
  { light: ["#2563eb"], dark: ["#60a5fa"] },
  { light: ["#059669"], dark: ["#34d399"] },
  { light: ["#7c3aed"], dark: ["#a78bfa"] },
  { light: ["#d97706"], dark: ["#fbbf24"] },
  { light: ["#0891b2"], dark: ["#22d3ee"] },
  { light: ["#dc2626"], dark: ["#f87171"] },
];

function compact(value: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
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
    { key: "Liquid assets", value: flowLiquidValue, prefix: "Liquid ·" },
    { key: "Long-term assets", value: flowLongTermValue, prefix: "Long-term ·" },
  ].filter((row) => row.value > 0);
  const rootName = hasNegativeAdjustments ? "Gross assets" : "Net worth";
  const nodes = [{ name: rootName }, ...bucketRows.map((row) => ({ name: row.key }))];
  const links: Array<{ source: number; target: number; value: number }> = [];
  for (let index = 0; index < bucketRows.length; index += 1) {
    links.push({ source: 0, target: index + 1, value: bucketRows[index]!.value });
  }
  for (const [branch, value] of [...branches.entries()].sort((left, right) => right[1] - left[1])) {
    const bucketIndex = bucketRows.findIndex((row) => branch.startsWith(row.prefix));
    if (bucketIndex < 0) continue;
    const target = nodes.length;
    nodes.push({ name: branch });
    links.push({ source: bucketIndex + 1, target, value });
  }

  const config = Object.fromEntries(
    nodes.map((node, index) => [
      node.name,
      {
        label: node.name.includes(" · ") ? node.name.split(" · ")[1] : node.name,
        colors: palette[index % palette.length]!,
      },
    ]),
  ) satisfies ChartConfig;

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
          className="h-[390px] min-w-0 w-full sm:h-[430px]"
          nodeWidth={16}
          nodePadding={14}
          linkCurvature={0.55}
        >
          <EChartsSankeyChart.Tooltip variant="frosted-glass" roundness="lg" />
          <EChartsSankeyChart.Link variant="gradient" />
          <EChartsSankeyChart.Node radius={5} isClickable>
            <EChartsSankeyChart.NodeLabel position="outside" />
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
