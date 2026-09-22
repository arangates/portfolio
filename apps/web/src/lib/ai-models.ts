export type ChatProvider = "openai" | "google" | "anthropic" | "mistral" | "opencode";

// Default models for each provider (fallback when API fetch fails)
const defaultModels: Record<
  ChatProvider,
  Array<{ id: string; label: string; provider: ChatProvider }>
> = {
  openai: [
    { id: "gpt-4.1-mini", label: "GPT-4.1 mini", provider: "openai" },
    { id: "gpt-5.4-mini", label: "GPT-5.4 mini", provider: "openai" },
    { id: "gpt-4o-mini", label: "GPT-4o mini", provider: "openai" },
    { id: "gpt-4o", label: "GPT-4o", provider: "openai" },
  ],
  google: [
    { id: "gemini-3.6-flash", label: "Gemini 3.6 Flash", provider: "google" },
    { id: "gemini-3-flash", label: "Gemini 3 Flash", provider: "google" },
  ],
  anthropic: [
    { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", provider: "anthropic" },
    { id: "claude-3-7-sonnet-20250219", label: "Claude 3.7 Sonnet", provider: "anthropic" },
  ],
  mistral: [
    { id: "mistral-large-2", label: "Mistral Large 2", provider: "mistral" },
    { id: "mistral-large", label: "Mistral Large", provider: "mistral" },
  ],
  opencode: [{ id: "gpt-5.6-sol", label: "GPT-5.6 Sol · OpenCode Zen", provider: "opencode" }],
} as const;

// Type for individual model entries
export type ModelEntry = { id: string; label: string; provider: ChatProvider };

// Flatten all models for backward compatibility
const allModels: readonly ModelEntry[] = [
  ...defaultModels.openai,
  ...defaultModels.google,
  ...defaultModels.anthropic,
  ...defaultModels.mistral,
  ...defaultModels.opencode,
];

export const chatModels = allModels;

// Models discovered from a provider are not known at build time.
export type ChatModel = string;

// Default model for each provider
export const defaultModel: Record<ChatProvider, ChatModel> = {
  openai: "gpt-4.1-mini",
  google: "gemini-3.6-flash",
  anthropic: "claude-sonnet-4-6",
  opencode: "gpt-5.6-sol",
  mistral: "mistral-large-2",
};

// Human-readable provider labels
export const providerLabels: Record<ChatProvider, string> = {
  openai: "OpenAI",
  google: "Google Gemini",
  anthropic: "Anthropic",
  opencode: "OpenCode Zen",
  mistral: "Mistral AI",
};

// Function to get models for a specific provider
export async function getModelsForProvider(
  provider: ChatProvider,
): Promise<Array<{ id: string; label: string; provider: string }>> {
  // Try to fetch from API first
  try {
    const response = await fetch(`/api/ai/models?provider=${provider}`, {
      cache: "no-store",
    });

    if (response.ok) {
      const data = await response.json();
      return data.models;
    }
  } catch {
    // Fall back to default models
  }

  return defaultModels[provider] || [];
}

// Function to get all models for all providers
export async function getAllModels(): Promise<
  Record<ChatProvider, Array<{ id: string; label: string; provider: string }>>
> {
  // Try to fetch all from API
  try {
    const response = await fetch("/api/ai/models", {
      cache: "no-store",
    });

    if (response.ok) {
      const data = await response.json();
      return data.models;
    }
  } catch {
    // Fall back to default models
  }

  // Return defaults organized by provider
  return {
    openai: defaultModels.openai,
    google: defaultModels.google,
    anthropic: defaultModels.anthropic,
    mistral: defaultModels.mistral,
    opencode: defaultModels.opencode,
  };
}
