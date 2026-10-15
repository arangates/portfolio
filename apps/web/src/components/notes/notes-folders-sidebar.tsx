"use client";

import {
  FileText,
  Flame,
  Folder,
  Home,
  PanelLeftClose,
  Pin,
  Receipt,
  RotateCcw,
  Tag,
  TrendingUp,
  Users,
} from "lucide-react";
import { FOLDERS } from "./initial-notes";
import type { NoteFolderId } from "./types";
import { cn } from "@portfolio/ui/lib/utils";

interface NotesFoldersSidebarProps {
  activeFolder: NoteFolderId;
  onSelectFolder: (id: NoteFolderId) => void;
  folderCounts: Record<string, number>;
  activeTag: string | null;
  onSelectTag: (tag: string | null) => void;
  allTags: string[];
  onToggleSidebar: () => void;
  onResetDefaults: () => void;
  className?: string;
}

const ICON_MAP = {
  Folder,
  Pin,
  TrendingUp,
  Receipt,
  Flame,
  Home,
  Users,
  FileText,
};

export function NotesFoldersSidebar({
  activeFolder,
  onSelectFolder,
  folderCounts,
  activeTag,
  onSelectTag,
  allTags,
  onToggleSidebar,
  onResetDefaults,
  className,
}: NotesFoldersSidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-full w-64 shrink-0 flex-col border-r border-border/60 bg-muted/20 select-none",
        className,
      )}
    >
      {/* Sidebar Header */}
      <div className="flex h-13 items-center justify-between border-b border-border/50 px-4">
        <div className="flex items-center gap-2">
          <Folder className="size-4.5 text-amber-500" strokeWidth={2.2} />
          <span className="text-sm font-semibold tracking-tight text-foreground">Folders</span>
        </div>
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Collapse folders sidebar"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <PanelLeftClose className="size-4" />
        </button>
      </div>

      {/* Folders List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        <div className="px-2 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
          Categories
        </div>
        {FOLDERS.map((folder) => {
          const Icon = ICON_MAP[folder.iconName];
          const count = folderCounts[folder.id] ?? 0;
          const isActive = activeFolder === folder.id && !activeTag;

          return (
            <button
              key={folder.id}
              type="button"
              onClick={() => {
                onSelectTag(null);
                onSelectFolder(folder.id);
              }}
              className={cn(
                "group flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition-all duration-150 text-left",
                isActive
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium shadow-xs"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={cn(
                    "size-4 shrink-0 transition-colors",
                    isActive ? "text-amber-500" : folder.colorClass,
                  )}
                  strokeWidth={2}
                />
                <span className="truncate">{folder.name}</span>
              </div>
              <span
                className={cn(
                  "ml-2 shrink-0 text-xs tabular-nums font-mono",
                  isActive
                    ? "text-amber-600 dark:text-amber-400 font-semibold"
                    : "text-muted-foreground/60 group-hover:text-muted-foreground",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}

        {/* Tags Section */}
        {allTags.length > 0 && (
          <div className="pt-5">
            <div className="flex items-center justify-between px-2 pb-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
              <span>Tags</span>
              {activeTag && (
                <button
                  type="button"
                  onClick={() => onSelectTag(null)}
                  className="text-[10px] text-amber-500 hover:underline normal-case tracking-normal"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1 px-1.5">
              {allTags.map((tag) => {
                const isSelected = activeTag?.toLowerCase() === tag.toLowerCase();
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onSelectTag(isSelected ? null : tag)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs transition-colors",
                      isSelected
                        ? "bg-amber-500 text-white font-medium shadow-xs"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Tag className="size-2.5" />
                    <span>#{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="border-t border-border/50 p-2.5">
        <button
          type="button"
          onClick={onResetDefaults}
          className="flex w-full items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Restore starter financial notes"
        >
          <RotateCcw className="size-3.5" />
          <span>Reset Sample Notes</span>
        </button>
      </div>
    </aside>
  );
}
