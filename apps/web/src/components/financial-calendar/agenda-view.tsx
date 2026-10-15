"use client";

import type { FinancialEvent } from "@portfolio/api/calendar-calculations";
import { getCategoryConfig } from "./category-config";
import { useAmountFormat } from "@/components/amount-preferences";
import { Badge } from "@portfolio/ui/components/badge";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@portfolio/ui/lib/utils";

interface AgendaViewProps {
  events: FinancialEvent[];
  today: string;
  onSelectEvent: (event: FinancialEvent) => void;
}

export function AgendaView({ events, today, onSelectEvent }: AgendaViewProps) {
  const { formatCurrency } = useAmountFormat();

  // Group events by date
  const groupedDates = events.reduce(
    (acc, event) => {
      if (!acc[event.date]) {
        acc[event.date] = [];
      }
      acc[event.date]!.push(event);
      return acc;
    },
    {} as Record<string, FinancialEvent[]>,
  );

  const sortedDates = Object.keys(groupedDates).sort();

  if (sortedDates.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-card p-12 text-center text-muted-foreground">
        No financial events match your filter criteria.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-card shadow-sm p-4 sm:p-6 space-y-6">
      {sortedDates.map((dateStr) => {
        const dateEvents = groupedDates[dateStr]!;
        const dateObj = new Date(`${dateStr}T12:00:00Z`);
        const isToday = dateStr === today;

        const dateLabel = new Intl.DateTimeFormat("en", {
          weekday: "short",
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        }).format(dateObj);

        return (
          <div key={dateStr} className="space-y-3">
            {/* Date Group Header */}
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg",
                  isToday
                    ? "bg-[#FF3B30] text-white shadow-2xs"
                    : "bg-muted text-muted-foreground font-semibold",
                )}
              >
                {dateLabel} {isToday ? "· Today" : ""}
              </span>
              <div className="h-px bg-border/60 flex-1" />
            </div>

            {/* Event items */}
            <div className="space-y-2 pl-1 sm:pl-3">
              {dateEvents.map((event) => {
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
                      "p-3.5 rounded-xl border transition-all duration-150 hover:shadow-sm cursor-pointer flex flex-wrap items-center justify-between gap-3 group",
                      config.bgClass,
                      config.borderClass,
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: config.color }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground group-hover:underline truncate">
                            {event.title}
                          </span>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                            {event.planned ? "Planned" : "Recorded"}
                          </Badge>
                        </div>
                        {event.detail && (
                          <p className="text-[11px] text-muted-foreground truncate max-w-xl mt-0.5">
                            {event.detail}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {formattedAmount && (
                        <span className="text-xs sm:text-sm font-bold tabular-nums text-foreground">
                          {formattedAmount}
                        </span>
                      )}
                      {event.href && (
                        <Link
                          href={event.href as any}
                          onClick={(e) => e.stopPropagation()}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="Open details"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
