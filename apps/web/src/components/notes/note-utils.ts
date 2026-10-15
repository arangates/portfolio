import { format, isToday, isYesterday, subDays, isWithinInterval, parseISO } from "date-fns";
import type { FinancialNote } from "./types";

/**
 * Format timestamp in Apple Notes sidebar style:
 * - If today: "11:42 AM"
 * - If yesterday: "Yesterday"
 * - If within current year: "Oct 12"
 * - Older: "10/12/25"
 */
export function formatSidebarDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return format(date, "h:mm a");
    }
    if (isYesterday(date)) {
      return "Yesterday";
    }
    const currentYear = new Date().getFullYear();
    if (date.getFullYear() === currentYear) {
      return format(date, "MMM d");
    }
    return format(date, "M/d/yy");
  } catch {
    return "";
  }
}

/**
 * Format timestamp in Apple Notes detail header style:
 * "October 15, 2026 at 11:42 AM"
 */
export function formatHeaderDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, "MMMM d, yyyy 'at' h:mm a");
  } catch {
    return "";
  }
}

/**
 * Extract clean text snippet for note cards and list items.
 */
export function getNotePreviewSnippet(content: string, maxCharacters = 120): string {
  if (!content) return "No additional text";

  // Remove markdown headers, list markers, links, code fences, blockquotes
  const clean = content
    .replace(/^#+\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/^[-*+]\s+\[[ x]\]\s+/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_~]{1,2}/g, "")
    .replace(/\|/g, " ")
    .replace(/\n+/g, " ")
    .trim();

  if (!clean) return "No additional text";
  if (clean.length <= maxCharacters) return clean;
  return clean.slice(0, maxCharacters).trim() + "…";
}

/**
 * Groups notes into Apple Notes date buckets.
 */
export function groupNotesByDate(
  notes: FinancialNote[],
): { title: string; notes: FinancialNote[] }[] {
  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);
  const thirtyDaysAgo = subDays(now, 30);

  const pinned: FinancialNote[] = [];
  const today: FinancialNote[] = [];
  const yesterday: FinancialNote[] = [];
  const prev7Days: FinancialNote[] = [];
  const prev30Days: FinancialNote[] = [];
  const earlier: FinancialNote[] = [];

  for (const note of notes) {
    if (note.isPinned) {
      pinned.push(note);
      continue;
    }
    const noteDate = parseISO(note.updatedAt);
    if (isToday(noteDate)) {
      today.push(noteDate ? note : note);
    } else if (isYesterday(noteDate)) {
      yesterday.push(note);
    } else if (isWithinInterval(noteDate, { start: sevenDaysAgo, end: now })) {
      prev7Days.push(note);
    } else if (isWithinInterval(noteDate, { start: thirtyDaysAgo, end: now })) {
      prev30Days.push(note);
    } else {
      earlier.push(note);
    }
  }

  const groups: { title: string; notes: FinancialNote[] }[] = [];
  if (pinned.length > 0) groups.push({ title: "Pinned", notes: pinned });
  if (today.length > 0) groups.push({ title: "Today", notes: today });
  if (yesterday.length > 0) groups.push({ title: "Yesterday", notes: yesterday });
  if (prev7Days.length > 0) groups.push({ title: "Previous 7 Days", notes: prev7Days });
  if (prev30Days.length > 0) groups.push({ title: "Previous 30 Days", notes: prev30Days });
  if (earlier.length > 0) groups.push({ title: "Earlier", notes: earlier });

  return groups;
}

/**
 * Toggle a task checkbox in markdown content.
 * Matches `[ ] Task text` or `[x] Task text`.
 */
export function toggleMarkdownCheckbox(
  content: string,
  taskText: string,
  isChecked: boolean,
): string {
  const escapedTaskText = taskText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\[[ x]\\]\\s*${escapedTaskText}`, "g");
  return content.replace(regex, `[${isChecked ? "x" : " "}] ${taskText}`);
}

/**
 * Calculate reading metrics for note footer.
 */
export function getReadingStats(content: string): {
  words: number;
  characters: number;
  minutes: number;
} {
  const characters = content.length;
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return { words, characters, minutes };
}
