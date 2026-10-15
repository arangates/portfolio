export type NoteFolderId =
  | "all"
  | "pinned"
  | "investments"
  | "tax"
  | "fire"
  | "real-estate"
  | "household"
  | "general";

export interface NoteFolder {
  id: NoteFolderId;
  name: string;
  iconName: "Folder" | "Pin" | "TrendingUp" | "Receipt" | "Flame" | "Home" | "Users" | "FileText";
  colorClass: string;
}

export interface FinancialNote {
  id: string;
  slug: string;
  title: string;
  content: string;
  category: NoteFolderId;
  tags: string[];
  isPinned: boolean;
  createdAt: string; // ISO 8601 string
  updatedAt: string; // ISO 8601 string
}

export type NotesViewMode = "list" | "gallery";
export type NotesSortField = "updatedAt" | "createdAt" | "title";
export type NotesSortDirection = "desc" | "asc";
export type NotesEditorMode = "preview" | "edit" | "split";
