"use client";

import { providerLabels, type ChatProvider, type ModelEntry } from "@/lib/ai-models";
import { Badge } from "@portfolio/ui/components/badge";
import { Button } from "@portfolio/ui/components/button";
import { Card } from "@portfolio/ui/components/card";
import { Input } from "@portfolio/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@portfolio/ui/components/select";
import { Spinner } from "@portfolio/ui/components/spinner";
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  KeyRoundIcon,
  LockKeyholeIcon,
  Trash2Icon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Status = Record<ChatProvider, boolean>;
const providers: ChatProvider[] = [
  "openai",
  "google",
  "anthropic",
  "opencode",
  "mistral",
  "gateway",
];

export function ModelKeysSettings() {
  const [status, setStatus] = useState<Status | null>(null);
  const [keys, setKeys] = useState<Partial<Record<ChatProvider, string>>>({});
  const [busy, setBusy] = useState<ChatProvider | null>(null);
  const [models, setModels] = useState<Record<ChatProvider, ModelEntry[]>>(
    {} as Record<ChatProvider, ModelEntry[]>,
  );
  const [selected, setSelected] = useState<Partial<Record<ChatProvider, string[]>>>({});
  const [open, setOpen] = useState<ChatProvider | null>(null);

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
        const loaded = (await response.json()) as Status;
        setStatus(loaded);
        setOpen(providers.find((provider) => !loaded[provider]) ?? null);
        await loadModels();
      })
      .catch(() => toast.error("Could not load saved keys. Refresh to retry."));
  }, []);

  async function changeKey(provider: ChatProvider, remove = false) {
    setBusy(provider);
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
      toast.success(`${providerLabels[provider]} key ${remove ? "removed" : "saved"}`);
      window.dispatchEvent(new Event("selvam-ai-config-changed"));
      if (!remove) await loadModels();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update key.");
    } finally {
      setBusy(null);
    }
  }

  async function saveModel(provider: ChatProvider, modelId: string) {
    const previous = selected[provider];
    setSelected((current) => ({ ...current, [provider]: [modelId] }));
    try {
      const response = await fetch("/api/ai/models", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, selectedModels: [modelId] }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not save model choice.");
      toast.success(`Default ${providerLabels[provider]} model updated`);
      window.dispatchEvent(new Event("selvam-ai-config-changed"));
    } catch (error) {
      setSelected((current) => ({ ...current, [provider]: previous }));
      toast.error(error instanceof Error ? error.message : "Could not save model choice.");
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
        <LockKeyholeIcon className="mt-0.5 size-4 shrink-0" />
        <p className="text-pretty">
          Keys are encrypted for your account and sent only from Selvam’s server to the provider you
          choose. Provider API billing is separate from chat subscriptions.
        </p>
      </div>
      <Card className="divide-y overflow-hidden">
        {providers.map((provider) => {
          const connected = status?.[provider] ?? false;
          const expanded = open === provider;
          const providerModels = models[provider] ?? [];
          const currentModel = selected[provider]?.[0] ?? providerModels[0]?.id;
          const pending = busy === provider;
          const panelId = `${provider}-panel`;
          return (
            <section key={provider}>
              <h3>
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => setOpen(expanded ? null : provider)}
                  className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors outline-none hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset sm:px-5"
                >
                  <KeyRoundIcon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {providerLabels[provider]}
                  </span>
                  {status === null ? null : connected ? (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle2Icon className="size-3 text-emerald-500" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="font-normal text-muted-foreground">
                      Not connected
                    </Badge>
                  )}
                  <ChevronDownIcon
                    className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
                  />
                </button>
              </h3>
              <div id={panelId} hidden={!expanded} className="space-y-4 px-4 pt-1 pb-5 sm:px-5">
                <form
                  className="space-y-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void changeKey(provider);
                  }}
                >
                  <label htmlFor={`${provider}-key`} className="text-sm font-medium">
                    {connected ? "Replace API key" : "API key"}
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      id={`${provider}-key`}
                      type="password"
                      autoComplete="off"
                      placeholder={connected ? "Paste a new key" : "Paste your key"}
                      value={keys[provider] ?? ""}
                      onChange={(event) =>
                        setKeys((current) => ({ ...current, [provider]: event.target.value }))
                      }
                    />
                    <Button
                      type="submit"
                      disabled={busy !== null || (keys[provider]?.trim().length ?? 0) < 8}
                    >
                      {pending && <Spinner data-icon="inline-start" />}
                      {connected ? "Replace key" : "Save key"}
                    </Button>
                  </div>
                  {provider === "gateway" && (
                    <p className="text-xs text-pretty text-muted-foreground">
                      Create an AI Gateway key in your Vercel dashboard. New teams get $5 of free
                      credits each month, and one key reaches OpenAI, Google, Anthropic and more.
                    </p>
                  )}
                  {provider === "opencode" && (
                    <p className="text-xs text-pretty text-muted-foreground">
                      Use an OpenCode Zen API key with Zen billing, not a local OpenCode login.
                      Selvam currently offers its GPT-5.6 Sol endpoint.
                    </p>
                  )}
                </form>
                {connected && providerModels.length > 0 && currentModel && (
                  <div className="space-y-2">
                    <label htmlFor={`${provider}-model`} className="text-sm font-medium">
                      Default model in chat
                    </label>
                    <Select
                      value={currentModel}
                      items={providerModels.map((model) => ({
                        value: model.id,
                        label: model.label,
                      }))}
                      onValueChange={(value) => value !== null && void saveModel(provider, value)}
                    >
                      <SelectTrigger id={`${provider}-model`} className="w-full sm:max-w-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {providerModels.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {connected && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={busy !== null}
                    onClick={() => void changeKey(provider, true)}
                  >
                    <Trash2Icon data-icon="inline-start" />
                    Remove key
                  </Button>
                )}
              </div>
            </section>
          );
        })}
      </Card>
    </div>
  );
}
