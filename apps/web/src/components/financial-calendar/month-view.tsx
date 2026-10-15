"use client";

import type { FinancialEvent } from "@portfolio/api/calendar-calculations";
import { calendarCells } from "@portfolio/api/calendar-calculations";
import { getCategoryConfig } from "./category-config";
import { useAmountFormat } from "@/components/amount-preferences";
import { cn } from "@portfolio/ui/lib/utils";

interface MonthViewProps {
  month: string;
  today: string;
  events: FinancialEvent[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onOpenDayView: (date: string) => void;
  onSelectEvent: (event: FinancialEvent) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthView({
  month,
  today,
  events,
  selectedDate,
  onSelectDate,
  onOpenDayView,
  onSelectEvent,
}: MonthViewProps) {
  const { formatCurrency } = useAmountFormat();
  const cells = calendarCells(month);

  return (
    <div className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden flex flex-col">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border/70 bg-muted/30 select-none">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar 7x6 grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-border/60">
        {cells.map((dateStr) => {
          const isCurrentMonth = dateStr.startsWith(month);
          const isToday = dateStr === today;
          const isSelected = selectedDate === dateStr;
          const dayNumber = Number(dateStr.slice(-2));
          const dayEvents = events.filter((e) => e.date === dateStr);

          return (
            <div
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={cn(
                "min-h-24 sm:min-h-28 lg:min-h-32 p-1.5 sm:p-2 flex flex-col transition-colors cursor-pointer group relative",
                !isCurrentMonth && "bg-muted/15 text-muted-foreground/40",
                isCurrentMonth && "hover:bg-muted/30",
                isSelected && "bg-primary/5 ring-1 ring-inset ring-primary/40",
              )}
            >
              {/* Day header row */}
              <div className="flex items-center justify-between mb-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDayView(dateStr);
                  }}
                  title="Click to open Day View"
                  className={cn(
                    "h-6 min-w-6 px-1 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
                    isToday
                      ? "bg-[#FF3B30] text-white shadow-xs font-bold"
                      : isCurrentMonth
                        ? "text-foreground group-hover:bg-muted"
                        : "text-muted-foreground/40",
                  )}
                >
                  {dayNumber === 1 && !isToday ? (
                    <span>
                      {new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(
                        new Date(`${dateStr}T12:00:00Z`),
                      )}{" "}
                      1
                    </span>
                  ) : (
                    dayNumber
                  )}
                </button>

                {/* Day events count pill if many */}
                {dayEvents.length > 0 && (
                  <span className="text-[10px] font-medium text-muted-foreground/70 sm:hidden">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              {/* Event chips */}
              <div className="space-y-1 overflow-hidden flex-1">
                {dayEvents.slice(0, 3).map((event) => {
                  const config = getCategoryConfig(event.category);
                  const formattedAmount =
                    event.amount !== null && event.currency
                      ? formatCurrency(event.amount, event.currency)
                      : null;

                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(event);
                      }}
                      className={cn(
                        "w-full text-left rounded-md px-1.5 py-0.5 text-[11px] truncate flex items-center gap-1.5 border transition-all duration-100 hover:brightness-95 active:scale-98",
                        config.bgClass,
                        config.borderClass,
                        config.textClass,
                      )}
                      title={`${event.title}${formattedAmount ? ` (${formattedAmount})` : ""}`}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: config.color }}
                      />
                      <span className="font-semibold truncate flex-1">{event.title}</span>
                      {formattedAmount && (
                        <span className="shrink-0 text-[10px] font-bold tabular-nums opacity-90 hidden sm:inline">
                          {formattedAmount}
                        </span>
                      )}
                    </button>
                  );
                })}

                {dayEvents.length > 3 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDayView(dateStr);
                    }}
                    className="text-[10px] font-semibold text-muted-foreground hover:text-foreground pl-1 block transition-colors"
                  >
                    +{dayEvents.length - 3} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
