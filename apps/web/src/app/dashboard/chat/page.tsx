"use client";

import { useSelvamChat } from "@/components/global-ai-chat";
import {
  ActionBarPrimitive,
  AuiIf,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from "@assistant-ui/react";
import { Button } from "@portfolio/ui/components/button";
import {
  BrainCircuitIcon,
  CopyIcon,
  KeyRoundIcon,
  MenuIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PlusIcon,
  RefreshCwIcon,
  SendIcon,
  Share2Icon,
  ShieldCheckIcon,
  SquareIcon,
  Trash2Icon,
} from "lucide-react";
import Markdown from "react-markdown";
import { useState } from "react";

function ChatMessage({ role }: { role: "user" | "assistant" }) {
  return (
    <MessagePrimitive.Root
      className={`mx-auto flex w-full max-w-3xl gap-3 px-4 py-4 ${role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`min-w-0 max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${role === "user" ? "bg-primary text-primary-foreground" : "border bg-card shadow-sm"}`}
      >
        <MessagePrimitive.Parts
          components={{
            Text: ({ text }) => (
              <div className="prose prose-sm max-w-none break-words dark:prose-invert [&_p]:my-1 [&_ul]:my-1">
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
                  {text}
                </Markdown>
              </div>
            ),
          }}
        />
        {role === "assistant" && (
          <ActionBarPrimitive.Root
            hideWhenRunning
            className="mt-2 flex items-center gap-2 border-t pt-2 text-muted-foreground"
          >
            <ActionBarPrimitive.Copy
              aria-label="Copy response"
              className="rounded p-1 hover:bg-accent"
            >
              <CopyIcon className="size-3.5" />
            </ActionBarPrimitive.Copy>
            <ActionBarPrimitive.Reload
              aria-label="Regenerate response"
              className="rounded p-1 hover:bg-accent"
            >
              <RefreshCwIcon className="size-3.5" />
            </ActionBarPrimitive.Reload>
          </ActionBarPrimitive.Root>
        )}
      </div>
    </MessagePrimitive.Root>
  );
}

function UserMessage() {
  return <ChatMessage role="user" />;
}
function AssistantMessage() {
  return <ChatMessage role="assistant" />;
}

export default function ChatPage() {
  const chat = useSelvamChat();
  const [historyOpen, setHistoryOpen] = useState(true);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  return (
    <div className="flex h-[calc(100dvh-6.5rem)] min-h-0 flex-col overflow-hidden md:h-[calc(100dvh-3rem)]">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b px-4 py-3 lg:px-6">
        <Button
          size="icon-sm"
          variant="ghost"
          className="md:hidden"
          onClick={() => setMobileHistoryOpen(true)}
          aria-label="Open chat history"
        >
          <MenuIcon />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          className="hidden md:inline-flex"
          onClick={() => setHistoryOpen(!historyOpen)}
          aria-label={historyOpen ? "Hide chat history" : "Show chat history"}
        >
          {historyOpen ? <PanelLeftCloseIcon /> : <PanelLeftOpenIcon />}
        </Button>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="rounded-xl border bg-primary/10 p-2 text-primary">
            <BrainCircuitIcon className="size-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold">Ask Selvam</h1>
            <p className="text-xs text-muted-foreground">
              Your financial research assistant · current account data
            </p>
          </div>
        </div>
        <select
          aria-label="AI model"
          value={chat.model}
          onChange={(event) => {
            const model = event.target.value as typeof chat.model;
            chat.setProvider(model.startsWith("gemini-") ? "google" : "openai");
            chat.setModel(model);
          }}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="gpt-4.1-mini">GPT-4.1 mini {chat.status?.openai ? "✓" : ""}</option>
          <option value="gpt-5.4-mini">GPT-5.4 mini {chat.status?.openai ? "✓" : ""}</option>
          <option value="gemini-2.5-flash">
            Gemini 2.5 Flash {chat.status?.google ? "✓" : ""}
          </option>
          <option value="gemini-2.5-pro">Gemini 2.5 Pro {chat.status?.google ? "✓" : ""}</option>
        </select>
        <Button size="sm" variant="outline" onClick={() => chat.setSettings(!chat.settings)}>
          <KeyRoundIcon /> Keys
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void chat.shareTranscript()}
          disabled={!chat.activeThreadId}
        >
          <Share2Icon />
          <span className="hidden sm:inline">Share</span>
        </Button>
        <Button size="sm" variant="outline" onClick={chat.clear}>
          <PlusIcon /> New chat
        </Button>
      </div>
      {chat.settings && chat.keySettings}
      {(chat.notice || chat.error) && (
        <p role="alert" className="border-b px-4 py-2 text-sm text-destructive">
          {chat.notice || chat.error}
        </p>
      )}
      <div className="relative flex min-h-0 flex-1">
        {mobileHistoryOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setMobileHistoryOpen(false)}
            aria-label="Close chat history"
          />
        )}
        <aside
          aria-label="Conversation history"
          className={`${mobileHistoryOpen ? "flex" : "hidden"} fixed inset-y-0 left-0 z-50 w-72 flex-col border-r bg-background pt-12 shadow-xl md:static md:z-auto md:pt-0 md:shadow-none ${historyOpen ? "md:flex" : "md:hidden"}`}
        >
          <div className="flex items-center justify-between border-b p-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Conversations
            </span>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => {
                void chat.newThread();
                setMobileHistoryOpen(false);
              }}
              aria-label="New conversation"
            >
              <PlusIcon />
            </Button>
          </div>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
            {chat.threads.map((thread) => (
              <div
                key={thread.id}
                className={`group flex items-center rounded-lg text-sm ${thread.id === chat.activeThreadId ? "bg-accent" : "hover:bg-muted"}`}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate px-3 py-2.5 text-left"
                  onClick={() => {
                    void chat.selectThread(thread.id);
                    setMobileHistoryOpen(false);
                  }}
                >
                  {thread.title}
                </button>
                <button
                  type="button"
                  className="mr-1 rounded p-1.5 text-muted-foreground hover:text-foreground"
                  aria-label={`Rename ${thread.title}`}
                  onClick={() => {
                    const title = window.prompt("Conversation title", thread.title)?.trim();
                    if (title) void chat.renameThread(thread.id, title);
                  }}
                >
                  ✎
                </button>
                <button
                  type="button"
                  className="mr-1 rounded p-1.5 text-muted-foreground hover:text-destructive"
                  aria-label={`Delete ${thread.title}`}
                  onClick={() => {
                    if (window.confirm(`Delete “${thread.title}”? This cannot be undone.`))
                      void chat.deleteThread(thread.id);
                  }}
                >
                  <Trash2Icon className="size-3.5" />
                </button>
              </div>
            ))}
            {chat.threads.length === 0 && (
              <p className="px-3 py-4 text-xs text-muted-foreground">No saved conversations yet.</p>
            )}
          </div>
        </aside>
        <ThreadPrimitive.Root className="flex min-h-0 min-w-0 flex-1 flex-col">
          <ThreadPrimitive.Viewport className="min-h-0 flex-1 overflow-y-auto" autoScroll>
            <AuiIf condition={(state) => state.thread.isEmpty}>
              <div className="mx-auto flex max-w-2xl flex-col items-center px-5 py-12 text-center sm:py-20">
                <div className="mb-5 rounded-2xl border bg-primary/10 p-4 text-primary">
                  <BrainCircuitIcon className="size-8" />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Understand your money, clearly.
                </h2>
                <p className="mt-3 max-w-lg text-sm text-muted-foreground">
                  Ask about your portfolio, returns, cash flow, household spending or FIRE plan.
                  Selvam reads the latest data in your account before answering.
                </p>
                <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheckIcon className="size-4" /> Read-only access · figures from your
                  records
                </div>
                <div className="mt-8 grid w-full gap-2 sm:grid-cols-2">
                  {[
                    "How much of my portfolio is liquid?",
                    "How does my FIRE plan compare with current assets?",
                    "What were my verified investment returns?",
                    "Where did household spending go?",
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="rounded-xl border bg-card p-3 text-left text-sm hover:bg-accent"
                      onClick={() => chat.sendPrompt(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </AuiIf>
            <ThreadPrimitive.Messages components={{ UserMessage, AssistantMessage }} />
            <ThreadPrimitive.ViewportFooter className="sticky bottom-0 border-t bg-background/95 px-4 py-4 backdrop-blur">
              <div className="mx-auto max-w-3xl">
                <ThreadPrimitive.ScrollToBottom className="mb-2 ml-auto block rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground disabled:hidden">
                  Scroll to latest
                </ThreadPrimitive.ScrollToBottom>
                {chat.status?.[chat.provider] ? (
                  <ComposerPrimitive.Root className="flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-sm">
                    <ComposerPrimitive.Input
                      maxLength={2000}
                      disabled={!chat.activeThreadId || chat.threadLoading}
                      placeholder="Ask a question about your finances…"
                      className="max-h-40 min-h-11 min-w-0 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none"
                    />
                    <AuiIf condition={(state) => !state.thread.isRunning}>
                      <ComposerPrimitive.Send
                        disabled={!chat.activeThreadId || chat.threadLoading}
                        aria-label="Send message"
                        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
                      >
                        <SendIcon className="size-4" />
                      </ComposerPrimitive.Send>
                    </AuiIf>
                    <AuiIf condition={(state) => state.thread.isRunning}>
                      <ComposerPrimitive.Cancel
                        aria-label="Stop response"
                        className="flex size-10 shrink-0 items-center justify-center rounded-xl border"
                      >
                        <SquareIcon className="size-4" />
                      </ComposerPrimitive.Cancel>
                    </AuiIf>
                  </ComposerPrimitive.Root>
                ) : (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => chat.setSettings(true)}
                  >
                    <KeyRoundIcon /> Add an API key to start chatting
                  </Button>
                )}
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  AI can make mistakes. Verify decisions against the linked source records.
                </p>
              </div>
            </ThreadPrimitive.ViewportFooter>
          </ThreadPrimitive.Viewport>
        </ThreadPrimitive.Root>
      </div>
    </div>
  );
}
