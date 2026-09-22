"use client";

import { useFinancialPrivacy } from "@/components/dashboard-experience";
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
import { AssistantRuntimeProvider, ThreadPrimitive } from "@assistant-ui/react";
import { Button } from "@portfolio/ui/components/button";
import { buttonVariants } from "@portfolio/ui/components/button";
import { DefaultChatTransport, type UIMessage } from "ai";
import { KeyRoundIcon, Maximize2Icon, MessageCircleIcon, PlusIcon, XIcon } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
  sendPrompt: (text: string) => void;
  status: Status | null;
  statusLoading: boolean;
  clear: () => void;
  notice: string;
  error: string | undefined;
  dismissError: () => void;
};
const ChatContext = createContext<ChatContextValue | null>(null);
export function useSelvamChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error("Selvam chat provider is missing");
  return context;
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
        className={buttonVariants({ variant: "outline", className: "w-full" })}
      >
        <KeyRoundIcon /> Add an API key to start chatting
      </Link>
    );
  }

  return (
    <ChatComposer
      modelSelector={
        <span className="max-w-56 truncate px-2 text-sm font-medium text-foreground/80">
          {chat.models.find(
            (candidate) => candidate.provider === chat.provider && candidate.id === chat.model,
          )?.label ?? chat.model}
        </span>
      }
      mentions={[
        { id: "portfolio", label: "Portfolio overview", type: "financial section" },
        { id: "fire", label: "FIRE plan", type: "financial section" },
        { id: "cash-flow", label: "Cash flow", type: "financial section" },
        { id: "returns", label: "Verified returns", type: "financial section" },
      ]}
      commands={[
        {
          id: "summarize",
          description: "Summarize the conversation",
          execute: () => chat.sendPrompt("Summarize this conversation using my current records."),
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
  const privateMode = useFinancialPrivacy();
  const pathname = usePathname();
  const onChatPage = pathname === "/dashboard/chat";
  const [open, setOpen] = useState(false);
  const [launcherDismissed, setLauncherDismissed] = useState(false);
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

  useEffect(() => setOpen(false), [pathname]);

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
    onFinish: () => {
      window.setTimeout(() => void refreshThreads().catch(() => {}), 250);
    },
  });
  const { messages, setMessages, sendMessage, stop, clearError, error, status: chatStatus } = chat;
  const runtime = useAISDKRuntime(chat);

  useEffect(() => {
    if (!pendingHistory || pendingHistory.id !== activeThreadId) return;
    setMessages(pendingHistory.messages);
    setPendingHistory(null);
    setThreadLoading(false);
  }, [pendingHistory, activeThreadId, setMessages]);

  async function refreshThreads() {
    const response = await fetch("/api/ai/threads", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load conversations");
    const data = (await response.json()) as { threads: ChatThread[] };
    setThreads(data.threads);
    return data.threads;
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
    if (!open && !onChatPage) return;
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
  }, [open, onChatPage]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, open]);
  useEffect(() => {
    const refreshConfiguration = () => {
      setStatusLoading(true);
      void Promise.all([
        fetch("/api/ai/keys", { cache: "no-store" }),
        fetch("/api/ai/models", { cache: "no-store" }),
      ])
        .then(async ([statusResponse, modelsResponse]) => {
          if (!statusResponse.ok || !modelsResponse.ok)
            throw new Error("Could not load chat settings");
          return {
            status: (await statusResponse.json()) as Status,
            models: (await modelsResponse.json()) as {
              models: Record<Provider, ModelEntry[]>;
              selected?: Partial<Record<Provider, string[]>>;
            },
          };
        })
        .then(({ status: value, models: data }) => {
          setStatus(value);
          const firstProvider = (
            [
              providerRef.current,
              "openai",
              "google",
              "anthropic",
              "opencode",
              "mistral",
            ] as Provider[]
          ).find(
            (candidate, index, providers) =>
              value[candidate] && providers.indexOf(candidate) === index,
          );
          if (!firstProvider) {
            setModels([]);
            return;
          }
          const available = data.models[firstProvider] ?? [];
          const saved = data.selected?.[firstProvider] ?? [];
          const selectedId = saved[0] ?? available[0]?.id ?? defaultModel[firstProvider];
          const selectedModel = available.find((candidate) => candidate.id === selectedId);
          setProvider(firstProvider);
          setModels(
            selectedModel
              ? [selectedModel]
              : [{ id: selectedId, label: selectedId, provider: firstProvider }],
          );
          setModelState(selectedId);
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
  useEffect(() => {
    if (privateMode) {
      setOpen(false);
      stop();
    }
  }, [privateMode, stop]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

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
        {!privateMode && !onChatPage && !open && !launcherDismissed && (
          <div className="fixed right-4 bottom-5 z-40 flex items-center gap-1 rounded-full bg-primary p-1 text-primary-foreground shadow-lg">
            <Button
              type="button"
              variant="ghost"
              className="h-10 gap-2 rounded-full px-3 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
              onClick={() => setOpen(true)}
              aria-label="Open Selvam assistant"
            >
              <MessageCircleIcon className="size-5" /> Ask Selvam
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-full text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
              onClick={() => setLauncherDismissed(true)}
              aria-label="Dismiss Ask Selvam button"
              title="Dismiss"
            >
              <XIcon className="size-4" />
            </Button>
          </div>
        )}
        {!privateMode && !onChatPage && open && (
          <section
            role="dialog"
            aria-label="Selvam assistant"
            aria-modal="false"
            className="fixed inset-0 z-50 flex flex-col border bg-background shadow-2xl sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[min(700px,calc(100dvh-80px))] sm:w-[min(440px,calc(100vw-40px))] sm:rounded-xl"
          >
            <header className="flex shrink-0 items-center gap-2 border-b bg-muted/20 px-4 py-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <MessageCircleIcon />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold">Ask Selvam</h2>
                <p className="text-xs text-muted-foreground">
                  Answers from your current financial records
                </p>
              </div>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={clear}
                disabled={threadLoading}
                aria-label="Start a new chat"
                title="New chat"
              >
                <PlusIcon />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                render={<Link href="/dashboard/settings?tab=model-keys" />}
                aria-label="Model key settings"
              >
                <KeyRoundIcon />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                render={<Link href="/dashboard/chat" />}
                aria-label="Open full chat page"
              >
                <Maximize2Icon />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
              >
                <XIcon />
              </Button>
            </header>
            <div
              className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-muted/10 p-4 [&_table]:my-2 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_td]:whitespace-nowrap [&_td]:px-2 [&_td]:py-1 [&_th]:whitespace-nowrap [&_th]:border-b [&_th]:px-2 [&_th]:py-1"
              aria-live="polite"
            >
              {messages.length === 0 && (
                <div className="flex min-h-full flex-col items-center justify-center px-4 text-center">
                  <span className="mb-3 flex size-11 items-center justify-center rounded-2xl border bg-background text-primary shadow-sm">
                    <MessageCircleIcon />
                  </span>
                  <p className="font-medium">What would you like to understand?</p>
                  <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                    Ask about your portfolio, FIRE plan, household budget, or verified returns.
                  </p>
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`w-fit max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === "user" ? "ml-auto rounded-br-md bg-primary text-primary-foreground" : "mr-auto rounded-bl-md border bg-background shadow-xs"}`}
                >
                  {message.parts.map((part, index) =>
                    part.type === "text" ? (
                      <div
                        key={index}
                        className="prose prose-sm max-w-none break-words dark:prose-invert [&_p]:my-1 [&_ul]:my-1"
                      >
                        <Markdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            a: ({ href, children }) =>
                              href?.startsWith("/dashboard") ? (
                                <a href={href} className="underline">
                                  {children}
                                </a>
                              ) : (
                                <span>{children}</span>
                              ),
                          }}
                        >
                          {part.text}
                        </Markdown>
                      </div>
                    ) : part.type.startsWith("tool-") &&
                      "state" in part &&
                      part.state !== "output-available" ? (
                      <span key={index} className="text-xs text-muted-foreground">
                        Checking your records…
                      </span>
                    ) : null,
                  )}
                </div>
              ))}
              {(chatStatus === "submitted" || chatStatus === "streaming") && (
                <p className="text-xs text-muted-foreground">Selvam is checking your records…</p>
              )}
              <div ref={endRef} />
            </div>
            {(notice || error) && (
              <div
                role="alert"
                className="flex items-center gap-2 border-t px-4 py-2 text-xs text-destructive"
              >
                <span className="min-w-0 flex-1">{notice || error?.message}</span>
                {error && (
                  <Button type="button" size="sm" variant="ghost" onClick={clearError}>
                    Dismiss
                  </Button>
                )}
              </div>
            )}
            <div className="shrink-0 border-t bg-background p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <ThreadPrimitive.Root className="contents">
                <ThreadPrimitive.Viewport className="contents">
                  <SelvamComposer />
                </ThreadPrimitive.Viewport>
              </ThreadPrimitive.Root>
            </div>
          </section>
        )}
      </ChatContext.Provider>
    </AssistantRuntimeProvider>
  );
}
