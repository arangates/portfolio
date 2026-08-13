"use client";

import { formatCurrency } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zerodha-coin/ui/components/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@zerodha-coin/ui/components/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const allocationConfig = {
  value: { label: "Value", color: "var(--chart-1)" },
} satisfies ChartConfig;

const historyConfig = {
  marketValue: { label: "Market value", color: "var(--chart-1)" },
  investedValue: { label: "Invested value", color: "var(--chart-2)" },
} satisfies ChartConfig;

function compactNumber(value: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function PortfolioCharts({
  allocation,
  equityHistory,
  currency,
}: {
  allocation: Array<{ category: string; value: number }>;
  equityHistory: Array<{ date: string; investedValue: number; marketValue: number }>;
  currency: string;
}) {
  return (
    <div className="grid gap-4 px-4 xl:grid-cols-2 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Asset allocation</CardTitle>
          <CardDescription>Current value by asset category in {currency}.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={allocationConfig} className="h-[300px] w-full">
            <BarChart accessibilityLayer data={allocation} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="category"
                type="category"
                tickLine={false}
                axisLine={false}
                width={120}
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
      <Card>
        <CardHeader>
          <CardTitle>Indian equity history</CardTitle>
          <CardDescription>
            Invested value versus market value across archived uploads.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={historyConfig} className="h-[300px] w-full">
            <AreaChart accessibilityLayer data={equityHistory} margin={{ left: 8, right: 8 }}>
              <defs>
                <linearGradient id="fill-market" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-marketValue)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-marketValue)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={72}
                tickFormatter={(value) => compactNumber(Number(value), "INR")}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(Number(value), "INR")}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                dataKey="marketValue"
                type="monotone"
                fill="url(#fill-market)"
                stroke="var(--color-marketValue)"
              />
              <Area
                dataKey="investedValue"
                type="monotone"
                fill="transparent"
                stroke="var(--color-investedValue)"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
