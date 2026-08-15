"use client";

import { formatCurrency } from "@/lib/format";
import { Button } from "@portfolio/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@portfolio/ui/components/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@portfolio/ui/components/chart";
import { Area, Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { useState } from "react";

type ScenarioResult = {
  id: string;
  name: string;
  retirementYear: number;
  deterministic: Array<{
    year: number;
    closingBalance: number;
    expenses: number;
    income: number;
    oneTimeCosts: number;
  }>;
  monteCarlo: Array<{ year: number; p10: number; median: number; p90: number }>;
};

const projectionConfig = {
  p10: { label: "10th percentile", color: "var(--chart-3)" },
  median: { label: "Median", color: "var(--chart-1)" },
  p90: { label: "90th percentile", color: "var(--chart-2)" },
  deterministic: { label: "Expected path", color: "var(--chart-4)" },
} satisfies ChartConfig;

const cashFlowConfig = {
  expenses: { label: "Living expenses", color: "var(--chart-1)" },
  oneTimeCosts: { label: "One-time costs", color: "var(--chart-3)" },
  income: { label: "Other income", color: "var(--chart-2)" },
} satisfies ChartConfig;

function compact(value: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function FireCharts({ results, currency }: { results: ScenarioResult[]; currency: string }) {
  const [selectedId, setSelectedId] = useState(results[0]?.id ?? "");
  const selected = results.find((result) => result.id === selectedId) ?? results[0];
  if (!selected) return null;
  const expectedByYear = new Map(
    selected.deterministic.map((row) => [row.year, row.closingBalance]),
  );
  const projection = selected.monteCarlo.map((point) => ({
    ...point,
    deterministic: expectedByYear.get(point.year) ?? 0,
  }));
  const cashFlows = selected.deterministic
    .filter((row) => row.year >= selected.retirementYear)
    .map((row) => ({
      year: row.year,
      expenses: row.expenses,
      income: row.income,
      oneTimeCosts: row.oneTimeCosts,
    }));

  return (
    <div className="space-y-4 px-4 lg:px-6">
      <div className="flex flex-wrap gap-2">
        {results.map((result) => (
          <Button
            key={result.id}
            variant={result.id === selected.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedId(result.id)}
          >
            {result.name}
          </Button>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Range of possible outcomes</CardTitle>
            <CardDescription>
              1,000 reproducible return-and-inflation paths for {selected.name}; this is a risk
              range, not a guarantee.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={projectionConfig} className="h-[330px] w-full">
              <ComposedChart accessibilityLayer data={projection} margin={{ left: 8, right: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="year" tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={74}
                  tickFormatter={(value) => compact(Number(value), currency)}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(Number(value), currency)}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  dataKey="p90"
                  type="monotone"
                  fill="var(--color-p90)"
                  fillOpacity={0.08}
                  stroke="var(--color-p90)"
                  strokeWidth={1}
                />
                <Line
                  dataKey="median"
                  type="monotone"
                  stroke="var(--color-median)"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  dataKey="p10"
                  type="monotone"
                  stroke="var(--color-p10)"
                  dot={false}
                  strokeDasharray="4 4"
                />
                <Line
                  dataKey="deterministic"
                  type="monotone"
                  stroke="var(--color-deterministic)"
                  dot={false}
                  strokeDasharray="2 3"
                />
              </ComposedChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Retirement cash-flow map</CardTitle>
            <CardDescription>
              Inflation-adjusted living costs, planned events and non-portfolio income by year.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={cashFlowConfig} className="h-[330px] w-full">
              <ComposedChart accessibilityLayer data={cashFlows} margin={{ left: 8, right: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="year" tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={74}
                  tickFormatter={(value) => compact(Number(value), currency)}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(Number(value), currency)}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="expenses"
                  stackId="outflow"
                  fill="var(--color-expenses)"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="oneTimeCosts"
                  stackId="outflow"
                  fill="var(--color-oneTimeCosts)"
                  radius={[3, 3, 0, 0]}
                />
                <Line
                  dataKey="income"
                  type="monotone"
                  stroke="var(--color-income)"
                  dot={false}
                  strokeWidth={2}
                />
              </ComposedChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
