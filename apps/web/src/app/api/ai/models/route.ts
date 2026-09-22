import {
  getProviderKey,
  getSelectedProviderModels,
  saveSelectedProviderModels,
  type AIProvider,
} from "@/lib/ai-credentials";
import { auth } from "@portfolio/auth";
import { headers } from "next/headers";
import { z } from "zod";

const providers = ["openai", "google", "anthropic", "mistral", "opencode"] as const;
const providerSchema = z.enum(providers);

export async function GET(request: Request) {
  if (new URL(request.url).searchParams.has("provider")) {
    // Handle specific provider model list
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider");

    if (!provider || !["openai", "google", "anthropic", "mistral", "opencode"].includes(provider)) {
      return Response.json({ error: "Invalid provider" }, { status: 400 });
    }

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return Response.json({ error: "Sign in to fetch models" }, { status: 401 });
    }

    const key = await getProviderKey(
      session.user.id,
      provider as "openai" | "google" | "anthropic" | "mistral" | "opencode",
    );
    if (!key) {
      return Response.json({ error: "Add API key for this provider first" }, { status: 400 });
    }

    try {
      const models = await fetchModelsFromProvider(provider, key);
      return Response.json({ models });
    } catch (error) {
      console.error("Failed to fetch models for", provider, error);
      // Return a fallback list for the provider
      return Response.json({ models: getFallbackModels(provider) });
    }
  }

  // Return all providers with their models
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return Response.json({ error: "Sign in to fetch models" }, { status: 401 });
  }

  const allModels: Record<string, Array<{ id: string; label: string; provider: string }>> = {};

  for (const provider of ["openai", "google", "anthropic", "mistral", "opencode"] as const) {
    const key = await getProviderKey(session.user.id, provider);
    if (key) {
      try {
        const models = await fetchModelsFromProvider(provider, key);
        allModels[provider] = models.map((m) => ({ ...m, provider }));
      } catch {
        allModels[provider] = getFallbackModels(provider).map((m) => ({ ...m, provider }));
      }
    } else {
      allModels[provider] = getFallbackModels(provider).map((m) => ({ ...m, provider }));
    }
  }

  return Response.json({
    models: allModels,
    selected: await getSelectedProviderModels(session.user.id),
  });
}

export async function PUT(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user)
    return Response.json({ error: "Sign in to save model choices" }, { status: 401 });
  const body = z
    .object({
      provider: providerSchema,
      selectedModels: z.array(z.string().trim().min(1).max(200)).min(1).max(100),
    })
    .safeParse(await request.json());
  if (!body.success) return Response.json({ error: "Choose at least one model" }, { status: 400 });
  try {
    await saveSelectedProviderModels(session.user.id, body.data.provider as AIProvider, [
      ...new Set(body.data.selectedModels),
    ]);
    return Response.json({ saved: true });
  } catch {
    return Response.json(
      { error: "Add the provider API key before saving models" },
      { status: 400 },
    );
  }
}

async function fetchModelsFromProvider(
  provider: string,
  apiKey: string,
): Promise<Array<{ id: string; label: string }>> {
  switch (provider) {
    case "openai":
      return fetchOpenAIModels(apiKey);
    case "google":
      return fetchGoogleModels(apiKey);
    case "anthropic":
      return fetchAnthropicModels(apiKey);
    case "mistral":
      return fetchMistralModels(apiKey);
    case "opencode":
      // OpenCode Zen uses OpenAI-compatible API
      return fetchOpenCodeModels(apiKey);
    default:
      return [];
  }
}

async function fetchOpenAIModels(apiKey: string): Promise<Array<{ id: string; label: string }>> {
  const response = await fetch("https://api.openai.com/v1/models", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch OpenAI models");
  }

  const data = await response.json();
  const models = data.data
    .filter((m: any) => m.id.startsWith("gpt-") || m.id.startsWith("o"))
    .map((m: any) => ({
      id: m.id,
      label: m.id,
    }));

  return models;
}

async function fetchGoogleModels(apiKey: string): Promise<Array<{ id: string; label: string }>> {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models?key=" + apiKey,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch Google models");
  }

  const data = await response.json();
  const models = data.models
    .filter((m: any) => m.name.includes("gemini"))
    .map((m: any) => ({
      id: m.name.split("/").pop(),
      label: m.displayName || m.name.split("/").pop(),
    }));

  return models;
}

async function fetchAnthropicModels(apiKey: string): Promise<Array<{ id: string; label: string }>> {
  const response = await fetch("https://api.anthropic.com/v1/messages/models", {
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Anthropic models");
  }

  const data = await response.json();
  const models = data.models.map((m: any) => ({
    id: m.id,
    label: m.name || m.id,
  }));

  return models;
}

async function fetchMistralModels(apiKey: string): Promise<Array<{ id: string; label: string }>> {
  const response = await fetch("https://api.mistral.ai/v1/models", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Mistral models");
  }

  const data = await response.json();
  const models = data.data.map((m: any) => ({
    id: m.id,
    label: m.name || m.id,
  }));

  return models;
}

async function fetchOpenCodeModels(apiKey: string): Promise<Array<{ id: string; label: string }>> {
  // OpenCode Zen uses OpenAI-compatible API at https://opencode.ai/zen/v1
  const response = await fetch("https://opencode.ai/zen/v1/models", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch OpenCode models");
  }

  const data = await response.json();
  const models = data.data.map((m: any) => ({
    id: m.id,
    label: m.id,
  }));

  return models;
}

function getFallbackModels(provider: string): Array<{ id: string; label: string }> {
  const fallback: Record<string, Array<{ id: string; label: string }>> = {
    openai: [
      { id: "gpt-4.1-mini", label: "GPT-4.1 mini" },
      { id: "gpt-5.4-mini", label: "GPT-5.4 mini" },
      { id: "gpt-4o-mini", label: "GPT-4o mini" },
      { id: "gpt-4o", label: "GPT-4o" },
    ],
    google: [
      { id: "gemini-3.6-flash", label: "Gemini 3.6 Flash" },
      { id: "gemini-3-flash", label: "Gemini 3 Flash" },
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    ],
    anthropic: [
      { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
      { id: "claude-3-7-sonnet-20250219", label: "Claude 3.7 Sonnet" },
      { id: "claude-3-haiku-20240307", label: "Claude 3 Haiku" },
    ],
    mistral: [
      { id: "mistral-large-2", label: "Mistral Large 2" },
      { id: "mistral-large", label: "Mistral Large" },
      { id: "mistral-small", label: "Mistral Small" },
    ],
    opencode: [{ id: "gpt-5.6-sol", label: "GPT-5.6 Sol · OpenCode Zen" }],
  };

  return fallback[provider] || [];
}
