export const chatModels = [
  { id: "gpt-4.1-mini", label: "GPT-4.1 mini", provider: "openai" },
  { id: "gpt-5.4-mini", label: "GPT-5.4 mini", provider: "openai" },
  { id: "gemini-3.6-flash", label: "Gemini 3.6 Flash", provider: "google" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", provider: "anthropic" },
  { id: "gpt-5.6-sol", label: "GPT-5.6 Sol · OpenCode Zen", provider: "opencode" },
] as const;

export type ChatProvider = (typeof chatModels)[number]["provider"];
export type ChatModel = (typeof chatModels)[number]["id"];
export const defaultModel: Record<ChatProvider, ChatModel> = {
  openai: "gpt-4.1-mini",
  google: "gemini-3.6-flash",
  anthropic: "claude-sonnet-4-6",
  opencode: "gpt-5.6-sol",
};
export const providerLabels: Record<ChatProvider, string> = {
  openai: "OpenAI",
  google: "Google Gemini",
  anthropic: "Anthropic",
  opencode: "OpenCode Zen",
};
