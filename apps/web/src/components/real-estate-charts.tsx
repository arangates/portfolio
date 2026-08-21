"use client";

import { formatCurrency } from "@/lib/format";
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
  ChartTooltip,
  ChartTooltipContent,
} from "@portfolio/ui/components/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const allocationConfig = {
  value: { label: "Attributable value", color: "var(--chart-1)" },
} satisfies ChartConfig;

const historyConfig = {
  value: { label: "Attributable value", color: "var(--chart-2)" },
} satisfies ChartConfig;

function compactNumber(value: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function RealEstateCharts({
  allocation,
  history,
  currency,
}: {
  allocation: Array<{ category: string; value: number }>;
  history: Array<{ date: string; value: number }>;
  currency: string;
}) {
  return (
    <div className="grid min-w-0 gap-4 px-4 xl:grid-cols-2 lg:px-6">
      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle>Property allocation</CardTitle>
          <CardDescription>Attributable value by property type.</CardDescription>
        </CardHeader>
        <CardContent className="min-w-0 px-2 sm:px-6">
          <ChartContainer config={allocationConfig} className="h-[300px] w-full">
            <BarChart accessibilityLayer data={allocation} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="category"
                type="category"
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => compactNumber(Number(value), currency)}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value) => formatCurrency(Number(value), currency)}
                  />
                }
              />
              <Bar dataKey="value" fill="var(--color-value)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle>Valuation history</CardTitle>
          <CardDescription>Portfolio value after each dated property snapshot.</CardDescription>
        </CardHeader>
        <CardContent className="min-w-0 px-2 sm:px-6">
          <ChartContainer config={historyConfig} className="h-[300px] w-full">
            <AreaChart accessibilityLayer data={history} margin={{ left: 8, right: 8 }}>
              <defs>
                <linearGradient id="fill-property-value" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={(value) => compactNumber(Number(value), currency)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(Number(value), currency)}
                  />
                }
              />
              <Area
                dataKey="value"
                type="monotone"
                fill="url(#fill-property-value)"
                stroke="var(--color-value)"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
