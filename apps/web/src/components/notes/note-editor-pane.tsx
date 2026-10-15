"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bold,
  CheckSquare,
  ChevronLeft,
  Copy,
  Download,
  Eye,
  Heading2,
  Italic,
  List as ListIcon,
  Pin,
  PinOff,
  Quote,
  Split,
  Table as TableIcon,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import type { FinancialNote, NotesEditorMode } from "./types";
import { FOLDERS } from "./initial-notes";
import { formatHeaderDate, getReadingStats, toggleMarkdownCheckbox } from "./note-utils";
import { cn } from "@portfolio/ui/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@portfolio/ui/components/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@portfolio/ui/components/alert-dialog";

interface NoteEditorPaneProps {
  note: FinancialNote | null;
  editorMode: NotesEditorMode;
  onEditorModeChange: (mode: NotesEditorMode) => void;
  onUpdateNote: (id: string, updates: Partial<FinancialNote>) => void;
  onDeleteNote: (id: string) => void;
  onTogglePin: (id: string) => void;
  onBackToList?: () => void;
  isMobile?: boolean;
  className?: string;
}

export function NoteEditorPane({
  note,
  editorMode,
  onEditorModeChange,
  onUpdateNote,
  onDeleteNote,
  onTogglePin,
  onBackToList,
  isMobile,
  className,
}: NoteEditorPaneProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);

  // Stats
  const stats = useMemo(
    () => (note ? getReadingStats(note.content) : { words: 0, characters: 0, minutes: 1 }),
    [note?.content],
  );

  // Formatting helper in textarea
  const insertFormatting = useCallback(
    (prefix: string, suffix = "", defaultText = "") => {
      const textarea = textareaRef.current;
      if (!textarea || !note) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = textarea.value.substring(start, end) || defaultText;
      const replacement = `${prefix}${selected}${suffix}`;

      const newContent =
        textarea.value.substring(0, start) + replacement + textarea.value.substring(end);

      onUpdateNote(note.id, { content: newContent });

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
      }, 0);
    },
    [note, onUpdateNote],
  );

  // Handle Tab key in textarea
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const textarea = e.currentTarget;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        if (e.shiftKey) {
          // Outdent
          const value = textarea.value;
          const lineStart = value.lastIndexOf("\n", start - 1) + 1;
          if (value.startsWith("  ", lineStart)) {
            const newValue = value.slice(0, lineStart) + value.slice(lineStart + 2);
            if (note) onUpdateNote(note.id, { content: newValue });
            setTimeout(() => {
              textarea.setSelectionRange(
                Math.max(lineStart, start - 2),
                Math.max(lineStart, end - 2),
              );
            }, 0);
          }
        } else {
          // Indent 2 spaces
          const value = textarea.value;
          const newValue = value.substring(0, start) + "  " + value.substring(end);
          if (note) onUpdateNote(note.id, { content: newValue });
          setTimeout(() => {
            textarea.setSelectionRange(start + 2, start + 2);
          }, 0);
        }
      }
    },
    [note, onUpdateNote],
  );

  // Copy note as markdown
  const handleCopy = useCallback(() => {
    if (!note) return;
    const fullText = `# ${note.title}\n\n${note.content}`;
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [note]);

  // Download note as .md
  const handleDownload = useCallback(() => {
    if (!note) return;
    const fullText = `# ${note.title}\n\n${note.content}`;
    const blob = new Blob([fullText], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.slug || "note"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [note]);

  // Add tag
  const handleAddTag = useCallback(() => {
    if (!note || !newTagInput.trim()) return;
    const cleanTag = newTagInput.trim().toLowerCase().replace(/^#/, "");
    if (!note.tags.includes(cleanTag)) {
      onUpdateNote(note.id, { tags: [...note.tags, cleanTag] });
    }
    setNewTagInput("");
    setIsAddingTag(false);
  }, [note, newTagInput, onUpdateNote]);

  // Remove tag
  const handleRemoveTag = useCallback(
    (tagToRemove: string) => {
      if (!note) return;
      onUpdateNote(note.id, {
        tags: note.tags.filter((t) => t !== tagToRemove),
      });
    },
    [note, onUpdateNote],
  );

  // Interactive Task List item click in preview
  const handleCheckboxClick = useCallback(
    (taskText: string, isChecked: boolean) => {
      if (!note) return;
      const newContent = toggleMarkdownCheckbox(note.content, taskText, isChecked);
      onUpdateNote(note.id, { content: newContent });
    },
    [note, onUpdateNote],
  );

  // Custom Markdown components
  const markdownComponents = useMemo<Components>(() => {
    return {
      li: ({ children, className, ...props }) => {
        if (!className?.includes("task-list-item")) {
          return (
            <li className="my-1 leading-relaxed" {...props}>
              {children}
            </li>
          );
        }

        const childNodes = React.Children.toArray(children);
        const checkbox = childNodes.find(
          (child): child is React.ReactElement<{ checked?: boolean }> =>
            React.isValidElement(child) && typeof child.type === "string" && child.type === "input",
        );

        if (!checkbox)
          return (
            <li className={className} {...props}>
              {children}
            </li>
          );

        const isChecked = Boolean(checkbox.props.checked);
        const taskContent = childNodes.filter((child) => child !== checkbox);
        // Extract raw string text of task
        const extractText = (nodes: React.ReactNode[]): string => {
          return nodes
            .map((n) => {
              if (typeof n === "string" || typeof n === "number") return String(n);
              if (React.isValidElement(n) && (n.props as { children?: React.ReactNode }).children) {
                return extractText(
                  React.Children.toArray((n.props as { children?: React.ReactNode }).children),
                );
              }
              return "";
            })
            .join("")
            .trim();
        };

        const taskText = extractText(taskContent);

        return (
          <li className="flex items-start gap-2.5 my-1.5 list-none select-none" {...props}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCheckboxClick(taskText, !isChecked);
              }}
              className={cn(
                "mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded border transition-colors",
                isChecked
                  ? "border-amber-500 bg-amber-500 text-white"
                  : "border-muted-foreground/40 bg-background hover:border-amber-500",
              )}
              aria-label={isChecked ? `Uncheck ${taskText}` : `Check ${taskText}`}
            >
              {isChecked && (
                <svg
                  className="size-3"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3.5 8.5L6.5 11.5L12.5 4.5" />
                </svg>
              )}
            </button>
            <span
              className={cn(
                "min-w-0 flex-1 text-sm leading-relaxed",
                isChecked && "line-through text-muted-foreground/60",
              )}
            >
              {taskContent}
            </span>
          </li>
        );
      },
      table: ({ children, ...props }) => (
        <div className="my-4 overflow-x-auto rounded-lg border border-border/70">
          <table className="w-full text-left text-xs" {...props}>
            {children}
          </table>
        </div>
      ),
      thead: ({ children, ...props }) => (
        <thead className="bg-muted/50 border-b border-border/60" {...props}>
          {children}
        </thead>
      ),
      th: ({ children, ...props }) => (
        <th className="px-3 py-2 font-semibold text-foreground tracking-tight" {...props}>
          {children}
        </th>
      ),
      td: ({ children, ...props }) => (
        <td className="px-3 py-2 border-b border-border/30 text-muted-foreground" {...props}>
          {children}
        </td>
      ),
      blockquote: ({ children, ...props }) => (
        <blockquote
          className="my-3 border-l-3 border-amber-500 bg-amber-500/5 px-4 py-2 italic text-muted-foreground rounded-r-md text-sm"
          {...props}
        >
          {children}
        </blockquote>
      ),
      h2: ({ children, ...props }) => (
        <h2
          className="mt-6 mb-2 pb-1 text-lg font-bold tracking-tight text-foreground border-b border-border/40"
          {...props}
        >
          {children}
        </h2>
      ),
      h3: ({ children, ...props }) => (
        <h3
          className="mt-4 mb-1.5 text-base font-semibold tracking-tight text-foreground"
          {...props}
        >
          {children}
        </h3>
      ),
      hr: ({ ...props }) => <hr className="my-5 border-border/50" {...props} />,
      a: ({ href, children, ...props }) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-500 underline underline-offset-2 hover:text-amber-600 transition-colors"
          {...props}
        >
          {children}
        </a>
      ),
    };
  }, [handleCheckboxClick]);

  if (!note) {
    return (
      <div
        className={cn(
          "flex h-full flex-1 flex-col items-center justify-center p-8 text-center bg-background select-none",
          className,
        )}
      >
        <div className="rounded-full bg-muted/60 p-4 mb-3 text-muted-foreground">
          <CheckSquare className="size-8 text-amber-500/70" />
        </div>
        <h3 className="text-base font-semibold text-foreground">No note selected</h3>
        <p className="mt-1 text-xs text-muted-foreground max-w-xs">
          Select a note from the list on the left, or create a new note to capture financial
          analysis.
        </p>
      </div>
    );
  }

  const currentFolder = FOLDERS.find((f) => f.id === note.category) ?? FOLDERS[7];

  return (
    <div className={cn("flex h-full flex-1 flex-col bg-background overflow-hidden", className)}>
      {/* Editor Top Toolbar */}
      <div className="flex h-13 items-center justify-between border-b border-border/50 px-4 gap-2">
        {/* Left: Mobile back button & Folder Badge */}
        <div className="flex items-center gap-2 min-w-0">
          {isMobile && onBackToList && (
            <button
              type="button"
              onClick={onBackToList}
              className="inline-flex items-center gap-1 rounded-md p-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
              <span>Notes</span>
            </button>
          )}

          {/* Folder Category Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-md bg-muted/50 hover:bg-muted px-2 py-1 text-xs font-medium text-foreground transition-colors"
                >
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      currentFolder.colorClass.replace("text-", "bg-"),
                    )}
                  />
                  <span className="truncate max-w-[130px]">{currentFolder.name}</span>
                </button>
              }
            />
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuLabel className="text-xs font-semibold">
                Move to Folder
              </DropdownMenuLabel>
              {FOLDERS.filter((f) => f.id !== "all" && f.id !== "pinned").map((folder) => (
                <DropdownMenuItem
                  key={folder.id}
                  onClick={() => onUpdateNote(note.id, { category: folder.id })}
                  className={cn(note.category === folder.id && "font-semibold text-amber-500")}
                >
                  <span
                    className={cn(
                      "size-2 rounded-full mr-2",
                      folder.colorClass.replace("text-", "bg-"),
                    )}
                  />
                  <span>{folder.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Timestamp */}
          <span className="hidden sm:inline-block text-xs text-muted-foreground/80 font-mono tabular-nums">
            {formatHeaderDate(note.updatedAt)}
          </span>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Mode Switcher: Preview / Edit / Split */}
          <div className="flex items-center rounded-lg border border-border/60 p-0.5 bg-muted/40">
            <button
              type="button"
              onClick={() => onEditorModeChange("preview")}
              title="Markdown Preview"
              aria-label="Preview mode"
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors",
                editorMode === "preview"
                  ? "bg-background text-foreground shadow-2xs font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Eye className="size-3.5" />
              <span className="hidden md:inline">Preview</span>
            </button>
            <button
              type="button"
              onClick={() => onEditorModeChange("edit")}
              title="Markdown Edit"
              aria-label="Edit mode"
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors",
                editorMode === "edit"
                  ? "bg-background text-foreground shadow-2xs font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <CheckSquare className="size-3.5" />
              <span className="hidden md:inline">Edit</span>
            </button>
            <button
              type="button"
              onClick={() => onEditorModeChange("split")}
              title="Split View"
              aria-label="Split view mode"
              className={cn(
                "hidden lg:flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors",
                editorMode === "split"
                  ? "bg-background text-foreground shadow-2xs font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Split className="size-3.5" />
              <span>Split</span>
            </button>
          </div>

          {/* Pin Toggle */}
          <button
            type="button"
            onClick={() => onTogglePin(note.id)}
            title={note.isPinned ? "Unpin note" : "Pin note"}
            aria-label={note.isPinned ? "Unpin note" : "Pin note"}
            className={cn(
              "rounded-lg p-1.5 transition-colors",
              note.isPinned
                ? "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {note.isPinned ? (
              <Pin className="size-4 fill-amber-500" />
            ) : (
              <PinOff className="size-4" />
            )}
          </button>

          {/* Copy Markdown */}
          <button
            type="button"
            onClick={handleCopy}
            title={copied ? "Copied!" : "Copy note"}
            aria-label="Copy note"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Copy className={cn("size-4", copied && "text-amber-500")} />
          </button>

          {/* Download Markdown */}
          <button
            type="button"
            onClick={handleDownload}
            title="Download .md"
            aria-label="Download markdown"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Download className="size-4" />
          </button>

          {/* Delete Dialog */}
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <button
                  type="button"
                  title="Delete note"
                  aria-label="Delete note"
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
                >
                  <Trash2 className="size-4" />
                </button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this financial note?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &ldquo;{note.title}&rdquo;? This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDeleteNote(note.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Formatting Toolbar (Visible in Edit and Split mode) */}
      {(editorMode === "edit" || editorMode === "split") && (
        <div className="flex items-center gap-1 border-b border-border/40 bg-muted/20 px-4 py-1 overflow-x-auto select-none">
          <button
            type="button"
            onClick={() => insertFormatting("## ", "", "Heading 2")}
            title="Heading 2"
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Heading2 className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting("**", "**", "bold text")}
            title="Bold"
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Bold className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting("*", "*", "italic text")}
            title="Italic"
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Italic className="size-3.5" />
          </button>
          <div className="h-4 w-px bg-border/60 mx-1" />
          <button
            type="button"
            onClick={() => insertFormatting("- [ ] ", "", "Action item")}
            title="Checklist Item"
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <CheckSquare className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting("- ", "", "List item")}
            title="Bullet List"
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ListIcon className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting("> ", "", "Quote or note")}
            title="Blockquote"
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Quote className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() =>
              insertFormatting("| Header 1 | Header 2 |\n|:---|:---|\n| Item 1 | Value 1 |\n")
            }
            title="Table"
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <TableIcon className="size-3.5" />
          </button>
        </div>
      )}

      {/* Note Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl space-y-4">
          {/* Note Title Input */}
          <div>
            {editorMode === "preview" ? (
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {note.title || "Untitled Note"}
              </h1>
            ) : (
              <input
                type="text"
                value={note.title}
                onChange={(e) => onUpdateNote(note.id, { title: e.target.value })}
                placeholder="Title"
                className="w-full text-2xl sm:text-3xl font-bold tracking-tight text-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/40 focus:ring-0"
              />
            )}
          </div>

          {/* Tags Bar */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="group inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                <Tag className="size-2.5 text-muted-foreground/70" />
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="rounded hover:text-destructive opacity-60 hover:opacity-100 transition-opacity ml-0.5"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="size-2.5" />
                </button>
              </span>
            ))}
            {isAddingTag ? (
              <div className="inline-flex items-center gap-1">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    } else if (e.key === "Escape") {
                      setIsAddingTag(false);
                      setNewTagInput("");
                    }
                  }}
                  autoFocus
                  placeholder="tag name..."
                  className="rounded border border-border/70 bg-background px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 w-24"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="rounded bg-amber-500 px-1.5 py-0.5 text-xs text-white"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingTag(true)}
                className="inline-flex items-center gap-1 rounded-md border border-dashed border-border/80 px-2 py-0.5 text-xs text-muted-foreground hover:border-amber-500 hover:text-amber-500 transition-colors"
              >
                <span>+ Add Tag</span>
              </button>
            )}
          </div>

          <div className="h-px bg-border/40 my-3" />

          {/* Editor Body Renderers */}
          {editorMode === "preview" && (
            <div className="prose prose-neutral dark:prose-invert max-w-none text-sm leading-relaxed text-foreground">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {note.content || "*Start writing your thoughts...*"}
              </ReactMarkdown>
            </div>
          )}

          {editorMode === "edit" && (
            <textarea
              ref={textareaRef}
              value={note.content}
              onChange={(e) => onUpdateNote(note.id, { content: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="Start typing your financial memo or checklist (Markdown supported)..."
              rows={22}
              className="w-full resize-none bg-transparent font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/40 outline-none border-none focus:ring-0"
            />
          )}

          {editorMode === "split" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px]">
              <div className="border-r border-border/40 pr-4">
                <textarea
                  ref={textareaRef}
                  value={note.content}
                  onChange={(e) => onUpdateNote(note.id, { content: e.target.value })}
                  onKeyDown={handleKeyDown}
                  placeholder="Start typing markdown..."
                  rows={22}
                  className="w-full resize-none bg-transparent font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/40 outline-none border-none focus:ring-0"
                />
              </div>
              <div className="prose prose-neutral dark:prose-invert max-w-none text-sm leading-relaxed text-foreground overflow-y-auto">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {note.content || "*Preview will appear here...*"}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor Status Footer */}
      <div className="flex h-8 items-center justify-between border-t border-border/40 bg-muted/10 px-4 text-[11px] text-muted-foreground select-none">
        <div className="flex items-center gap-3">
          <span>{stats.words} words</span>
          <span>•</span>
          <span>{stats.characters} characters</span>
          <span>•</span>
          <span>~{stats.minutes} min read</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <span>Saved locally</span>
        </div>
      </div>
    </div>
  );
}
