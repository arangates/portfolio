"use client";

import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { cn } from "@portfolio/ui/lib/utils";
import type { CalendarViewMode } from "./types";
import { FINANCIAL_CATEGORY_CONFIG } from "./category-config";

interface CalendarToolbarProps {
  title: string;
  view: CalendarViewMode;
  onViewChange: (view: CalendarViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  query: string;
  onQueryChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  categories: string[];
  pending?: boolean;
}

const VIEW_OPTIONS: { value: CalendarViewMode; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "agenda", label: "Agenda" },
];

export function CalendarToolbar({
  title,
  view,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  query,
  onQueryChange,
  selectedCategory,
  onCategoryChange,
  categories,
  pending = false,
}: CalendarToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4 p-4 rounded-2xl border border-border/80 bg-card/90 shadow-sm backdrop-blur-sm select-none">
      {/* Top row: Title, Navigation, View Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Navigation & Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPrev}
              disabled={pending}
              className="h-8 w-8 rounded-lg border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all disabled:opacity-50"
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onToday}
              disabled={pending}
              className="h-8 px-3 rounded-lg border border-border bg-background text-xs font-semibold text-foreground hover:bg-muted active:scale-95 transition-all disabled:opacity-50 shadow-2xs"
            >
              Today
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={pending}
              className="h-8 w-8 rounded-lg border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all disabled:opacity-50"
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground ml-1">
            {title}
          </h1>

          {pending && (
            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin ml-2" />
          )}
        </div>

        {/* View Switcher Segmented Control */}
        <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60">
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onViewChange(option.value)}
              className={cn(
                "px-2.5 sm:px-3 py-1 text-xs font-medium rounded-lg transition-all duration-150",
                view === option.value
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom row: Search filter & Category filter */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search financial events, bills, deposits..."
            className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5">
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {FINANCIAL_CATEGORY_CONFIG[c]?.label ?? c}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
