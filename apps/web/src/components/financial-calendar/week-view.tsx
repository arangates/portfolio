"use client";

import type { FinancialEvent } from "@portfolio/api/calendar-calculations";
import { getCategoryConfig } from "./category-config";
import { useAmountFormat } from "@/components/amount-preferences";
import { cn } from "@portfolio/ui/lib/utils";
import { Badge } from "@portfolio/ui/components/badge";

interface WeekViewProps {
  dates: string[]; // 7 days of the week in YYYY-MM-DD
  today: string;
  events: FinancialEvent[];
  onOpenDayView: (date: string) => void;
  onSelectEvent: (event: FinancialEvent) => void;
}

export function WeekView({ dates, today, events, onOpenDayView, onSelectEvent }: WeekViewProps) {
  const { formatCurrency } = useAmountFormat();

  return (
    <div className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden flex flex-col">
      {/* 7 Columns for the week */}
      <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-border/60">
        {dates.map((dateStr) => {
          const dateObj = new Date(`${dateStr}T12:00:00Z`);
          const weekday = new Intl.DateTimeFormat("en", {
            weekday: "short",
            timeZone: "UTC",
          }).format(dateObj);
          const dayNumber = Number(dateStr.slice(-2));
          const isToday = dateStr === today;
          const dayEvents = events.filter((e) => e.date === dateStr);

          return (
            <div
              key={dateStr}
              className={cn(
                "flex flex-col min-h-[380px] md:min-h-[500px] p-3 transition-colors",
                isToday ? "bg-primary/[0.02]" : "bg-card",
              )}
            >
              {/* Day Header */}
              <button
                type="button"
                onClick={() => onOpenDayView(dateStr)}
                className="w-full flex items-center justify-between md:flex-col md:items-center py-2 px-2 rounded-xl hover:bg-muted/50 transition-colors group text-left md:text-center"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground">
                  {weekday}
                </span>

                <div className="flex items-center gap-2 md:mt-1">
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                      isToday
                        ? "bg-[#FF3B30] text-white shadow-sm"
                        : "text-foreground group-hover:bg-muted",
                    )}
                  >
                    {dayNumber}
                  </div>
                </div>

                {dayEvents.length > 0 && (
                  <span className="text-[11px] font-medium text-muted-foreground mt-0.5 hidden md:block">
                    {dayEvents.length} event{dayEvents.length === 1 ? "" : "s"}
                  </span>
                )}
              </button>

              {/* Day's Event List */}
              <div className="mt-3 space-y-2 flex-1 overflow-y-auto">
                {dayEvents.length > 0 ? (
                  dayEvents.map((event) => {
                    const config = getCategoryConfig(event.category);
                    const formattedAmount =
                      event.amount !== null && event.currency
                        ? formatCurrency(event.amount, event.currency)
                        : null;

                    return (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => onSelectEvent(event)}
                        className={cn(
                          "w-full text-left p-2.5 rounded-xl border transition-all duration-150 hover:shadow-sm active:scale-98 flex flex-col gap-1.5",
                          config.bgClass,
                          config.borderClass,
                        )}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
                            style={{ color: config.color }}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: config.color }}
                            />
                            {event.category}
                          </span>
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                            {event.planned ? "Plan" : "Done"}
                          </Badge>
                        </div>

                        <div className="font-semibold text-xs text-foreground leading-snug line-clamp-2">
                          {event.title}
                        </div>

                        {formattedAmount && (
                          <div className="text-xs font-bold tabular-nums text-foreground mt-0.5">
                            {formattedAmount}
                          </div>
                        )}

                        {event.detail && (
                          <div className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                            {event.detail}
                          </div>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="h-full flex items-center justify-center p-4">
                    <span className="text-[11px] text-muted-foreground/40 italic">No events</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
