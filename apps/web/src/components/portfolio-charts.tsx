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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@portfolio/ui/components/chart";
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
  allocationTitle = "Asset allocation",
  historyTitle = "Indian equity history",
  historyDescription = "Invested value versus market value across archived uploads.",
}: {
  allocation: Array<{ category: string; value: number }>;
  equityHistory: Array<{ date: string; investedValue: number; marketValue: number }>;
  currency: string;
  allocationTitle?: string;
  historyTitle?: string;
  historyDescription?: string;
}) {
  return (
    <div className="grid min-w-0 gap-4 px-4 xl:grid-cols-2 lg:px-6">
      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle>{allocationTitle}</CardTitle>
          <CardDescription>Current value by asset category in {currency}.</CardDescription>
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
                width={88}
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
          <CardTitle>{historyTitle}</CardTitle>
          <CardDescription>{historyDescription}</CardDescription>
        </CardHeader>
        <CardContent className="min-w-0 px-2 sm:px-6">
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
