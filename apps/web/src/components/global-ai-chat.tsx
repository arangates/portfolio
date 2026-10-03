"use client";

import { ChatComposer } from "@portfolio/ai-chat-ui";
import {
  chatModels,
  defaultModel,
  type ChatModel,
  type ChatProvider,
  type ModelEntry,
} from "@/lib/ai-models";
import { useChat } from "@ai-sdk/react";
import { useAISDKRuntime } from "@assistant-ui/ai-sdk";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
  type UIMessage,
} from "ai";
import type { AttachmentAdapter } from "@assistant-ui/react";
import { ArrowUpRightIcon, CheckIcon, ChevronDownIcon, KeyRoundIcon } from "lucide-react";
import { Button, buttonVariants } from "@portfolio/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@portfolio/ui/components/dropdown-menu";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Provider = ChatProvider;
type Status = Record<Provider, boolean>;
type ChatThread = { id: string; title: string; provider: string; model: string; updatedAt: string };
type ChatContextValue = {
  provider: Provider;
  setProvider: (provider: Provider) => void;
  model: ChatModel;
  setModel: (model: ChatModel) => void;
  models: ModelEntry[];
  threads: ChatThread[];
  activeThreadId: string | null;
  threadLoading: boolean;
  newThread: () => Promise<void>;
  selectThread: (id: string) => Promise<void>;
  deleteThread: (id: string) => Promise<void>;
  deleteThreads: (ids?: string[]) => Promise<void>;
  renameThread: (id: string, title: string) => Promise<void>;
  shareTranscript: () => Promise<void>;
  exportMarkdown: () => void;
  searchThreads: (query: string) => Promise<void>;
  sendPrompt: (text: string) => void;
  status: Status | null;
  statusLoading: boolean;
  clear: () => void;
  notice: string;
  error: string | undefined;
  dismissError: () => void;
};
const ChatContext = createContext<ChatContextValue | null>(null);
export const MAX_ATTACHMENT_BYTES = 1_500_000;

function readAsDataURL(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const attachmentAdapter: AttachmentAdapter = {
  accept: "image/png,image/jpeg,image/webp,image/gif,application/pdf",
  async add({ file }) {
    if (file.size > MAX_ATTACHMENT_BYTES) throw new Error("Files must be 1.5 MB or smaller.");
    return {
      id: crypto.randomUUID(),
      type: file.type.startsWith("image/") ? "image" : "file",
      name: file.name,
      file,
      contentType: file.type,
      content: [],
      status: { type: "requires-action", reason: "composer-send" },
    };
  },
  async send(attachment) {
    return {
      ...attachment,
      status: { type: "complete" },
      content: [
        {
          type: "file",
          mimeType: attachment.contentType ?? "",
          filename: attachment.name,
          data: await readAsDataURL(attachment.file),
        },
      ],
    };
  },
  async remove() {},
};

export function useSelvamChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error("Selvam chat provider is missing");
  return context;
}

