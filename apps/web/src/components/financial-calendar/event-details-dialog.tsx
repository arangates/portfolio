"use client";

import { useEffect } from "react";
import type { FinancialEvent } from "@portfolio/api/calendar-calculations";
import { getCategoryConfig } from "./category-config";
import { useAmountFormat } from "@/components/amount-preferences";
import { Badge } from "@portfolio/ui/components/badge";
import { ArrowUpRight, CalendarIcon, X } from "lucide-react";
import Link from "next/link";

interface EventDetailsDialogProps {
  event: FinancialEvent | null;
  onClose: () => void;
}

export function EventDetailsDialog({ event, onClose }: EventDetailsDialogProps) {
  const { formatCurrency } = useAmountFormat();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (event) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [event, onClose]);

  if (!event) return null;

  const config = getCategoryConfig(event.category);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl text-foreground animate-in zoom-in-95 duration-150 select-none relative"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Category Header */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: config.color }}
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {config.label}
          </span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-auto mr-7">
            {event.planned ? "Planned" : "Recorded"}
          </Badge>
        </div>

        {/* Title */}
        <h2 className="text-lg font-bold tracking-tight text-foreground leading-snug">
          {event.title}
        </h2>

        {/* Date Row */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
          <CalendarIcon className="h-3.5 w-3.5" />
          <span>{event.date}</span>
          <span className="opacity-50">·</span>
          <span className="capitalize">{event.precision}-level schedule</span>
        </div>

        {/* Amount Card (if amount exists) */}
        {event.amount !== null && event.currency && (
          <div className="mt-4 p-3.5 rounded-xl border border-border/80 bg-muted/40 flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Scheduled Amount</span>
            <span className="text-base font-bold tabular-nums text-foreground">
              {formatCurrency(event.amount, event.currency)}
            </span>
          </div>
        )}

        {/* Description / Detail */}
        {event.detail && (
          <div className="mt-4 text-xs text-muted-foreground leading-relaxed bg-muted/20 p-3 rounded-xl border border-border/40">
            {event.detail}
          </div>
        )}

        {/* Source Page Action */}
        <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-border/50">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Close
          </button>
          {event.href && (
            <Link
              href={event.href as any}
              className="px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-1.5 shadow-sm"
              onClick={onClose}
            >
              <span>View Source</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
