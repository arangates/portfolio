export type ChatProvider = "openai" | "google" | "anthropic" | "mistral" | "opencode" | "gateway";

export type ModelEntry = { id: string; label: string; provider: ChatProvider };
export type ChatModel = string;

export const providerLabels: Record<ChatProvider, string> = {
  openai: "OpenAI",
  google: "Google Gemini",
  anthropic: "Anthropic",
  opencode: "OpenCode Zen",
  gateway: "Vercel AI Gateway",
  mistral: "Mistral AI",
};
