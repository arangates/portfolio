"use client";

import { useState, useTransition, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { validCalendarMonth, type FinancialEvent } from "@portfolio/api/calendar-calculations";
import { CalendarToolbar } from "./calendar-toolbar";
import { MonthView } from "./month-view";
import { WeekView } from "./week-view";
import { DayView } from "./day-view";
import { YearView } from "./year-view";
import { AgendaView } from "./agenda-view";
import { EventDetailsDialog } from "./event-details-dialog";
import { UndatedSection } from "./undated-section";
import type { CalendarViewMode, FinancialCalendarProps } from "./types";

function getWeekDates(centerDateStr: string): string[] {
  const [y, m, d] = centerDateStr.split("-").map(Number);
  const current = new Date(Date.UTC(y!, m! - 1, d!));
  const dayOfWeek = current.getUTCDay(); // 0 = Sun
  const sunday = new Date(current);
  sunday.setUTCDate(current.getUTCDate() - dayOfWeek);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(sunday);
    day.setUTCDate(sunday.getUTCDate() + i);
    dates.push(day.toISOString().slice(0, 10));
  }
  return dates;
}

export function FinancialCalendar({
  month,
  today,
  timeZone: _timeZone,
  events,
  undatedContracts,
}: FinancialCalendarProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [view, setView] = useState<CalendarViewMode>("month");
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeEvent, setActiveEvent] = useState<FinancialEvent | null>(null);

  // Available categories
  const categories = useMemo(() => {
    return [...new Set(events.map((e) => e.category))].sort();
  }, [events]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchesCategory = selectedCategory === "All" || e.category === selectedCategory;
      const matchesQuery =
        !query ||
        `${e.title} ${e.detail} ${e.category}`.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [events, selectedCategory, query]);

  // Dated events
  const datedEvents = useMemo(() => {
    return filteredEvents.filter((e) => e.precision === "day");
  }, [filteredEvents]);

  // Navigate month on server
  const navigateMonth = useCallback(
    (nextMonth: string) => {
      if (validCalendarMonth(nextMonth, "") !== nextMonth) return;
      startTransition(() => {
        router.push(`/dashboard/calendar?month=${nextMonth}` as Route);
      });
    },
    [router],
  );

  // Shift month by delta
  const shiftMonth = useCallback(
    (delta: number) => {
      const [y, m] = month.split("-").map(Number);
      const d = new Date(Date.UTC(y!, m! - 1 + delta, 1));
      const next = d.toISOString().slice(0, 7);
      navigateMonth(next);
    },
    [month, navigateMonth],
  );

  // Shift day by delta
  const shiftDay = useCallback(
    (delta: number) => {
      const [y, m, d] = selectedDate.split("-").map(Number);
      const target = new Date(Date.UTC(y!, m! - 1, d! + delta));
      const nextDate = target.toISOString().slice(0, 10);
      setSelectedDate(nextDate);
      const targetMonth = nextDate.slice(0, 7);
      if (targetMonth !== month) {
        navigateMonth(targetMonth);
      }
    },
    [selectedDate, month, navigateMonth],
  );

  // Shift week by delta
  const shiftWeek = useCallback(
    (deltaWeeks: number) => {
      shiftDay(deltaWeeks * 7);
    },
    [shiftDay],
  );

  // Navigation handlers for toolbar
  const handlePrev = useCallback(() => {
    if (view === "month") shiftMonth(-1);
    else if (view === "week") shiftWeek(-1);
    else if (view === "day") shiftDay(-1);
    else if (view === "year") shiftMonth(-12);
    else if (view === "agenda") shiftMonth(-1);
  }, [view, shiftMonth, shiftWeek, shiftDay]);

  const handleNext = useCallback(() => {
    if (view === "month") shiftMonth(1);
    else if (view === "week") shiftWeek(1);
    else if (view === "day") shiftDay(1);
    else if (view === "year") shiftMonth(12);
    else if (view === "agenda") shiftMonth(1);
  }, [view, shiftMonth, shiftWeek, shiftDay]);

  const handleToday = useCallback(() => {
    setSelectedDate(today);
    const todayMonth = today.slice(0, 7);
    if (todayMonth !== month) {
      navigateMonth(todayMonth);
    }
  }, [today, month, navigateMonth]);

  // Computed Title for Toolbar
  const toolbarTitle = useMemo(() => {
    const monthObj = new Date(`${month}-01T12:00:00Z`);
    const monthName = new Intl.DateTimeFormat("en", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(monthObj);

    if (view === "year") {
      return month.slice(0, 4);
    }
    if (view === "day") {
      const dayObj = new Date(`${selectedDate}T12:00:00Z`);
      return new Intl.DateTimeFormat("en", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(dayObj);
    }
    if (view === "week") {
      const weekDates = getWeekDates(selectedDate);
      const first = new Date(`${weekDates[0]}T12:00:00Z`);
      const last = new Date(`${weekDates[6]}T12:00:00Z`);
      const firstStr = new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }).format(first);
      const lastStr = new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(last);
      return `${firstStr} – ${lastStr}`;
    }
    return monthName;
  }, [view, month, selectedDate]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        activeEvent ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key.toLowerCase()) {
        case "d":
          setView("day");
          break;
        case "w":
          setView("week");
          break;
        case "m":
          setView("month");
          break;
        case "y":
          setView("year");
          break;
        case "a":
          setView("agenda");
          break;
        case "t":
          handleToday();
          break;
        case "arrowleft":
          handlePrev();
          break;
        case "arrowright":
          handleNext();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeEvent, handleToday, handlePrev, handleNext]);

  return (
    <section className="space-y-4" aria-label="Financial Calendar" aria-busy={pending}>
      {/* Apple-style Toolbar */}
      <CalendarToolbar
        title={toolbarTitle}
        view={view}
        onViewChange={setView}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        query={query}
        onQueryChange={setQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        pending={pending}
      />

      {/* Primary Views */}
      {view === "month" && (
        <MonthView
          month={month}
          today={today}
          events={datedEvents}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onOpenDayView={(date) => {
            setSelectedDate(date);
            setView("day");
          }}
          onSelectEvent={setActiveEvent}
        />
      )}

      {view === "week" && (
        <WeekView
          dates={getWeekDates(selectedDate)}
          today={today}
          events={datedEvents}
          onOpenDayView={(date) => {
            setSelectedDate(date);
            setView("day");
          }}
          onSelectEvent={setActiveEvent}
        />
      )}

      {view === "day" && (
        <DayView
          date={selectedDate}
          today={today}
          events={datedEvents}
          onSelectEvent={setActiveEvent}
        />
      )}

      {view === "year" && (
        <YearView
          year={Number(month.slice(0, 4))}
          today={today}
          events={datedEvents}
          onOpenMonthView={(m) => {
            navigateMonth(m);
            setView("month");
          }}
          onOpenDayView={(date) => {
            setSelectedDate(date);
            const m = date.slice(0, 7);
            if (m !== month) navigateMonth(m);
            setView("day");
          }}
        />
      )}

      {view === "agenda" && (
        <AgendaView events={datedEvents} today={today} onSelectEvent={setActiveEvent} />
      )}

      {/* Undated Milestones & Payroll Section */}
      <UndatedSection
        events={filteredEvents}
        undatedContracts={undatedContracts}
        year={month.slice(0, 4)}
      />

      {/* Event Details Dialog */}
      <EventDetailsDialog event={activeEvent} onClose={() => setActiveEvent(null)} />
    </section>
  );
}
