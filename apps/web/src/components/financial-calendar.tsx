"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import {
  calendarCells,
  validCalendarMonth,
  type FinancialEvent,
} from "@portfolio/api/calendar-calculations";
import { Button } from "@portfolio/ui/components/button";
import { Badge } from "@portfolio/ui/components/badge";
import { useAmountFormat } from "./amount-preferences";

export function FinancialCalendar({
  month,
  today,
  timeZone,
  events,
  undatedContracts,
}: {
  month: string;
  today: string;
  timeZone: string;
  events: FinancialEvent[];
  undatedContracts: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [view, setView] = useState<"month" | "agenda">("month");
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const { formatCurrency } = useAmountFormat();
  const categories = [...new Set(events.map((e) => e.category))].sort();
  const filtered = events.filter(
    (e) =>
      (category === "All" || e.category === category) &&
      `${e.title} ${e.detail}`.toLowerCase().includes(query.toLowerCase()),
  );
  const dated = filtered.filter((e) => e.precision === "day");
  const monthLabel = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T12:00:00Z`));
  function navigate(next: string) {
    if (validCalendarMonth(next, "") !== next) return;
    startTransition(() => router.push(`/dashboard/calendar?month=${next}` as Route));
  }
  function shift(delta: number) {
    const d = new Date(`${month}-01T12:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() + delta);
    navigate(d.toISOString().slice(0, 7));
  }
  function eventList(rows: FinancialEvent[], empty: string) {
    return rows.length ? (
      <ul className="divide-y">
        {rows.map((e) => (
          <li key={e.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <a href={e.href} className="font-medium underline-offset-4 hover:underline">
                  {e.title}
                </a>
                <Badge variant="outline">{e.planned ? "Planned" : "Recorded"}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {e.date} · {e.category}
              </p>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{e.detail}</p>
            </div>
            {e.amount !== null && e.currency ? (
              <span className="text-sm tabular-nums">{formatCurrency(e.amount, e.currency)}</span>
            ) : null}
          </li>
        ))}
      </ul>
    ) : (
      <p className="py-6 text-sm text-muted-foreground">{empty}</p>
    );
  }
  return (
    <section className="mx-4 space-y-4 lg:mx-6" aria-label="Financial calendar" aria-busy={pending}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            aria-label="Previous month"
            onClick={() => shift(-1)}
            disabled={pending || month === "1900-01"}
          >
            ←
          </Button>
          <label className="sr-only" htmlFor="calendar-month">
            Calendar month
          </label>
          <input
            id="calendar-month"
            type="month"
            min="1900-01"
            max="2299-12"
            value={month}
            onChange={(e) => navigate(e.target.value)}
            disabled={pending}
            className="h-9 min-w-0 rounded-md border bg-background px-2 text-sm"
          />
          <Button
            variant="outline"
            aria-label="Next month"
            onClick={() => shift(1)}
            disabled={pending || month === "2299-12"}
          >
            →
          </Button>
          <Button variant="ghost" onClick={() => navigate(today.slice(0, 7))} disabled={pending}>
            Today
          </Button>
        </div>
        <div className="flex gap-1" aria-label="Calendar display">
          <Button
            variant={view === "month" ? "secondary" : "ghost"}
            aria-pressed={view === "month"}
            onClick={() => setView("month")}
          >
            Month
          </Button>
          <Button
            variant={view === "agenda" ? "secondary" : "ghost"}
            aria-pressed={view === "agenda"}
            onClick={() => setView("agenda")}
          >
            Agenda
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="calendar-search">
          Search events
        </label>
        <input
          id="calendar-search"
          placeholder="Search events…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-9 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm"
        />
        <label className="sr-only" htmlFor="calendar-category">
          Event category
        </label>
        <select
          id="calendar-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-9 max-w-full rounded-md border bg-background px-3 text-sm"
        >
          <option>All</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <p className="text-xs text-muted-foreground" role="status">
        {pending ? "Loading month…" : `${filtered.length} events · ${monthLabel} · ${timeZone}`}.
        Planned events are schedules, not payment confirmations.
      </p>
      {view === "month" ? (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="grid grid-cols-7 border-b">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="py-2 text-center text-xs text-muted-foreground">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarCells(month).map((date) => {
              const rows = dated.filter((e) => e.date === date);
              const inside = date.startsWith(month);
              return (
                <button
                  key={date}
                  type="button"
                  disabled={!inside}
                  onClick={() => setSelected(selected === date ? null : date)}
                  aria-pressed={selected === date}
                  aria-label={`${date}, ${rows.length} events${date === today ? ", today" : ""}`}
                  aria-current={date === today ? "date" : undefined}
                  className={`min-h-20 min-w-0 border-b border-r p-1 text-left focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-ring sm:min-h-32 sm:p-2 ${!inside ? "bg-muted/30 text-muted-foreground/40" : selected === date ? "bg-primary/10" : "hover:bg-muted/40"}`}
                >
                  <span
                    className={`inline-flex size-6 items-center justify-center rounded-full text-xs ${date === today ? "bg-primary text-primary-foreground" : ""}`}
                  >
                    {Number(date.slice(-2))}
                  </span>
                  {rows.slice(0, 2).map((e) => (
                    <span
                      key={e.id}
                      className="mt-1 hidden truncate rounded bg-muted px-1 text-[11px] sm:block"
                    >
                      {e.title}
                    </span>
                  ))}
                  {rows.length > 0 ? (
                    <span className="mt-1 block text-center text-[10px] text-muted-foreground sm:text-left">
                      {rows.length} event{rows.length === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold">
            {view === "agenda"
              ? `Agenda · ${monthLabel}`
              : selected
                ? `Events · ${selected}`
                : "Dated events this month"}
          </h2>
          {selected && view === "month" ? (
            <Button variant="ghost" onClick={() => setSelected(null)}>
              All days
            </Button>
          ) : null}
        </div>
        {eventList(
          view === "month" && selected ? dated.filter((e) => e.date === selected) : dated,
          "No dated events match this view.",
        )}
      </div>
      <div className="rounded-xl border bg-card p-4">
        <h2 className="font-semibold">This month · day unspecified</h2>
        <p className="text-xs text-muted-foreground">
          Payroll periods appear here because a payslip does not establish a bank payment date.
        </p>
        {eventList(
          filtered.filter((e) => e.precision === "month"),
          "No month-only events match this view.",
        )}
      </div>
      <div className="rounded-xl border bg-card p-4">
        <h2 className="font-semibold">
          {month.slice(0, 4)} planning milestones · date unspecified
        </h2>
        <p className="text-xs text-muted-foreground">
          Year-only goals are shown throughout their planning year without inventing a day.
        </p>
        {eventList(
          filtered.filter((e) => e.precision === "year"),
          "No year-only milestones match this view.",
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Calendar uses saved data; no external calendars or statutory deadlines are inferred.{" "}
        {undatedContracts > 0
          ? `${undatedContracts} active contracts have no billing day and cannot be placed on the grid. Add their dates in Household.`
          : "Add or edit event dates in their source pages."}
      </p>
    </section>
  );
}
