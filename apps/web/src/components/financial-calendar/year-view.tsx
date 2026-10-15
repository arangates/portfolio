"use client";

import type { FinancialEvent } from "@portfolio/api/calendar-calculations";
import { cn } from "@portfolio/ui/lib/utils";

interface YearViewProps {
  year: number;
  today: string;
  events: FinancialEvent[];
  onOpenMonthView: (month: string) => void;
  onOpenDayView: (date: string) => void;
}

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

function getMonthCalendar(year: number, monthIndex: number) {
  const firstDay = new Date(Date.UTC(year, monthIndex, 1));
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0));
  const offset = firstDay.getUTCDay();
  const totalDays = lastDay.getUTCDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < offset; i++) {
    days.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    days.push(i);
  }
  return days;
}

export function YearView({ year, today, events, onOpenMonthView, onOpenDayView }: YearViewProps) {
  // Pre-index dates with events for instant lookup
  const eventDateSet = new Set(events.map((e) => e.date));

  return (
    <div className="rounded-2xl border border-border/80 bg-card shadow-sm p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 12 }, (_, monthIdx) => {
          const monthString = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;
          const monthName = new Intl.DateTimeFormat("en", {
            month: "long",
            timeZone: "UTC",
          }).format(new Date(Date.UTC(year, monthIdx, 1)));
          const days = getMonthCalendar(year, monthIdx);

          const monthEventCount = events.filter((e) => e.date.startsWith(monthString)).length;

          return (
            <div
              key={monthIdx}
              className="p-3.5 rounded-xl border border-border/60 bg-muted/15 flex flex-col hover:border-border transition-colors"
            >
              {/* Red Month Header (Clickable to jump to that month) */}
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => onOpenMonthView(monthString)}
                  className="text-sm font-bold text-[#FF3B30] hover:underline transition-all text-left"
                  title={`View ${monthName} ${year}`}
                >
                  {monthName}
                </button>
                {monthEventCount > 0 && (
                  <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                    {monthEventCount}
                  </span>
                )}
              </div>

              {/* Weekday initials */}
              <div className="grid grid-cols-7 mb-1 text-center">
                {WEEKDAY_LETTERS.map((letter, idx) => (
                  <div key={idx} className="text-[10px] font-semibold text-muted-foreground/70">
                    {letter}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-y-1 text-center">
                {days.map((dayNum, dayIdx) => {
                  if (dayNum === null) {
                    return <div key={`empty-${dayIdx}`} className="aspect-square" />;
                  }

                  const dateStr = `${monthString}-${String(dayNum).padStart(2, "0")}`;
                  const isToday = dateStr === today;
                  const hasEvents = eventDateSet.has(dateStr);

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => onOpenDayView(dateStr)}
                      className={cn(
                        "aspect-square text-[11px] font-medium rounded-full flex flex-col items-center justify-center transition-all relative hover:bg-muted active:scale-95",
                        isToday && "bg-[#FF3B30] text-white font-bold hover:bg-[#FF3B30]/90",
                        !isToday && hasEvents && "font-bold text-foreground",
                      )}
                      title={`${dateStr}${hasEvents ? " (has financial events)" : ""}`}
                    >
                      <span>{dayNum}</span>
                      {!isToday && hasEvents && (
                        <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
