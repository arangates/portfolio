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
    <div ref={ref} className="min-h-[360px] min-w-0 sm:min-h-[420px]" aria-busy={!ready}>
      {ready ? (
        children
      ) : (
        <div className="flex h-[360px] items-center justify-center rounded-lg bg-muted/40 text-sm text-muted-foreground motion-safe:animate-pulse sm:h-[420px]">
          Chart loads as you scroll
        </div>
      )}
    </div>
  );
}
