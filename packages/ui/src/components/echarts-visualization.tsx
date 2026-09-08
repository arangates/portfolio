"use client";

import { cn } from "@portfolio/ui/lib/utils";
import type * as echarts from "echarts";
import { useEffect, useRef, useState } from "react";

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
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    let chart: echarts.ECharts | undefined;
    let resizeObserver: ResizeObserver | undefined;
    void import("echarts")
      .then((library) => {
        if (cancelled) return;
        chart = library.init(container, undefined, { renderer: "canvas" });
        chart.setOption(option, { notMerge: true });
        resizeObserver = new ResizeObserver(() => chart?.resize());
        resizeObserver.observe(container);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      chart?.dispose();
    };
  }, [option, attempt]);

  if (failed)
    return (
      <div
        className={cn(
          "flex min-h-40 flex-col items-center justify-center gap-3 text-sm text-muted-foreground",
          className,
        )}
        role="status"
      >
        <p>Unable to load this chart. Check your connection.</p>
        <button
          type="button"
          className="min-h-11 rounded-md border px-4 focus-visible:ring-2"
          onClick={() => {
            setFailed(false);
            setAttempt((value) => value + 1);
          }}
        >
          Retry chart
        </button>
      </div>
    );

  return (
    <div
      ref={containerRef}
      className={cn("min-h-0 min-w-0", className)}
      role="img"
      aria-label={ariaLabel}
    />
  );
}
