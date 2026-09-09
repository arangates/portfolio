"use client";
import { useState } from "react";
import type { compareSnapshots } from "@portfolio/api/insight-calculations";
import { useAmountFormat } from "./amount-preferences";
import { FreshnessBadge } from "./freshness-badge";
import { CalculationExplanationButton } from "./calculation-explanation";
import { formatDate, formatPercent } from "@/lib/format";
import { Button } from "@portfolio/ui/components/button";

export function SnapshotChanges({ changes }: { changes: ReturnType<typeof compareSnapshots> }) {
  const { formatCurrency } = useAmountFormat();
  const [expanded, setExpanded] = useState(false);
  const rows = expanded ? changes : changes.slice(0, 6);
  return (
    <section
      className="mx-4 rounded-xl border bg-card p-4 lg:mx-6"
      aria-labelledby="snapshot-changes-title"
    >
      <h2 id="snapshot-changes-title" className="font-semibold">
        Changes since previous snapshot
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Latest versus previous dated record for each asset, in its own currency. These differences
        include cash flows and valuation changes; they are not investment returns.
      </p>
      {!changes.length ? (
        <p className="py-6 text-sm">Add dated snapshots to see comparisons.</p>
      ) : (
        <ul className="mt-3 divide-y">
          {rows.map(({ current, previous, delta, percent, reason, drivers }) => (
            <li
              key={current.key}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0 flex-1">
                <a href={current.href} className="font-medium underline-offset-4 hover:underline">
                  {current.name}
                </a>
                <p className="text-xs text-muted-foreground">
                  {current.kind} · {previous ? `${formatDate(previous.asOf)} → ` : ""}
                  {formatDate(current.asOf)}
                </p>
                <FreshnessBadge
                  asOf={current.asOf}
                  maxAgeDays={current.kind === "Property" ? 365 : 31}
                />
              </div>
              <div className="text-right tabular-nums">
                <p className="font-medium">
                  {delta === null
                    ? "No comparison"
                    : `${delta > 0 ? "+" : ""}${formatCurrency(delta, current.currency)}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {percent === null ? "" : formatPercent(percent, 2)}
                </p>
              </div>
              <CalculationExplanationButton
                title={`${current.name} change`}
                explanation={{
                  formula:
                    "Latest recorded value − previous recorded value, with the same native currency. Same-date revisions use the newest saved record.",
                  inputs: [
                    {
                      label: "Previous",
                      value:
                        previous?.value == null
                          ? "Unavailable"
                          : formatCurrency(previous.value, previous.currency),
                    },
                    {
                      label: "Latest",
                      value:
                        current.value === null
                          ? "Unavailable"
                          : formatCurrency(current.value, current.currency),
                    },
                    ...drivers.map((d) => ({
                      label: d.label,
                      value: formatCurrency(d.amount, current.currency),
                    })),
                  ],
                  limitations:
                    reason ??
                    "This is a recorded value difference, not profit or return. Driver attribution applies quantity first, then price, then ownership; residuals reflect other recorded differences. FX is excluded. Missing or exited broker positions are not assumed to be zero.",
                  sourceHref: current.href,
                }}
              />
            </li>
          ))}
        </ul>
      )}
      {changes.length > 6 ? (
        <Button variant="ghost" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
          {expanded ? "Show fewer" : `Show all ${changes.length} assets`}
        </Button>
      ) : null}
    </section>
  );
}
