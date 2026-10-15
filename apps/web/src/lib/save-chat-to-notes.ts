import type { FinancialNote, NoteFolderId } from "@/components/notes/types";

const STORAGE_KEY = "selvam_financial_notes_v1";

/**
 * Automatically determine the most fitting folder based on chat keywords.
 */
export function detectNoteCategory(text: string): NoteFolderId {
  const lower = text.toLowerCase();
  if (
    lower.includes("tax") ||
    lower.includes("box 3") ||
    lower.includes("box 1") ||
    lower.includes("belasting") ||
    lower.includes("deduction") ||
    lower.includes("itr") ||
    lower.includes("30% ruling") ||
    lower.includes("payslip") ||
    lower.includes("wage")
  ) {
    return "tax";
  }
  if (
    lower.includes("fire") ||
    lower.includes("retirement") ||
    lower.includes("safe withdrawal") ||
    lower.includes("swr") ||
    lower.includes("corpus") ||
    lower.includes("pension") ||
    lower.includes("aow")
  ) {
    return "fire";
  }
  if (
    lower.includes("mortgage") ||
    lower.includes("hypotheek") ||
    lower.includes("house") ||
    lower.includes("property") ||
    lower.includes("real estate") ||
    lower.includes("repayment") ||
    lower.includes("hra")
  ) {
    return "real-estate";
  }
  if (
    lower.includes("portfolio") ||
    lower.includes("equity") ||
    lower.includes("stock") ||
    lower.includes("zerodha") ||
    lower.includes("mutual fund") ||
    lower.includes("etf") ||
    lower.includes("invest") ||
    lower.includes("rebalance") ||
    lower.includes("returns") ||
    lower.includes("xirr") ||
    lower.includes("drift") ||
    lower.includes("gold") ||
    lower.includes("fd") ||
    lower.includes("fixed deposit")
  ) {
    return "investments";
  }
  if (
    lower.includes("budget") ||
    lower.includes("household") ||
    lower.includes("subscription") ||
    lower.includes("expense") ||
    lower.includes("utility") ||
    lower.includes("energy") ||
    lower.includes("insurance") ||
    lower.includes("cash flow")
  ) {
    return "household";
  }
  return "general";
}

/**
 * Load notes array from localStorage safely.
 */
function getExistingNotes(): FinancialNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save notes array and dispatch sync event.
 */
function persistNotes(notes: FinancialNote[], newNote: FinancialNote): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    window.dispatchEvent(new CustomEvent("selvam-notes-updated", { detail: { note: newNote } }));
  } catch (e) {
    console.error("Failed to persist note to localStorage:", e);
  }
}

/**
 * Save an entire AI chat conversation thread as a financial note.
 */
export function saveChatThreadToNotes({
  title,
  messages,
}: {
  title: string;
  messages: Array<{
    role: "user" | "assistant" | string;
    parts?: Array<{ type: string; text?: string }>;
    content?: string;
  }>;
}): FinancialNote {
  const existingNotes = getExistingNotes();
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Extract transcript
  const transcriptSections = messages
    .map((msg) => {
      const isUser = msg.role === "user";
      let text = msg.content ?? "";
      if (!text && msg.parts) {
        text = msg.parts
          .filter((p) => p.type === "text" && p.text)
          .map((p) => p.text)
          .join("\n\n");
      }
      if (!text.trim()) return null;

      return `### ${isUser ? "You" : "Selvām"}\n\n${text.trim()}`;
    })
    .filter(Boolean);

  const fullContent = [
    `## AI Consultation: ${title}`,
    `_Captured from Selvām Financial AI Chat on ${dateStr}_\n`,
    "---",
    ...transcriptSections,
    "\n---\n> **Note**: AI-assisted calculations should be cross-referenced with your verified account records and bank statements.",
  ].join("\n\n");

  const category = detectNoteCategory(`${title} ${fullContent}`);
  const id = `note-ai-${Date.now()}`;
  const slug = `ai-chat-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40)}-${Date.now()}`;

  const newNote: FinancialNote = {
    id,
    slug,
    title: title || "AI Financial Consultation",
    content: fullContent,
    category,
    tags: ["ai-chat", "consultation", category],
    isPinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updatedNotes = [newNote, ...existingNotes];
  persistNotes(updatedNotes, newNote);
  return newNote;
}

/**
 * Save a single AI message / response as a focused financial note.
 */
export function saveAssistantMessageToNotes({
  userPrompt,
  assistantContent,
}: {
  userPrompt?: string;
  assistantContent: string;
}): FinancialNote {
  const existingNotes = getExistingNotes();
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const title = userPrompt?.trim()
    ? userPrompt.trim().replace(/[?.,!]+$/, "")
    : "AI Financial Memo";

  const fullContent = [
    `## ${title}`,
    `_Captured from Selvām AI Assistant on ${dateStr}_\n`,
    userPrompt ? `> **Inquiry**: ${userPrompt.trim()}\n` : "",
    "---",
    assistantContent.trim(),
    "\n---\n> **Verification**: Decisions should be verified against official statements and tax filing records.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const category = detectNoteCategory(`${title} ${assistantContent}`);
  const id = `note-ai-${Date.now()}`;
  const slug = `ai-memo-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40)}-${Date.now()}`;

  const newNote: FinancialNote = {
    id,
    slug,
    title,
    content: fullContent,
    category,
    tags: ["ai-memo", "selvam", category],
    isPinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updatedNotes = [newNote, ...existingNotes];
  persistNotes(updatedNotes, newNote);
  return newNote;
}
