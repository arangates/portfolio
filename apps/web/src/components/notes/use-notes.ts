"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { INITIAL_NOTES } from "./initial-notes";
import type {
  FinancialNote,
  NoteFolderId,
  NotesEditorMode,
  NotesSortDirection,
  NotesSortField,
  NotesViewMode,
} from "./types";

const STORAGE_KEY = "selvam_financial_notes_v1";
const VIEW_MODE_KEY = "selvam_notes_view_mode";

export function useNotes(initialSelectedId?: string) {
  const [notes, setNotes] = useState<FinancialNote[]>(() => {
    if (typeof window === "undefined") return INITIAL_NOTES;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Failed to load notes from localStorage:", e);
    }
    return INITIAL_NOTES;
  });

  const [hasMounted, setHasMounted] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(
    () => initialSelectedId ?? notes[0]?.id ?? null,
  );
  const [activeFolder, setActiveFolder] = useState<NoteFolderId>("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<NotesViewMode>("list");
  const [sortField, setSortField] = useState<NotesSortField>("updatedAt");
  const [sortDirection, setSortDirection] = useState<NotesSortDirection>("desc");
  const [editorMode, setEditorMode] = useState<NotesEditorMode>("preview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Load preferences from localStorage on mount
  useEffect(() => {
    setHasMounted(true);
    try {
      const savedViewMode = window.localStorage.getItem(VIEW_MODE_KEY) as NotesViewMode | null;
      if (savedViewMode === "list" || savedViewMode === "gallery") {
        setViewMode(savedViewMode);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Persist notes changes to localStorage
  useEffect(() => {
    if (!hasMounted) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.error("Failed to save notes to localStorage:", e);
    }
  }, [notes, hasMounted]);

  // Synchronize when storage or selvam-notes-updated fires (e.g. from AI Chat)
  useEffect(() => {
    const handleSync = () => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setNotes(parsed);
          }
        }
      } catch {
        // Ignore
      }
    };
    window.addEventListener("storage", handleSync);
    window.addEventListener("selvam-notes-updated", handleSync);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("selvam-notes-updated", handleSync);
    };
  }, []);

  // Update selectedNoteId when initialSelectedId prop changes
  useEffect(() => {
    if (initialSelectedId) {
      setSelectedNoteId(initialSelectedId);
    }
  }, [initialSelectedId]);

  // Persist view mode changes
  const handleViewModeChange = useCallback((newMode: NotesViewMode) => {
    setViewMode(newMode);
    try {
      window.localStorage.setItem(VIEW_MODE_KEY, newMode);
    } catch {
      // Ignore
    }
  }, []);

  // Filtered and sorted notes
  const filteredNotes = useMemo(() => {
    let result = [...notes];

    // Filter by Folder
    if (activeFolder === "pinned") {
      result = result.filter((n) => n.isPinned);
    } else if (activeFolder !== "all") {
      result = result.filter((n) => n.category === activeFolder);
    }

    // Filter by Tag
    if (activeTag) {
      const normTag = activeTag.toLowerCase().replace(/^#/, "");
      result = result.filter((n) => n.tags.some((t) => t.toLowerCase() === normTag));
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.content.toLowerCase().includes(query) ||
          n.tags.some((t) => t.toLowerCase().includes(query)),
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortField === "title") {
        const compare = a.title.localeCompare(b.title);
        return sortDirection === "asc" ? compare : -compare;
      }
      const timeA = new Date(a[sortField]).getTime();
      const timeB = new Date(b[sortField]).getTime();
      return sortDirection === "asc" ? timeA - timeB : timeB - timeA;
    });

    return result;
  }, [notes, activeFolder, activeTag, searchQuery, sortField, sortDirection]);

  // Active note
  const selectedNote = useMemo(() => {
    if (!selectedNoteId) return filteredNotes[0] ?? notes[0] ?? null;
    const found = notes.find((n) => n.id === selectedNoteId);
    return found ?? filteredNotes[0] ?? notes[0] ?? null;
  }, [notes, selectedNoteId, filteredNotes]);

  // Folder note counts
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: notes.length,
      pinned: notes.filter((n) => n.isPinned).length,
      investments: 0,
      tax: 0,
      fire: 0,
      "real-estate": 0,
      household: 0,
      general: 0,
    };
    for (const note of notes) {
      if (counts[note.category] !== undefined) {
        counts[note.category] += 1;
      }
    }
    return counts;
  }, [notes]);

  // All unique tags across all notes
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const note of notes) {
      for (const tag of note.tags) {
        tagSet.add(tag.toLowerCase());
      }
    }
    return Array.from(tagSet).sort();
  }, [notes]);

  // Actions
  const createNote = useCallback(
    (folderId?: NoteFolderId) => {
      const newId = `note-${Date.now()}`;
      const targetFolder: NoteFolderId =
        folderId && folderId !== "all" && folderId !== "pinned"
          ? folderId
          : activeFolder !== "all" && activeFolder !== "pinned"
            ? activeFolder
            : "general";

      const newNote: FinancialNote = {
        id: newId,
        slug: `note-${Date.now()}`,
        title: "New Financial Note",
        content:
          "## Overview\n\nStart typing your financial memo or checklist here...\n\n- [ ] Action item 1\n",
        category: targetFolder,
        tags: [],
        isPinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setNotes((prev) => [newNote, ...prev]);
      setSelectedNoteId(newId);
      setEditorMode("edit");
      return newNote;
    },
    [activeFolder],
  );

  const updateNote = useCallback((id: string, updates: Partial<FinancialNote>) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
        return {
          ...n,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  }, []);

  const deleteNote = useCallback(
    (id: string) => {
      setNotes((prev) => {
        const nextNotes = prev.filter((n) => n.id !== id);
        if (selectedNoteId === id) {
          setSelectedNoteId(nextNotes[0]?.id ?? null);
        }
        return nextNotes;
      });
    },
    [selectedNoteId],
  );

  const togglePin = useCallback((id: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
        return {
          ...n,
          isPinned: !n.isPinned,
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  }, []);

  const resetToDefaults = useCallback(() => {
    setNotes(INITIAL_NOTES);
    setSelectedNoteId(INITIAL_NOTES[0].id);
    setActiveFolder("all");
    setActiveTag(null);
    setSearchQuery("");
  }, []);

  return {
    notes,
    filteredNotes,
    selectedNote,
    selectedNoteId,
    setSelectedNoteId,
    activeFolder,
    setActiveFolder,
    activeTag,
    setActiveTag,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode: handleViewModeChange,
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
  };
}
