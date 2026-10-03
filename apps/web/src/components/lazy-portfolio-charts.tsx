"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

import type { PortfolioCharts } from "@/components/portfolio-charts";

// Keeps the ECharts runtime out of the initial JS; the fixed height prevents layout shift.
const Charts = dynamic(
  () => import("@/components/portfolio-charts").then((module) => module.PortfolioCharts),
  {
    ssr: false,
    loading: () => (
      <div className="px-4 lg:px-6" aria-hidden>
        <div className="h-[420px] animate-pulse rounded-xl bg-muted/40" />
      </div>
    ),
  },
);

export function LazyPortfolioCharts(props: ComponentProps<typeof PortfolioCharts>) {
  return <Charts {...props} />;
}
