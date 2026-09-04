"use client";

import { cn } from "@portfolio/ui/lib/utils";
import * as echarts from "echarts";
import { useEffect, useRef } from "react";

export type EChartsVisualizationOption = echarts.EChartsOption;

export function EChartsVisualization({
  option,
  className,
  ariaLabel,
}: {
  option: EChartsVisualizationOption;
  className?: string;
  ariaLabel: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const chart = echarts.init(container, undefined, { renderer: "canvas" });
    chart.setOption(option, { notMerge: true });
    const resizeObserver = new ResizeObserver(() => chart.resize());
    resizeObserver.observe(container);
    return () => {
      resizeObserver.disconnect();
      chart.dispose();
    };
  }, [option]);

  return (
    <div
      ref={containerRef}
      className={cn("min-h-0 min-w-0", className)}
      role="img"
      aria-label={ariaLabel}
    />
  );
}
