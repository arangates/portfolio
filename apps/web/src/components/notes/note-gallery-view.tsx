"use client";

import { Pin, PinOff, Plus, Trash2 } from "lucide-react";
import type { FinancialNote } from "./types";
import { formatSidebarDate, getNotePreviewSnippet } from "./note-utils";
import { FOLDERS } from "./initial-notes";
import { cn } from "@portfolio/ui/lib/utils";

interface NoteGalleryViewProps {
  notes: FinancialNote[];
  selectedNote: FinancialNote | null;
  onSelectNote: (note: FinancialNote) => void;
  onTogglePin: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onCreateNote: () => void;
  onSwitchToList: () => void;
  searchQuery?: string;
}

export function NoteGalleryView({
  notes,
  selectedNote,
  onSelectNote,
  onTogglePin,
  onDeleteNote,
  onCreateNote,
  onSwitchToList,
  searchQuery,
}: NoteGalleryViewProps) {
  const pinnedNotes = notes.filter((n) => n.isPinned);
  const otherNotes = notes.filter((n) => !n.isPinned);

  const renderCard = (note: FinancialNote) => {
    const isSelected = selectedNote?.id === note.id;
    const folder = FOLDERS.find((f) => f.id === note.category) ?? FOLDERS[7];
    const dateFormatted = formatSidebarDate(note.updatedAt);
    const snippet = getNotePreviewSnippet(note.content, 140);

    return (
      <div
        key={note.id}
        onClick={() => {
          onSelectNote(note);
          onSwitchToList();
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelectNote(note);
            onSwitchToList();
          }
        }}
        className={cn(
          "group relative flex flex-col justify-between rounded-2xl border p-4.5 text-left transition-all duration-200 cursor-pointer select-none min-h-[190px]",
          isSelected
            ? "border-amber-500/60 bg-amber-500/10 shadow-sm ring-1 ring-amber-500/30"
            : "border-border/60 bg-card hover:border-amber-500/40 hover:shadow-md hover:bg-card/90",
        )}
      >
        <div className="space-y-2">
          {/* Header line: Category pill & pin / date */}
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                "bg-muted text-muted-foreground",
              )}
            >
              {folder.name}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {note.isPinned && <Pin className="size-3.5 text-amber-500 fill-amber-500" />}
              <span className="text-[11px] tabular-nums font-mono text-muted-foreground/80">
                {dateFormatted}
              </span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-base font-bold tracking-tight text-foreground line-clamp-2">
            {note.title || "Untitled Note"}
          </h3>

          {/* Preview snippet */}
          <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3">{snippet}</p>
        </div>

        {/* Footer: Tags and Hover Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border/40 mt-3">
          <div className="flex flex-wrap gap-1 overflow-hidden">
            {note.tags.slice(0, 2).map((t) => (
              <span key={t} className="text-[10px] text-muted-foreground/70">
                #{t}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(note.id);
              }}
              aria-label={note.isPinned ? "Unpin note" : "Pin note"}
              className="rounded p-1 text-muted-foreground hover:text-amber-500 transition-colors"
            >
              {note.isPinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteNote(note.id);
              }}
              aria-label="Delete note"
              className="rounded p-1 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background">
      <div className="mx-auto max-w-7xl space-y-8">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-base font-semibold text-foreground">No notes found</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {searchQuery
                ? `No notes matched your search query "${searchQuery}"`
                : "Create your first financial note to get started."}
            </p>
            <button
              type="button"
              onClick={onCreateNote}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-medium text-white hover:bg-amber-600 transition-colors"
            >
              <Plus className="size-4" />
              <span>New Note</span>
            </button>
          </div>
        ) : (
          <>
            {/* Pinned Notes Grid */}
            {pinnedNotes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Pin className="size-3.5 text-amber-500 fill-amber-500" />
                  <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Pinned Notes ({pinnedNotes.length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {pinnedNotes.map(renderCard)}
                </div>
              </div>
            )}

            {/* Other Notes Grid */}
            {otherNotes.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  {pinnedNotes.length > 0
                    ? `Other Notes (${otherNotes.length})`
                    : `All Notes (${otherNotes.length})`}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {otherNotes.map(renderCard)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
