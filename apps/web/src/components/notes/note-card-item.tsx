"use client";

import { Pin, PinOff, Trash2 } from "lucide-react";
import type { FinancialNote } from "./types";
import { formatSidebarDate, getNotePreviewSnippet } from "./note-utils";
import { cn } from "@portfolio/ui/lib/utils";

interface NoteCardItemProps {
  note: FinancialNote;
  isSelected: boolean;
  searchQuery?: string;
  onSelect: (note: FinancialNote) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NoteCardItem({
  note,
  isSelected,
  searchQuery,
  onSelect,
  onTogglePin,
  onDelete,
}: NoteCardItemProps) {
  const dateFormatted = formatSidebarDate(note.updatedAt);
  const snippet = getNotePreviewSnippet(note.content, 90);

  // Search highlighting helper
  const renderHighlightedText = (text: string, query?: string) => {
    if (!query || !query.trim()) return text;
    const q = query.trim().toLowerCase();
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return text;

    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-amber-500/25 text-foreground rounded-xs px-0.5 font-semibold">
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  return (
    <div
      onClick={() => onSelect(note)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(note);
        }
      }}
      className={cn(
        "group relative flex flex-col gap-1.5 rounded-xl p-3 text-left transition-all duration-150 cursor-pointer select-none",
        isSelected
          ? "bg-amber-500/12 text-foreground ring-1 ring-amber-500/30 shadow-xs"
          : "hover:bg-muted/50 text-foreground/90 border border-transparent hover:border-border/40",
      )}
    >
      {/* Top line: Title & Pin/Date */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold tracking-tight leading-tight line-clamp-1 min-w-0">
          {renderHighlightedText(note.title || "Untitled Note", searchQuery)}
        </h4>
        <div className="flex items-center gap-1.5 shrink-0">
          {note.isPinned && <Pin className="size-3 text-amber-500 fill-amber-500" />}
          <span className="text-[11px] tabular-nums font-mono text-muted-foreground/80">
            {dateFormatted}
          </span>
        </div>
      </div>

      {/* Snippet preview */}
      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
        {renderHighlightedText(snippet, searchQuery)}
      </p>

      {/* Tags and Folder badge */}
      <div className="flex items-center justify-between gap-1 pt-0.5">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
            {note.category.replace("-", " ")}
          </span>
          {note.tags.slice(0, 2).map((t) => (
            <span
              key={t}
              className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground"
            >
              #{t}
            </span>
          ))}
        </div>

        {/* Quick action buttons (show on group hover or active) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(note.id);
            }}
            aria-label={note.isPinned ? "Unpin note" : "Pin note"}
            className="rounded p-1 text-muted-foreground hover:bg-background hover:text-amber-500 transition-colors"
          >
            {note.isPinned ? <PinOff className="size-3" /> : <Pin className="size-3" />}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
            aria-label="Delete note"
            className="rounded p-1 text-muted-foreground hover:bg-background hover:text-destructive transition-colors"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
