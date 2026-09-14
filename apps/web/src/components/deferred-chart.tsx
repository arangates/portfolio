"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Delay chart mounting (and canvas work) until the card approaches the viewport. */
export function DeferredChart({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
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
    <div ref={ref} className={ready ? "min-w-0" : "min-h-[300px] min-w-0"} aria-busy={!ready}>
      {ready ? (
        children
      ) : (
        <div className="flex h-[300px] items-center justify-center rounded-lg bg-muted/40 text-sm text-muted-foreground motion-safe:animate-pulse">
          Chart loads as you scroll
        </div>
      )}
    </div>
  );
}
