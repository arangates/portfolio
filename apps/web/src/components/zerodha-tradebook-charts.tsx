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
import { Bar, BarChart, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";

const cashFlowConfig = {
  buys: { label: "Purchases", color: "var(--chart-1)" },
  sells: { label: "Redemptions", color: "var(--chart-2)" },
  netInvested: { label: "Net invested", color: "var(--chart-4)" },
} satisfies ChartConfig;

const fundConfig = {
  buyAmount: { label: "Purchases", color: "var(--chart-1)" },
} satisfies ChartConfig;

const compact = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

export function ZerodhaTradebookCharts({
  monthly,
  funds,
}: {
  monthly: Array<{ month: string; buys: number; sells: number; netInvested: number }>;
  funds: Array<{ name: string; buyAmount: number }>;
}) {
  const topFunds = funds.slice(0, 8).map((fund) => ({
    ...fund,
    label: fund.name
      .replace(/\s+-\s+DIRECT.*$/i, "")
      .replace(/\s+DIRECT.*$/i, "")
      .slice(0, 34),
  }));

  return (
    <div className="grid gap-4 px-4 xl:grid-cols-2 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Monthly investment flow</CardTitle>
          <CardDescription>
            Actual purchases, redemptions and net invested cash from imported trades.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={cashFlowConfig} className="h-[320px] w-full">
            <ComposedChart accessibilityLayer data={monthly} margin={{ left: 8, right: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={72}
                tickFormatter={(value) => compact(Number(value))}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(Number(value), "INR")}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="buys" fill="var(--color-buys)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="sells" fill="var(--color-sells)" radius={[4, 4, 0, 0]} />
              <Line
                dataKey="netInvested"
                type="monotone"
                stroke="var(--color-netInvested)"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Where contributions went</CardTitle>
          <CardDescription>
            Top funds by cumulative purchase amount across all imported years.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={fundConfig} className="h-[320px] w-full">
            <BarChart accessibilityLayer data={topFunds} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="label"
                type="category"
                tickLine={false}
                axisLine={false}
                width={150}
              />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => compact(Number(value))}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value) => formatCurrency(Number(value), "INR")}
                  />
                }
              />
              <Bar dataKey="buyAmount" fill="var(--color-buyAmount)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
