"use client";

import { providerLabels, type ChatProvider, type ModelEntry } from "@/lib/ai-models";
import { Button } from "@portfolio/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@portfolio/ui/components/card";
import { Input } from "@portfolio/ui/components/input";
import { CheckCircle2Icon, KeyRoundIcon, Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";

type Status = Record<ChatProvider, boolean>;
const providers: ChatProvider[] = ["openai", "google", "anthropic", "opencode", "mistral"];

export function ModelKeysSettings() {
  const [status, setStatus] = useState<Status | null>(null);
  const [keys, setKeys] = useState<Partial<Record<ChatProvider, string>>>({});
  const [busy, setBusy] = useState<ChatProvider | null>(null);
  const [notice, setNotice] = useState("");
  const [models, setModels] = useState<Record<ChatProvider, ModelEntry[]>>(
    {} as Record<ChatProvider, ModelEntry[]>,
  );
  const [selected, setSelected] = useState<Partial<Record<ChatProvider, string[]>>>({});
  const [modelsBusy, setModelsBusy] = useState<ChatProvider | null>(null);

  async function loadModels() {
    const response = await fetch("/api/ai/models", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load available models.");
    const data = (await response.json()) as {
      models: Record<ChatProvider, ModelEntry[]>;
      selected?: Partial<Record<ChatProvider, string[]>>;
    };
    setModels(data.models);
    setSelected(data.selected ?? {});
  }

  useEffect(() => {
    void fetch("/api/ai/keys", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load saved keys.");
        setStatus((await response.json()) as Status);
        await loadModels();
      })
      .catch(() => setNotice("Could not load saved keys. Refresh to retry."));
  }, []);

  async function changeKey(provider: ChatProvider, remove = false) {
    setBusy(provider);
    setNotice("");
    try {
      const response = await fetch(remove ? `/api/ai/keys?provider=${provider}` : "/api/ai/keys", {
        method: remove ? "DELETE" : "PUT",
        ...(remove
          ? {}
          : {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ provider, key: keys[provider]?.trim() }),
            }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not update key.");
      setStatus((current) => (current ? { ...current, [provider]: !remove } : current));
      setKeys((current) => ({ ...current, [provider]: "" }));
      setNotice(`${providerLabels[provider]} key ${remove ? "removed" : "saved"}.`);
      window.dispatchEvent(new Event("selvam-ai-config-changed"));
      if (!remove) await loadModels();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not update key.");
    } finally {
      setBusy(null);
    }
  }

  async function saveModels(provider: ChatProvider) {
    setModelsBusy(provider);
    setNotice("");
    try {
      const response = await fetch("/api/ai/models", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, selectedModels: selected[provider] ?? [] }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not save model choices.");
      setNotice(`${providerLabels[provider]} model choices saved.`);
      window.dispatchEvent(new Event("selvam-ai-config-changed"));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save model choices.");
    } finally {
      setModelsBusy(null);
    }
  }

  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-2">
      <div className="xl:col-span-2">
        <p className="text-sm text-muted-foreground">
          Keys are encrypted for your account and sent only from Selvam’s server to the selected
          provider. Provider API billing is separate from chat subscriptions.
        </p>
        {notice && (
          <p role="status" className="mt-2 text-sm">
            {notice}
          </p>
        )}
      </div>
      {providers.map((provider) => (
        <Card key={provider} className="min-w-0 transition-shadow duration-200 hover:shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRoundIcon className="size-4" />
              {providerLabels[provider]}
              {status?.[provider] && (
                <CheckCircle2Icon className="ml-auto size-4 text-emerald-500" />
              )}
            </CardTitle>
            <CardDescription>
              {status?.[provider] ? "Key saved. Paste a new key to replace it." : "No key saved."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              aria-label={`${providerLabels[provider]} API key`}
              type="password"
              autoComplete="off"
              placeholder="Paste API key"
              value={keys[provider] ?? ""}
              onChange={(event) =>
                setKeys((current) => ({ ...current, [provider]: event.target.value }))
              }
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={busy !== null || (keys[provider]?.trim().length ?? 0) < 8}
                onClick={() => void changeKey(provider)}
              >
                Save key
              </Button>
              {status?.[provider] && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy !== null}
                  onClick={() => void changeKey(provider, true)}
                >
                  <Trash2Icon /> Remove
                </Button>
              )}
            </div>
            {status?.[provider] && models[provider]?.length > 0 && (
              <div className="border-t pt-3">
                <p className="mb-2 text-sm font-medium">Default model in chat</p>
                <div className="space-y-2">
                  {models[provider].map((model) => {
                    const choices = selected[provider]?.length
                      ? selected[provider]
                      : [models[provider][0]?.id];
                    const checked = choices.includes(model.id);
                    return (
                      <label key={model.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name={`${provider}-default-model`}
                          checked={checked}
                          onChange={() =>
                            setSelected((current) => ({ ...current, [provider]: [model.id] }))
                          }
                        />
                        <span className="min-w-0 truncate">{model.label}</span>
                      </label>
                    );
                  })}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  disabled={
                    modelsBusy !== null || !(selected[provider]?.length ?? models[provider].length)
                  }
                  onClick={() => void saveModels(provider)}
                >
                  Save model choices
                </Button>
              </div>
            )}
            {provider === "opencode" && (
              <p className="text-xs text-muted-foreground">
                Use an OpenCode Zen API key with Zen billing, not a local OpenCode login. Selvam
                currently offers its GPT-5.6 Sol endpoint.
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
