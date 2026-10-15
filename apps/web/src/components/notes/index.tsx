"use client";

import { useEffect, useState } from "react";
import { useNotes } from "./use-notes";
import { NotesFoldersSidebar } from "./notes-folders-sidebar";
import { NotesListPane } from "./notes-list-pane";
import { NoteEditorPane } from "./note-editor-pane";
import { NoteGalleryView } from "./note-gallery-view";
import { cn } from "@portfolio/ui/lib/utils";
import type { FinancialNote, NoteFolderId } from "./types";

interface FinancialNotesProps {
  initialNoteId?: string;
}

export function FinancialNotes({ initialNoteId }: FinancialNotesProps) {
  const {
    filteredNotes,
    selectedNote,
    setSelectedNoteId,
    activeFolder,
    setActiveFolder,
    activeTag,
    setActiveTag,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    editorMode,
    setEditorMode,
    isSidebarOpen,
    setIsSidebarOpen,
    folderCounts,
    allTags,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    resetToDefaults,
  } = useNotes(initialNoteId);

  // Mobile navigation state: "folders" | "list" | "note"
  const [mobileScreen, setMobileScreen] = useState<"folders" | "list" | "note">("list");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileScreen("note");
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Keyboard shortcuts (⌘N for new note)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        createNote();
        if (isMobile) setMobileScreen("note");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [createNote, isMobile]);

  const handleSelectFolder = (id: NoteFolderId) => {
    setActiveFolder(id);
    if (isMobile) setMobileScreen("list");
  };

  const handleSelectNote = (note: FinancialNote) => {
    setSelectedNoteId(note.id);
    if (isMobile) setMobileScreen("note");
  };

  const handleCreateNote = () => {
    createNote();
    if (isMobile) setMobileScreen("note");
  };

  return (
    <div className="flex h-[calc(100vh-11rem)] min-h-[640px] w-full overflow-hidden rounded-2xl border border-border/60 bg-background shadow-xs">
      {/* Desktop or Mobile Folders */}
      {(!isMobile || mobileScreen === "folders") && isSidebarOpen && (
        <NotesFoldersSidebar
          activeFolder={activeFolder}
          onSelectFolder={handleSelectFolder}
          folderCounts={folderCounts}
          activeTag={activeTag}
          onSelectTag={(tag) => {
            setActiveTag(tag);
            if (isMobile) setMobileScreen("list");
          }}
          allTags={allTags}
          onToggleSidebar={() => setIsSidebarOpen(false)}
          onResetDefaults={resetToDefaults}
          className={cn(isMobile && "w-full border-r-0")}
        />
      )}

      {/* Middle Pane: Note List (in List View) or Gallery View */}
      {viewMode === "list" ? (
        <>
          {(!isMobile || mobileScreen === "list") && (
            <NotesListPane
              notes={filteredNotes}
              selectedNote={selectedNote}
              activeFolder={activeFolder}
              activeTag={activeTag}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectNote={handleSelectNote}
              onCreateNote={handleCreateNote}
              onTogglePin={togglePin}
              onDeleteNote={deleteNote}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              sortField={sortField}
              onSortFieldChange={setSortField}
              sortDirection={sortDirection}
              onSortDirectionChange={setSortDirection}
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={() => {
                if (isMobile) {
                  setMobileScreen("folders");
                } else {
                  setIsSidebarOpen(true);
                }
              }}
              className={cn(isMobile && "w-full border-r-0")}
            />
          )}

          {/* Right Pane: Note Editor & Reader */}
          {(!isMobile || mobileScreen === "note") && (
            <NoteEditorPane
              note={selectedNote}
              editorMode={editorMode}
              onEditorModeChange={setEditorMode}
              onUpdateNote={updateNote}
              onDeleteNote={deleteNote}
              onTogglePin={togglePin}
              onBackToList={() => setMobileScreen("list")}
              isMobile={isMobile}
              className={cn(isMobile && "w-full")}
            />
          )}
        </>
      ) : (
        /* Gallery View replaces List & Editor panes with a card grid */
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Gallery View Toolbar */}
          <div className="flex h-13 items-center justify-between border-b border-border/50 px-4">
            <div className="flex items-center gap-2">
              {!isSidebarOpen && (
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  aria-label="Open folders sidebar"
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <span className="sr-only">Open folders</span>📁
                </button>
              )}
              <h2 className="text-base font-bold tracking-tight text-foreground">Gallery View</h2>
              <span className="text-xs tabular-nums text-muted-foreground font-mono">
                ({filteredNotes.length} notes)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>Switch to Split List View</span>
              </button>
              <button
                type="button"
                onClick={handleCreateNote}
                className="flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1 text-xs font-medium text-white hover:bg-amber-600 transition-colors shadow-2xs"
              >
                <span>+ New Note</span>
              </button>
            </div>
          </div>

          <NoteGalleryView
            notes={filteredNotes}
            selectedNote={selectedNote}
            onSelectNote={handleSelectNote}
            onTogglePin={togglePin}
            onDeleteNote={deleteNote}
            onCreateNote={handleCreateNote}
            onSwitchToList={() => setViewMode("list")}
            searchQuery={searchQuery}
          />
        </div>
      )}
    </div>
  );
}