function ModelPicker({
  models,
  provider,
  model,
  onSelect,
}: {
  models: ModelEntry[];
  provider: Provider;
  model: string;
  onSelect: (entry: ModelEntry) => void;
}) {
  const current = models.find((entry) => entry.provider === provider && entry.id === model);
  const label = current?.label ?? model;
  if (models.length < 2) {
    return (
      <span className="max-w-56 truncate px-2 text-sm font-medium text-foreground/80">{label}</span>
    );
  }
  const groups = models.reduce<Record<string, ModelEntry[]>>((acc, entry) => {
    (acc[entry.provider] ??= []).push(entry);
    return acc;
  }, {});
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="max-w-56 gap-1 rounded-full px-2 font-medium text-foreground/80"
            aria-label="Choose model"
          />
        }
      >
        <span className="truncate">{label}</span>
        <ChevronDownIcon data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-64">
        {Object.entries(groups).map(([group, entries]) => (
          <DropdownMenuGroup key={group}>
            <DropdownMenuLabel className="capitalize">{group}</DropdownMenuLabel>
            {entries.map((entry) => (
              <DropdownMenuItem
                key={`${entry.provider}:${entry.id}`}
                onClick={() => onSelect(entry)}
              >
                <span className="truncate">{entry.label}</span>
                {entry.provider === provider && entry.id === model ? (
                  <CheckIcon className="ml-auto" />
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SelvamComposer() {
  const chat = useSelvamChat();

  if (chat.statusLoading || !chat.status) {
    return (
      <div className="h-10 w-full animate-pulse rounded-2xl border bg-muted/40" role="status" />
    );
  }

  if (!chat.status[chat.provider]) {
    return (
      <Link
        href="/dashboard/settings?tab=model-keys"
        className={buttonVariants({
          variant: "outline",
          className: "h-auto min-h-14 w-full justify-start gap-3 rounded-2xl px-4 py-3 text-left",
        })}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted">
          <KeyRoundIcon />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">Connect an AI provider</span>
          <span className="block text-xs font-normal text-muted-foreground">
            Add an API key to send messages
          </span>
        </span>
        <ArrowUpRightIcon className="size-4 shrink-0 text-muted-foreground" />
      </Link>
    );
  }

  return (
    <ChatComposer
      modelSelector={
        <ModelPicker
          models={chat.models}
          provider={chat.provider}
          model={chat.model}
          onSelect={(entry) => {
            chat.setProvider(entry.provider);
            chat.setModel(entry.id);
          }}
        />
      }
      commands={[
        {
          id: "summarize",
          description: "Summarize the conversation",
          execute: () => chat.sendPrompt("Summarize this conversation using my current records."),
        },
        {
          id: "fire-check",
          description: "Quick FIRE progress snapshot with gap analysis",
          execute: () =>
            chat.sendPrompt(
              "Give me a quick FIRE progress snapshot. Include my current investable assets, required corpus, gap, and success probability.",
            ),
        },
        {
          id: "budget-review",
          description: "Review this month's household budget",
          execute: () =>
            chat.sendPrompt(
              "Review my household budget for the current month. Show gross expenses, refunds, and net spending compared to budget.",
            ),
        },
        {
          id: "compare",
          description: "Compare cash flow between two periods",
          execute: () =>
            chat.sendPrompt(
              "Compare my cash flow this month vs last month. Highlight the biggest changes in income and spending categories.",
            ),
        },
        {
          id: "salary",
          description: "Show latest salary breakdown",
          execute: () =>
            chat.sendPrompt(
              "Show my latest salary payslip breakdown including gross pay, net pay, and tax deductions.",
            ),
        },
        {
          id: "returns",
          description: "Show verified investment returns",
          execute: () =>
            chat.sendPrompt(
              "What are my verified investment returns? Show XIRR and time-weighted returns with evidence quality.",
            ),
        },
        {
          id: "help",
          description: "List available financial chat commands",
          execute: () =>
            chat.sendPrompt("What commands and financial sections can you help me with?"),
        },
      ]}
    />
  );
}

export function GlobalAIChat({ userId, children }: { userId: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const onChatPage = pathname === "/dashboard/chat";
  const [provider, setProvider] = useState<Provider>("openai");
  const [model, setModelState] = useState<ChatModel>("gpt-4.1-mini");
  const [models, setModels] = useState<ModelEntry[]>([...chatModels]);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [pendingHistory, setPendingHistory] = useState<{
    id: string;
    messages: UIMessage[];
  } | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const providerRef = useRef(provider);
  providerRef.current = provider;
  const modelRef = useRef(model);
  modelRef.current = model;
  const threadRef = useRef(activeThreadId);
  threadRef.current = activeThreadId;
  const initializationRef = useRef(false);
  const selectionRef = useRef(0);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/ai/chat",
        prepareSendMessagesRequest: ({ messages: current, body, trigger, messageId }) => ({
          body: {
            threadId: threadRef.current,
            provider: body?.provider ?? providerRef.current,
            model: modelRef.current,
            trigger,
            messageId,
            messages: current.slice(-1),
          },
        }),
      }),
    [],
  );
  const chat = useChat({
    id: activeThreadId ?? `selvam-pending:${userId}`,
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    onFinish: () => {
      window.setTimeout(() => void refreshThreads().catch(() => {}), 250);
    },
  });
  const { messages, setMessages, sendMessage, stop, clearError, error, status: chatStatus } = chat;
  const runtime = useAISDKRuntime(chat, { adapters: { attachments: attachmentAdapter } });

  useEffect(() => {
    if (!pendingHistory || pendingHistory.id !== activeThreadId) return;
    setMessages(pendingHistory.messages);
    setPendingHistory(null);
    setThreadLoading(false);
  }, [pendingHistory, activeThreadId, setMessages]);

  async function refreshThreads(query?: string) {
    const url = query ? `/api/ai/threads?q=${encodeURIComponent(query)}` : "/api/ai/threads";
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load conversations");
    const data = (await response.json()) as { threads: ChatThread[] };
    setThreads(data.threads);
    return data.threads;
  }

  async function searchThreads(query: string) {
    try {
      await refreshThreads(query || undefined);
    } catch {
      setNotice("Could not search conversations.");
    }
  }

  async function selectThread(id: string) {
    const selection = ++selectionRef.current;
    setThreadLoading(true);
    setNotice("");
    clearError();
    stop();
    try {
      const response = await fetch(`/api/ai/threads/${id}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load conversation");
      const data = (await response.json()) as { thread: ChatThread & { messages: UIMessage[] } };
      if (selection !== selectionRef.current) return;
      setActiveThreadId(id);
      setPendingHistory({ id, messages: data.thread.messages });
    } catch (cause) {
      if (selection === selectionRef.current) {
        setNotice(cause instanceof Error ? cause.message : "Could not load conversation");
        setThreadLoading(false);
      }
    }
  }

  async function newThread() {
    const selection = ++selectionRef.current;
    setThreadLoading(true);
    setNotice("");
    clearError();
    stop();
    try {
      const response = await fetch("/api/ai/threads", { method: "POST" });
      if (!response.ok) throw new Error("Could not create conversation");
      const data = (await response.json()) as { thread: ChatThread };
      if (selection !== selectionRef.current) return;
      setActiveThreadId(data.thread.id);
      setThreads((current) => [data.thread, ...current]);
      setPendingHistory({ id: data.thread.id, messages: [] });
    } catch (cause) {
      if (selection === selectionRef.current) {
        setNotice(cause instanceof Error ? cause.message : "Could not create conversation");
        setThreadLoading(false);
      }
    }
  }

  async function deleteThread(id: string) {
    const response = await fetch(`/api/ai/threads/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setNotice("Could not delete conversation");
      return;
    }
    setThreads((current) => current.filter((thread) => thread.id !== id));
    if (id === activeThreadId) {
      setActiveThreadId(null);
      void newThread();
    }
  }

  async function deleteThreads(ids?: string[]) {
    const response = await fetch("/api/ai/threads", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ids ? { ids } : { all: true }),
    });
    if (!response.ok) {
      setNotice("Could not delete conversations");
      return;
    }
    const data = (await response.json()) as { deleted: string[] };
    const deletedIds = new Set(data.deleted);
    setThreads((current) => current.filter((thread) => !deletedIds.has(thread.id)));
    if (ids === undefined || (activeThreadId && deletedIds.has(activeThreadId))) {
      setActiveThreadId(null);
      await newThread();
    }
  }

  async function renameThread(id: string, title: string) {
    const response = await fetch(`/api/ai/threads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!response.ok) {
      setNotice("Could not rename conversation");
      return;
    }
    setThreads((current) =>
      current.map((thread) => (thread.id === id ? { ...thread, title } : thread)),
    );
  }

  async function shareTranscript() {
    const transcript = messages
      .map(
        (message) =>
          `${message.role === "user" ? "You" : "Selvam"}: ${message.parts
            .filter((part) => part.type === "text")
            .map((part) => (part.type === "text" ? part.text : ""))
            .join("\n")}`,
      )
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(transcript);
      setNotice("Transcript copied. Review private figures before sharing.");
    } catch {
      setNotice("Could not copy the transcript.");
    }
  }

  function exportMarkdown() {
    const threadTitle = threads.find((t) => t.id === activeThreadId)?.title || "selvam-chat";
    const fileName = `${threadTitle
      .replace(/[^a-z0-9]+/gi, "-")
      .toLowerCase()
      .slice(0, 50)}.md`;
    const lines = [
      `# ${threadTitle}`,
      `_Exported from Selvam on ${new Date().toLocaleDateString()}_\n`,
      ...messages.map((message) => {
        const role = message.role === "user" ? "**You**" : "**Selvam**";
        const text = message.parts
          .filter((part) => part.type === "text")
          .map((part) => (part.type === "text" ? part.text : ""))
          .join("\n");
        return `### ${role}\n\n${text}`;
      }),
      "\n---\n_AI can make mistakes. Verify decisions against the linked source records._",
    ];
    const blob = new Blob([lines.join("\n\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  function sendPrompt(text: string) {
    if (!status?.[provider]) {
      setNotice(`Add your ${provider} API key in Settings → Model keys to chat.`);
      return;
    }
    if (
      !activeThreadId ||
      threadLoading ||
      chatStatus === "submitted" ||
      chatStatus === "streaming"
    )
      return;
    if (chatStatus === "error") clearError();
    setNotice("");
    void sendMessage({ text }, { body: { provider } });
  }
  function chooseProvider(value: Provider) {
    clearError();
    setNotice("");
    setProvider(value);
    setModelState(
      models.find((candidate) => candidate.provider === value)?.id ?? defaultModel[value],
    );
  }
  function chooseModel(value: ChatModel) {
    clearError();
    setNotice("");
    setModelState(value);
  }

  useEffect(() => {
    if (!onChatPage) return;
    if (initializationRef.current) return;
    initializationRef.current = true;
    void refreshThreads()
      .then((items) => {
        if (!threadRef.current && items[0]) void selectThread(items[0].id);
        else if (!threadRef.current) void newThread();
      })
      .catch(() => setNotice("Could not load conversations."))
      .finally(() => {
        initializationRef.current = false;
      });
  }, [onChatPage]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);
  useEffect(() => {
    const refreshConfiguration = () => {
      setStatusLoading(true);
      void fetch("/api/ai/keys", { cache: "no-store" })
        .then(async (statusResponse) => {
          if (!statusResponse.ok) throw new Error("Could not load saved API keys");
          const value = (await statusResponse.json()) as Status;
          let data: {
            models: Record<Provider, ModelEntry[]>;
            selected?: Partial<Record<Provider, string[]>>;
          } = { models: {} as Record<Provider, ModelEntry[]> };
          try {
            const modelsResponse = await fetch("/api/ai/models", { cache: "no-store" });
            if (modelsResponse.ok) data = (await modelsResponse.json()) as typeof data;
          } catch {
            // Key status is enough to start chat; model discovery is optional.
          }
          return { value, data };
        })
        .then(({ value, data }) => {
          setStatus(value);
          const entries: ModelEntry[] = (
            ["openai", "google", "anthropic", "opencode", "mistral"] as Provider[]
          )
            .filter((candidate) => value[candidate])
            .flatMap((candidate) => {
              const available = data.models[candidate] ?? [];
              const saved = data.selected?.[candidate] ?? [];
              const ids = saved.length ? saved : [available[0]?.id ?? defaultModel[candidate]];
              return ids.map(
                (id) =>
                  available.find((entry) => entry.id === id) ?? {
                    id,
                    label: id,
                    provider: candidate,
                  },
              );
            });
          setModels(entries);
          const current = entries.find(
            (entry) => entry.provider === providerRef.current && entry.id === modelRef.current,
          );
          const next = current ?? entries[0];
          if (!next) return;
          setProvider(next.provider);
          setModelState(next.id);
        })
        .catch(() => setNotice("Could not load provider settings. Please retry."))
        .finally(() => setStatusLoading(false));
    };
    refreshConfiguration();
    window.addEventListener("focus", refreshConfiguration);
    window.addEventListener("selvam-ai-config-changed", refreshConfiguration);
    return () => {
      window.removeEventListener("focus", refreshConfiguration);
      window.removeEventListener("selvam-ai-config-changed", refreshConfiguration);
    };
  }, []);
  const clear = () => {
    void newThread();
  };
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ChatContext.Provider
        value={{
          provider,
          setProvider: chooseProvider,
          model,
          setModel: chooseModel,
          models,
          threads,
          activeThreadId,
          threadLoading,
          newThread,
          selectThread,
          deleteThread,
          deleteThreads,
          renameThread,
          shareTranscript,
          exportMarkdown,
          searchThreads,
          sendPrompt,
          status,
          statusLoading,
          clear,
          notice,
          error: error?.message,
          dismissError: clearError,
        }}
      >
        {children}
      </ChatContext.Provider>
    </AssistantRuntimeProvider>
  );
}
