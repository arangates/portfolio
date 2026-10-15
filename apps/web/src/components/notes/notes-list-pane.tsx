"use client";

import {
  ArrowDownAZ,
  ArrowUpDown,
  Calendar,
  Clock,
  LayoutGrid,
  List,
  PanelLeftOpen,
  Plus,
  Search,
  SquarePen,
  X,
} from "lucide-react";
import type {
  FinancialNote,
  NoteFolderId,
  NotesSortDirection,
  NotesSortField,
  NotesViewMode,
} from "./types";
import { NoteCardItem } from "./note-card-item";
import { groupNotesByDate } from "./note-utils";
import { FOLDERS } from "./initial-notes";
import { cn } from "@portfolio/ui/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@portfolio/ui/components/dropdown-menu";

interface NotesListPaneProps {
  notes: FinancialNote[];
  selectedNote: FinancialNote | null;
  activeFolder: NoteFolderId;
  activeTag: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectNote: (note: FinancialNote) => void;
  onCreateNote: () => void;
  onTogglePin: (id: string) => void;
  onDeleteNote: (id: string) => void;
  viewMode: NotesViewMode;
  onViewModeChange: (mode: NotesViewMode) => void;
  sortField: NotesSortField;
  onSortFieldChange: (field: NotesSortField) => void;
  sortDirection: NotesSortDirection;
  onSortDirectionChange: (dir: NotesSortDirection) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  className?: string;
}

export function NotesListPane({
  notes,
  selectedNote,
  activeFolder,
  activeTag,
  searchQuery,
  onSearchChange,
  onSelectNote,
  onCreateNote,
  onTogglePin,
  onDeleteNote,
  viewMode,
  onViewModeChange,
  sortField,
  onSortFieldChange,
  sortDirection,
  onSortDirectionChange,
  isSidebarOpen,
  onToggleSidebar,
  className,
}: NotesListPaneProps) {
  const folderInfo = FOLDERS.find((f) => f.id === activeFolder);
  const title = activeTag ? `#${activeTag}` : folderInfo ? folderInfo.name : "Notes";
  const noteGroups = groupNotesByDate(notes);

  return (
    <div
      className={cn(
        "flex h-full w-full md:w-80 lg:w-88 shrink-0 flex-col border-r border-border/60 bg-card/60 select-none",
        className,
      )}
    >
      {/* List Header Toolbar */}
      <div className="flex h-13 items-center justify-between border-b border-border/50 px-3.5">
        <div className="flex items-center gap-2 min-w-0">
          {!isSidebarOpen && (
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Open folders sidebar"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <PanelLeftOpen className="size-4" />
            </button>
          )}
          <div className="flex items-baseline gap-2 min-w-0">
            <h2 className="truncate text-base font-bold tracking-tight text-foreground">{title}</h2>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground font-mono">
              {notes.length}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-border/60 p-0.5 bg-muted/40">
            <button
              type="button"
              onClick={() => onViewModeChange("list")}
              title="List View"
              aria-label="List view"
              className={cn(
                "rounded-md p-1 transition-colors",
                viewMode === "list"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <List className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("gallery")}
              title="Gallery View"
              aria-label="Gallery view"
              className={cn(
                "rounded-md p-1 transition-colors",
                viewMode === "gallery"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutGrid className="size-3.5" />
            </button>
          </div>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  title="Sort notes"
                  aria-label="Sort notes"
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <ArrowUpDown className="size-3.5" />
                </button>
              }
            />
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs font-semibold">Sort By</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  onSortFieldChange("updatedAt");
                  onSortDirectionChange(
                    sortField === "updatedAt" && sortDirection === "desc" ? "asc" : "desc",
                  );
                }}
                className={cn(sortField === "updatedAt" && "font-semibold text-amber-500")}
              >
                <Clock className="size-3.5 mr-2" />
                <span>
                  Date Modified{" "}
                  {sortField === "updatedAt"
                    ? sortDirection === "desc"
                      ? "(Newest)"
                      : "(Oldest)"
                    : ""}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  onSortFieldChange("createdAt");
                  onSortDirectionChange(
                    sortField === "createdAt" && sortDirection === "desc" ? "asc" : "desc",
                  );
                }}
                className={cn(sortField === "createdAt" && "font-semibold text-amber-500")}
              >
                <Calendar className="size-3.5 mr-2" />
                <span>
                  Date Created{" "}
                  {sortField === "createdAt"
                    ? sortDirection === "desc"
                      ? "(Newest)"
                      : "(Oldest)"
                    : ""}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  onSortFieldChange("title");
                  onSortDirectionChange(
                    sortField === "title" && sortDirection === "asc" ? "desc" : "asc",
                  );
                }}
                className={cn(sortField === "title" && "font-semibold text-amber-500")}
              >
                <ArrowDownAZ className="size-3.5 mr-2" />
                <span>
                  Title {sortField === "title" ? (sortDirection === "asc" ? "(A-Z)" : "(Z-A)") : ""}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* New Note Button */}
          <button
            type="button"
            onClick={onCreateNote}
            title="Create new note"
            aria-label="Create new note"
            className="flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-600 transition-colors shadow-2xs active:scale-[0.98]"
          >
            <SquarePen className="size-3.5" />
            <span className="hidden sm:inline">New</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="border-b border-border/50 p-2.5">
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-2.5 size-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search all notes..."
            className="w-full rounded-lg border border-border/60 bg-muted/30 py-1.5 pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:bg-background focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
              className="absolute right-2 rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      {/* Grouped Notes Scroll Area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <p className="text-sm font-medium text-muted-foreground">No notes found</p>
            <p className="text-xs text-muted-foreground/70 mt-1 max-w-[200px]">
              {searchQuery
                ? `No results matching "${searchQuery}"`
                : "Create a new note to start drafting financial thoughts."}
            </p>
            {!searchQuery && (
              <button
                type="button"
                onClick={onCreateNote}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600 transition-colors"
              >
                <Plus className="size-3.5" />
                <span>New Note</span>
              </button>
            )}
          </div>
        ) : (
          noteGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="px-2 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
                {group.title}
              </div>
              <div className="space-y-1">
                {group.notes.map((note) => (
                  <NoteCardItem
                    key={note.id}
                    note={note}
                    isSelected={selectedNote?.id === note.id}
                    searchQuery={searchQuery}
                    onSelect={onSelectNote}
                    onTogglePin={onTogglePin}
                    onDelete={onDeleteNote}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
