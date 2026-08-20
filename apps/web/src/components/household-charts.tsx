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
import { Bar, BarChart, CartesianGrid, Line, ComposedChart, XAxis, YAxis } from "recharts";

const categoryConfig = {
  amount: { label: "Monthly expense", color: "var(--chart-1)" },
} satisfies ChartConfig;
const scenarioConfig = {
  grossExpenses: { label: "Gross expenses", color: "var(--chart-1)" },
  refunds: { label: "Refunds", color: "var(--chart-2)" },
  netMonthly: { label: "Net household cost", color: "var(--chart-3)" },
} satisfies ChartConfig;

function compact(value: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function HouseholdCharts({
  categories,
  scenarios,
  currency,
}: {
  categories: Array<{ category: string; amount: number }>;
  scenarios: Array<{
    name: string;
    grossExpenses: number;
    refunds: number;
    netMonthly: number;
  }>;
  currency: string;
}) {
  return (
    <div className="grid gap-4 px-4 xl:grid-cols-2 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Where the monthly budget goes</CardTitle>
          <CardDescription>Gross expenses grouped from the current budget.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={categoryConfig} className="h-[320px] w-full">
            <BarChart accessibilityLayer data={categories} margin={{ left: 8, right: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="category" tickLine={false} axisLine={false} minTickGap={20} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={72}
                tickFormatter={(value) => compact(Number(value), currency)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(Number(value), currency)}
                  />
                }
              />
              <Bar dataKey="amount" fill="var(--color-amount)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Scenario comparison</CardTitle>
          <CardDescription>
            Refunds are deducted once at household level before costs are divided per adult.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={scenarioConfig} className="h-[320px] w-full">
            <ComposedChart accessibilityLayer data={scenarios} margin={{ left: 8, right: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} minTickGap={20} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={72}
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
                dataKey="grossExpenses"
                fill="var(--color-grossExpenses)"
                radius={[4, 4, 0, 0]}
              />
              <Bar dataKey="refunds" fill="var(--color-refunds)" radius={[4, 4, 0, 0]} />
              <Line
                dataKey="netMonthly"
                type="monotone"
                stroke="var(--color-netMonthly)"
                strokeWidth={2}
                dot
              />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
