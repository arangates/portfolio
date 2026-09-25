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
import { buttonVariants } from "@portfolio/ui/components/button";
import { DefaultChatTransport, type UIMessage } from "ai";
import { KeyRoundIcon } from "lucide-react";
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

export function SelvamComposer({ standalone = false }: { standalone?: boolean }) {
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
      standalone={standalone}
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
      </ChatContext.Provider>
    </AssistantRuntimeProvider>
  );
}
