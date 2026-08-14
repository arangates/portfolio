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
import { Area, AreaChart, Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";

const earningsConfig = {
  baseSalary: { label: "Base salary", color: "var(--chart-1)" },
  supplementalGross: { label: "Bonus & special", color: "var(--chart-2)" },
  netPay: { label: "Net pay", color: "var(--chart-3)" },
} satisfies ChartConfig;

const deductionsConfig = {
  wageTax: { label: "Wage tax", color: "var(--chart-1)" },
  pensionContribution: { label: "Pension", color: "var(--chart-2)" },
  socialInsurance: { label: "Insurance", color: "var(--chart-4)" },
} satisfies ChartConfig;

function compactNumber(value: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function SalaryCharts({
  data,
  currency,
}: {
  data: Array<{
    month: string;
    baseSalary: number;
    supplementalGross: number;
    netPay: number;
    wageTax: number;
    pensionContribution: number;
    socialInsurance: number;
  }>;
  currency: string;
}) {
  return (
    <div className="grid gap-4 px-4 xl:grid-cols-2 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Earnings and take-home</CardTitle>
          <CardDescription>
            Recurring base pay, special earnings and deposited net pay.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={earningsConfig} className="h-[320px] w-full">
            <ComposedChart accessibilityLayer data={data} margin={{ left: 8, right: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={72}
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
              <Bar dataKey="baseSalary" stackId="gross" fill="var(--color-baseSalary)" radius={3} />
              <Bar
                dataKey="supplementalGross"
                stackId="gross"
                fill="var(--color-supplementalGross)"
                radius={3}
              />
              <Line
                dataKey="netPay"
                type="monotone"
                stroke="var(--color-netPay)"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Tax and retirement contributions</CardTitle>
          <CardDescription>
            Monthly wage tax, employee pension and social insurance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={deductionsConfig} className="h-[320px] w-full">
            <AreaChart accessibilityLayer data={data} margin={{ left: 8, right: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={72}
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
                dataKey="wageTax"
                type="monotone"
                stackId="deductions"
                fill="var(--color-wageTax)"
                stroke="var(--color-wageTax)"
                fillOpacity={0.45}
              />
              <Area
                dataKey="pensionContribution"
                type="monotone"
                stackId="deductions"
                fill="var(--color-pensionContribution)"
                stroke="var(--color-pensionContribution)"
                fillOpacity={0.5}
              />
              <Area
                dataKey="socialInsurance"
                type="monotone"
                stackId="deductions"
                fill="var(--color-socialInsurance)"
                stroke="var(--color-socialInsurance)"
                fillOpacity={0.55}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
