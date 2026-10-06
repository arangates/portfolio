"use client";

import { Children, isValidElement, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@portfolio/ui/lib/utils";

function declaredChartHeight(node: ReactNode): string[] {
  for (const child of Children.toArray(node)) {
    if (!isValidElement<{ className?: unknown; children?: ReactNode }>(child)) continue;

    if (typeof child.props.className === "string") {
      const heights = child.props.className
        .split(/\s+/)
        .filter((className) => /^(?:[a-z]+:)*h-\[\d+(?:\.\d+)?px\]$/.test(className));
      if (heights.length) return heights;
    }

    const nestedHeights = declaredChartHeight(child.props.children);
    if (nestedHeights.length) return nestedHeights;
  }

  return [];
}

/** Delay chart mounting (and canvas work) until the card approaches the viewport. */
export function DeferredChart({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const heightClasses = declaredChartHeight(children);
  const reservedHeight = heightClasses.length ? heightClasses : ["h-[320px]"];
  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
      setReady(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px" },
    );
    if (ref.current) observer.observe(ref.current);
    const reveal = () => setReady(true);
    window.addEventListener("beforeprint", reveal);
    return () => {
      observer.disconnect();
      window.removeEventListener("beforeprint", reveal);
    };
  }, []);
  return (
    <div ref={ref} className={cn("min-w-0", reservedHeight)} aria-busy={!ready}>
      {ready ? (
        children
      ) : (
        <div
          className="flex h-full w-full items-center justify-center rounded-lg bg-muted/40 text-sm text-muted-foreground"
          aria-hidden="true"
        >
          Chart loads as you scroll
        </div>
      )}
    </div>
  );
}
