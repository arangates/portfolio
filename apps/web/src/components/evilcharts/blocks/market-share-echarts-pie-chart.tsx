"use client";

import { formatCompactCurrency, formatCurrency, formatPercent } from "@/lib/format";
import {
  EChartsPieChart,
  type ChartConfig,
} from "@portfolio/ui/components/evilcharts/charts/echarts-pie-chart";
import { cn } from "@portfolio/ui/lib/utils";
import { useState } from "react";

const PALETTE = [
  { light: ["#0a0a0a"], dark: ["#ffffff"] },
  { light: ["#262626"], dark: ["#dedede"] },
  { light: ["#3d3d3d"], dark: ["#bebebe"] },
  { light: ["#545454"], dark: ["#a0a0a0"] },
  { light: ["#6b6b6b"], dark: ["#868686"] },
  { light: ["#7d7d7d"], dark: ["#6f6f6f"] },
  { light: ["#919191"], dark: ["#595959"] },
  { light: ["#a6a6a6"], dark: ["#454545"] },
];

function keyFor(label: string, index: number) {
  const key = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${key || "institution"}-${index}`;
}

export function InstitutionConcentrationPieChart({
  institutions,
  currency = "INR",
}: {
  institutions: Array<{ institution: string; amount: number }>;
  currency?: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const total = institutions.reduce((sum, institution) => sum + institution.amount, 0);
  const series = institutions
    .filter((institution) => institution.amount > 0)
    .toSorted((left, right) => right.amount - left.amount)
    .map((institution, index) => {
      const colors = PALETTE[index % PALETTE.length]!;
      return {
        key: keyFor(institution.institution, index),
        label: institution.institution,
        value: institution.amount,
        share: total === 0 ? 0 : institution.amount / total,
        colors,
      };
    });

  if (series.length === 0) {
    return (
      <div className="flex min-h-80 items-center justify-center px-6 text-center text-sm text-muted-foreground">
        No active principal to analyse.
      </div>
    );
  }

  const chartData = [...series].reverse().map(({ key, value, share }) => ({
    institution: key,
    value,
    share: formatPercent(share, 0),
  }));
  const chartConfig = Object.fromEntries(
    series.map(({ key, label, colors }) => [key, { label, colors }]),
  ) satisfies ChartConfig;

  return (
    <div className="@container flex w-full flex-col px-4 py-3 sm:px-5">
      <div className="relative h-72 w-full shrink-0">
        <EChartsPieChart
          data={chartData}
          config={chartConfig}
          dataKey="value"
          nameKey="institution"
          className="h-72 w-full"
          selectedSector={selected}
          onSelectionChange={(selection) => setSelected(selection?.dataKey ?? null)}
        >
          <EChartsPieChart.Tooltip
            variant="frosted-glass"
            roundness="lg"
            valueFormatter={(value) => formatCurrency(value, currency)}
          />
          <EChartsPieChart.Pie
            isClickable
            innerRadius="52%"
            outerRadius="90%"
            paddingAngle={3}
            startAngle={90}
            endAngle={-270}
          >
            <EChartsPieChart.Label dataKey="share" />
          </EChartsPieChart.Pie>
        </EChartsPieChart>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className="max-w-32 text-center text-xl font-semibold tracking-tight text-primary @xl:text-2xl">
            {formatCompactCurrency(total, currency)}
          </span>
          <span className="text-[10px] text-muted-foreground @xl:text-xs">Active principal</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-1.5 border-t border-border pt-3 @sm:grid-cols-2">
        {series.map(({ key, label, value, share, colors }) => (
          <button
            key={key}
            type="button"
            aria-pressed={selected === key}
            onClick={() => setSelected((prev) => (prev === key ? null : key))}
            className={cn(
              "grid min-w-0 cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-md px-1.5 py-1 text-left text-xs transition-[background-color,opacity] hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected !== null && selected !== key && "opacity-40",
            )}
          >
            <span
              className="size-3 shrink-0 rounded-[3px]"
              style={{ backgroundColor: colors.dark[0] }}
              aria-hidden="true"
            />
            <span className="truncate font-medium text-primary" title={label}>
              {label}
            </span>
            <span className="whitespace-nowrap tabular-nums text-muted-foreground">
              {formatCompactCurrency(value, currency)} · {formatPercent(share, 0)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
