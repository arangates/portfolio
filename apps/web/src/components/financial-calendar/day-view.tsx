"use client";

import type { FinancialEvent } from "@portfolio/api/calendar-calculations";
import { getCategoryConfig } from "./category-config";
import { useAmountFormat } from "@/components/amount-preferences";
import { Badge } from "@portfolio/ui/components/badge";
import { ArrowUpRight, Calendar as CalendarIcon, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@portfolio/ui/lib/utils";

interface DayViewProps {
  date: string; // YYYY-MM-DD
  today: string;
  events: FinancialEvent[];
  onSelectEvent: (event: FinancialEvent) => void;
}

export function DayView({ date, today, events, onSelectEvent }: DayViewProps) {
  const { formatCurrency } = useAmountFormat();
  const dayEvents = events.filter((e) => e.date === date);

  const dateObj = new Date(`${date}T12:00:00Z`);
  const fullDateLabel = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(dateObj);

  const isToday = date === today;

  // Compute metrics
  const plannedCount = dayEvents.filter((e) => e.planned).length;
  const recordedCount = dayEvents.filter((e) => !e.planned).length;

  return (
    <div className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden flex flex-col p-6 space-y-6">
      {/* Header & Date Badge */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {fullDateLabel}
            </h2>
            {isToday && (
              <span className="bg-[#FF3B30] text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-2xs">
                Today
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {dayEvents.length} financial event{dayEvents.length === 1 ? "" : "s"} scheduled for this
            day
          </p>
        </div>

        {/* Quick stats pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-muted/30 text-xs">
            <Clock className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-muted-foreground">Planned:</span>
            <span className="font-semibold text-foreground">{plannedCount}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-muted/30 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-muted-foreground">Recorded:</span>
            <span className="font-semibold text-foreground">{recordedCount}</span>
          </div>
        </div>
      </div>

      {/* Events timeline / list */}
      {dayEvents.length > 0 ? (
        <div className="space-y-3">
          {dayEvents.map((event) => {
            const config = getCategoryConfig(event.category);
            const formattedAmount =
              event.amount !== null && event.currency
                ? formatCurrency(event.amount, event.currency)
                : null;

            return (
              <div
                key={event.id}
                onClick={() => onSelectEvent(event)}
                className={cn(
                  "p-4 rounded-2xl border transition-all duration-150 hover:shadow-md cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group",
                  config.bgClass,
                  config.borderClass,
                )}
              >
                {/* Left Info */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: config.color }}
                    />
                    <span
                      className="text-xs font-bold uppercase tracking-wider"
                      style={{ color: config.color }}
                    >
                      {config.label}
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {event.planned ? "Planned" : "Recorded"}
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-foreground leading-snug group-hover:underline">
                    {event.title}
                  </h3>

                  {event.detail && (
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
                      {event.detail}
                    </p>
                  )}
                </div>

                {/* Right Amount & Link */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                  {formattedAmount ? (
                    <div className="text-base sm:text-lg font-bold tabular-nums text-foreground">
                      {formattedAmount}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground font-medium">
                      Non-monetary event
                    </div>
                  )}

                  {event.href && (
                    <Link
                      href={event.href as any}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <span>Open page</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center rounded-2xl border border-dashed border-border/70 bg-muted/10 p-8">
          <CalendarIcon className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-foreground">No events on this day</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            There are no bills, deposit starts or maturities, salary credits, or bank transactions
            recorded for this date.
          </p>
        </div>
      )}
    </div>
  );
}
