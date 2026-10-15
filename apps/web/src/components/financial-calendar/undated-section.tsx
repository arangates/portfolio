"use client";

import { useState } from "react";
import type { FinancialEvent } from "@portfolio/api/calendar-calculations";
import { Badge } from "@portfolio/ui/components/badge";
import { ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { useAmountFormat } from "@/components/amount-preferences";
import Link from "next/link";

interface UndatedSectionProps {
  events: FinancialEvent[];
  undatedContracts: number;
  year: string;
}

export function UndatedSection({ events, undatedContracts, year }: UndatedSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { formatCurrency } = useAmountFormat();

  const monthOnly = events.filter((e) => e.precision === "month");
  const yearOnly = events.filter((e) => e.precision === "year");

  const totalCount = monthOnly.length + yearOnly.length;

  if (totalCount === 0 && undatedContracts === 0) {
    return null;
  }

  function renderList(rows: FinancialEvent[], emptyMessage: string) {
    if (rows.length === 0) {
      return <p className="py-2.5 text-xs text-muted-foreground">{emptyMessage}</p>;
    }

    return (
      <ul className="divide-y divide-border/50">
        {rows.map((e) => (
          <li key={e.id} className="flex flex-wrap items-start justify-between gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={e.href as any}
                  className="text-xs font-semibold hover:underline text-foreground"
                >
                  {e.title}
                </Link>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {e.planned ? "Planned" : "Recorded"}
                </Badge>
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {e.date} · {e.category}
              </p>
              {e.detail && (
                <p className="mt-0.5 max-w-2xl text-xs text-muted-foreground">{e.detail}</p>
              )}
            </div>
            {e.amount !== null && e.currency ? (
              <span className="text-xs font-bold tabular-nums text-foreground">
                {formatCurrency(e.amount, e.currency)}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-card/70 shadow-sm overflow-hidden select-none">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-muted/40 transition-colors"
      >
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span>Planning Milestones & Payroll Periods</span>
            {totalCount > 0 && (
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {totalCount}
              </span>
            )}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Items specified at the month or year level rather than a specific day
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <span>{isOpen ? "Hide" : "Show"}</span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 pt-2 border-t border-border/50 space-y-4">
          {monthOnly.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Payroll Periods ({monthOnly.length}) · Day unspecified
              </h3>
              <p className="text-[11px] text-muted-foreground mb-2">
                Payroll periods appear here because a payslip establishes the pay cycle rather than
                an exact bank credit date.
              </p>
              {renderList(monthOnly, "No month-only payroll entries.")}
            </div>
          )}

          {yearOnly.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                {year} Planning Goals & Milestones ({yearOnly.length}) · Date unspecified
              </h3>
              <p className="text-[11px] text-muted-foreground mb-2">
                Annual financial independence (FIRE) goals and retirement horizons shown without
                inventing an arbitrary calendar day.
              </p>
              {renderList(yearOnly, "No year-only planning milestones.")}
            </div>
          )}

          {undatedContracts > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">{undatedContracts} active contract(s)</span> have no
                billing day configured. Set their billing day in Household to show them on the day
                grid.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
