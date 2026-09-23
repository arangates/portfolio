"use client";

import { useAmountFormat } from "@/components/amount-preferences";
import { formatCompactCurrency, formatFullCurrency, formatPercent } from "@/lib/format";
import {
  EChartsPieChart,
  type ChartConfig,
} from "@portfolio/ui/components/evilcharts/charts/echarts-pie-chart";

export function AllocationPieChart({
  data,
  config,
  currency,
  className = "h-[280px]",
  ariaLabel,
}: {
  data: Array<{ id: string; value: number }>;
  config: ChartConfig;
  currency: string;
  className?: string;
  ariaLabel: string;
}) {
  const { formatCurrency } = useAmountFormat();
  const visibleData = data.filter((item) => item.value > 0);
  const total = visibleData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="grid min-w-0 items-center gap-2 sm:grid-cols-[minmax(220px,0.9fr)_minmax(0,1.1fr)]">
      <EChartsPieChart
        data={visibleData}
        config={config}
        dataKey="value"
        nameKey="id"
        className={`${className} min-w-0 w-full`}
      >
        <EChartsPieChart.Pie
          variant="gradient"
          innerRadius="55%"
          outerRadius="82%"
          cornerRadius={5}
          paddingAngle={2}
          isClickable
        />
        <EChartsPieChart.Tooltip
          variant="frosted-glass"
          roundness="lg"
          valueFormatter={(value) => formatCurrency(value, currency)}
        />
      </EChartsPieChart>

      <ul
        className="grid min-w-0 gap-1 px-2 pb-2 sm:max-h-[280px] sm:overflow-y-auto sm:py-2 sm:pr-3"
        aria-label={ariaLabel}
      >
        {visibleData.map((item) => {
          const configuredColors = config[item.id]?.colors;
          const colors = Array.isArray(configuredColors)
            ? configuredColors
            : (configuredColors?.dark ?? configuredColors?.light ?? ["#71717a", "#a1a1aa"]);
          const label = config[item.id]?.label;
          return (
            <li
              key={item.id}
              className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
            >
              <span
                className="size-2.5 shrink-0 rounded-[3px]"
                style={{
                  background: `linear-gradient(135deg, ${colors[0]}, ${colors[1] ?? colors[0]})`,
                }}
                aria-hidden="true"
              />
              <span
                className="truncate text-xs font-medium"
                title={typeof label === "string" ? label : undefined}
              >
                {label ?? item.id}
              </span>
              <span
                className="whitespace-nowrap text-right text-xs font-medium tabular-nums"
                title={formatFullCurrency(item.value, currency)}
              >
                {formatCompactCurrency(item.value, currency)}
                <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                  · {formatPercent(total === 0 ? 0 : item.value / total, 1)}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
