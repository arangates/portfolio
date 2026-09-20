"use client";

import { useFinancialPrivacy } from "@/components/dashboard-experience";
import { chatModels, defaultModel, type ChatModel, type ChatProvider } from "@/lib/ai-models";
import { useChat } from "@ai-sdk/react";
import { useAISDKRuntime } from "@assistant-ui/ai-sdk";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { Button } from "@portfolio/ui/components/button";
import { Input } from "@portfolio/ui/components/input";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  KeyRoundIcon,
  Maximize2Icon,
  MessageCircleIcon,
  SendIcon,
  SquareIcon,
  XIcon,
} from "lucide-react";
import Markdown from "react-markdown";
import { createContext, useContext, useEffect, useRef, useState } from "react";
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
  threads: ChatThread[];
  activeThreadId: string | null;
  threadLoading: boolean;
  newThread: () => Promise<void>;
  selectThread: (id: string) => Promise<void>;
  deleteThread: (id: string) => Promise<void>;
  renameThread: (id: string, title: string) => Promise<void>;
  shareTranscript: () => Promise<void>;
  sendPrompt: (text: string) => void;
  status: Status | null;
  clear: () => void;
  notice: string;
  error: string | undefined;
};
const ChatContext = createContext<ChatContextValue | null>(null);
export function useSelvamChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error("Selvam chat provider is missing");
  return context;
}

export function GlobalAIChat({ userId, children }: { userId: string; children: React.ReactNode }) {
  const privateMode = useFinancialPrivacy();
  const pathname = usePathname();
  const onChatPage = pathname === "/dashboard/chat";
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState<Provider>("openai");
  const [model, setModel] = useState<ChatModel>("gpt-4.1-mini");
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [pendingHistory, setPendingHistory] = useState<{
    id: string;
    messages: UIMessage[];
  } | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [input, setInput] = useState("");
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

  const chat = useChat({
    id: activeThreadId ?? `selvam-pending:${userId}`,
    transport: new DefaultChatTransport({
      api: "/api/ai/chat",
      prepareSendMessagesRequest: ({ messages: current, body, trigger }) => ({
        body: {
          threadId: threadRef.current,
          provider: body?.provider ?? providerRef.current,
          model: modelRef.current,
          trigger,
          messages: current.slice(-1),
        },
      }),
    }),
    onFinish: () => {
      window.setTimeout(() => void refreshThreads().catch(() => {}), 250);
    },
  });
  const { messages, setMessages, sendMessage, stop, error, status: chatStatus } = chat;
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
    stop();
    try {
      const response = await fetch(`/api/ai/threads/${id}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load conversation");
      const data = (await response.json()) as { thread: ChatThread & { messages: UIMessage[] } };
      if (selection !== selectionRef.current) return;
      setActiveThreadId(id);
      const nextProvider = (["openai", "google", "anthropic", "opencode"] as string[]).includes(
        data.thread.provider,
      )
        ? (data.thread.provider as Provider)
        : "openai";
      setProvider(nextProvider);
      setModel(
        chatModels.some(
          (candidate) => candidate.id === data.thread.model && candidate.provider === nextProvider,
        )
          ? (data.thread.model as ChatModel)
          : defaultModel[nextProvider],
      );
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
    if (!activeThreadId || threadLoading || chatStatus !== "ready" || !status?.[provider]) {
      setNotice(`Add your ${provider} API key in Settings → Model keys to chat.`);
      return;
    }
    setNotice("");
    void sendMessage({ text }, { body: { provider } });
  }
  function chooseProvider(value: Provider) {
    setProvider(value);
    setModel(defaultModel[value]);
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
    if (!open && !onChatPage) return;
    fetch("/api/ai/keys", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load key settings");
        return response.json() as Promise<Status>;
      })
      .then((value) => {
        setStatus(value);
        if (!value[providerRef.current]) {
          const first = (["google", "openai", "anthropic", "opencode"] as Provider[]).find(
            (candidate) => value[candidate],
          );
          if (first) chooseProvider(first);
        }
      })
      .catch(() => setNotice("Could not load provider settings. Please retry."));
  }, [open, onChatPage]);
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

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || chatStatus !== "ready" || !status?.[provider] || !activeThreadId || threadLoading)
      return;
    setInput("");
    sendPrompt(text);
  }

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
          setModel,
          threads,
          activeThreadId,
          threadLoading,
          newThread,
          selectThread,
          deleteThread,
          renameThread,
          shareTranscript,
          sendPrompt,
          status,
          clear,
          notice,
          error: error?.message,
        }}
      >
        {children}
        {!privateMode && !onChatPage && !open && (
          <Button
            type="button"
            className="fixed bottom-5 right-4 z-40 h-12 gap-2 rounded-full px-4 shadow-lg"
            onClick={() => setOpen(true)}
            aria-label="Open Selvam assistant"
          >
            <MessageCircleIcon className="size-5" /> Ask Selvam
          </Button>
        )}
        {!privateMode && !onChatPage && open && (
          <section
            role="dialog"
            aria-label="Selvam assistant"
            aria-modal="false"
            className="fixed inset-0 z-50 flex flex-col border bg-background shadow-2xl sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[min(700px,calc(100dvh-80px))] sm:w-[min(440px,calc(100vw-40px))] sm:rounded-xl"
          >
            <header className="flex shrink-0 items-center gap-2 border-b px-4 py-3">
              <MessageCircleIcon className="size-5" />
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
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
              {messages.length === 0 && (
                <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                  Ask about your portfolio, FIRE plan, household budget or verified returns. Figures
                  are read from Selvam when you ask.
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-lg px-3 py-2 text-sm ${message.role === "user" ? "ml-8 bg-primary text-primary-foreground" : "mr-4 border bg-card"}`}
                >
                  {message.parts.map((part, index) =>
                    part.type === "text" ? (
                      <div
                        key={index}
                        className="prose prose-sm max-w-none break-words dark:prose-invert [&_p]:my-1 [&_ul]:my-1"
                      >
                        <Markdown
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
              <p role="alert" className="border-t px-4 py-2 text-xs text-destructive">
                {notice || error?.message}
              </p>
            )}
            <form
              onSubmit={submit}
              className="flex shrink-0 items-center gap-2 border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            >
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                maxLength={2000}
                disabled={!status?.[provider] || !activeThreadId || threadLoading}
                placeholder={
                  status?.[provider] ? "Ask about your finances…" : "Set up a model key in Settings"
                }
                aria-label="Message"
                className="min-w-0 flex-1"
              />
              {chatStatus === "ready" ? (
                <Button
                  type="submit"
                  size="icon"
                  disabled={
                    !input.trim() || !status?.[provider] || !activeThreadId || threadLoading
                  }
                  aria-label="Send message"
                >
                  <SendIcon />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={stop}
                  aria-label="Stop response"
                >
                  <SquareIcon />
                </Button>
              )}
            </form>
          </section>
        )}
      </ChatContext.Provider>
    </AssistantRuntimeProvider>
  );
}
