"use client";

import { useSelvamChat } from "@/components/global-ai-chat";
import { chatModels } from "@/lib/ai-models";
import {
  ActionBarPrimitive,
  AuiIf,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  groupPartByType,
} from "@assistant-ui/react";
import { Button } from "@portfolio/ui/components/button";
import {
  BrainCircuitIcon,
  CopyIcon,
  DownloadIcon,
  CheckCircle2Icon,
  KeyRoundIcon,
  MenuIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PlusIcon,
  RefreshCwIcon,
  LoaderCircleIcon,
  SendIcon,
  Share2Icon,
  ShieldCheckIcon,
  SquareIcon,
  Trash2Icon,
} from "lucide-react";
import Markdown from "react-markdown";
import { useState } from "react";
import Link from "next/link";

function ReasoningSummary({ text }: { text: string }) {
  return (
    <details className="my-2 rounded-lg border bg-muted/25 px-3 py-2 text-xs text-muted-foreground">
      <summary className="cursor-pointer select-none font-medium text-foreground">
        Reasoning summary
      </summary>
      <p className="mt-2 whitespace-pre-wrap leading-relaxed">{text}</p>
    </details>
  );
}

function FinancialToolStatus({ toolName, status }: { toolName: string; status: { type: string } }) {
  const running = status.type === "running" || status.type === "requires-action";
  return (
    <div className="my-2 flex items-center gap-2 rounded-lg border bg-muted/25 px-3 py-2 text-xs text-muted-foreground">
      {running ? (
        <LoaderCircleIcon className="size-3.5 animate-spin" />
      ) : (
        <CheckCircle2Icon className="size-3.5 text-emerald-500" />
      )}
      <span>
        {running ? "Checking" : "Checked"}{" "}
        {toolName === "getFinancialSection" ? "your latest Selvam records" : toolName}
      </span>
    </div>
  );
}

function ChatMessage({ role }: { role: "user" | "assistant" }) {
  return (
    <MessagePrimitive.Root
      data-role={role}
      className={`fade-in slide-in-from-bottom-1 animate-in mx-auto flex w-full max-w-4xl gap-3 px-4 py-5 ${role === "user" ? "justify-end" : "justify-start"} duration-150`}
    >
      <div
        className={`min-w-0 text-sm leading-relaxed ${role === "user" ? "max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-primary-foreground" : "w-full max-w-3xl px-1 py-2"}`}
      >
        <MessagePrimitive.GroupedParts
          groupBy={groupPartByType({
            reasoning: ["group-chainOfThought", "group-reasoning"],
            "tool-call": ["group-chainOfThought", "group-tool"],
            "standalone-tool-call": [],
          })}
        >
          {({ part, children }) => {
            switch (part.type) {
              case "group-chainOfThought":
                return <div data-slot="aui_chain-of-thought">{children}</div>;
              case "group-tool":
                return (
                  <div className="my-2 flex items-center gap-2 rounded-lg border bg-muted/25 px-3 py-2 text-xs text-muted-foreground">
                    {children}
                  </div>
                );
              case "group-reasoning": {
                const running = part.status.type === "running";
                return running ? (
                  <details className="my-2 rounded-lg border bg-muted/25 px-3 py-2 text-xs text-muted-foreground open">
                    <summary className="cursor-pointer select-none font-medium text-foreground">
                      Reasoning summary
                    </summary>
                    <p className="mt-2 whitespace-pre-wrap leading-relaxed">{children}</p>
                  </details>
                ) : (
                  <details className="my-2 rounded-lg border bg-muted/25 px-3 py-2 text-xs text-muted-foreground">
                    <summary className="cursor-pointer select-none font-medium text-foreground">
                      Reasoning summary
                    </summary>
                    <p className="mt-2 whitespace-pre-wrap leading-relaxed">{children}</p>
                  </details>
                );
              }
              case "text":
                return (
                  <div className="prose prose-sm max-w-none break-words dark:prose-invert [&_p]:my-1 [&_ul]:my-1 [&_pre]:my-1">
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
                        table: ({ children, ...props }) => (
                          <div className="border-foreground/10 my-3 overflow-x-auto rounded-document border">
                            <table
                              className="w-full border-separate border-spacing-0 text-[13px]"
                              {...props}
                            >
                              {children}
                            </table>
                          </div>
                        ),
                        th: ({ children, ...props }) => (
                          <th
                            className="border-foreground/10 border-b px-3 py-1.5 text-start font-medium [[align=center]]:text-center [[align=right]]:text-right"
                            {...props}
                          >
                            {children}
                          </th>
                        ),
                        td: ({ children, ...props }) => (
                          <td
                            className="border-foreground/10 border-b px-3 py-1.5 text-start [[align=center]]:text-center [[align=right]]:text-right"
                            {...props}
                          >
                            {children}
                          </td>
                        ),
                        tr: ({ children, ...props }) => (
                          <tr className="m-0 p-0" {...props}>
                            {children}
                          </tr>
                        ),
                        pre: ({ children, ...props }) => (
                          <pre
                            className="border-border/50 bg-muted/30 overflow-x-auto rounded-xl border p-3.5 text-[13px] leading-relaxed"
                            {...props}
                          >
                            {children}
                          </pre>
                        ),
                        code: ({ children, ...props }) => (
                          <code
                            className="bg-muted rounded-md px-1.5 py-0.5 font-mono text-[0.85em]"
                            {...props}
                          >
                            {children}
                          </code>
                        ),
                      }}
                    >
                      {part.text}
                    </Markdown>
                  </div>
                );
              case "reasoning":
                return <ReasoningSummary text={part.text} />;
              case "tool-call":
                return <FinancialToolStatus toolName={part.toolName} status={part.status} />;
              default:
                return null;
            }
          }}
        </MessagePrimitive.GroupedParts>
        <MessagePrimitive.Error>
          <ErrorPrimitive.Root className="mt-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-destructive">
            <ErrorPrimitive.Message />
          </ErrorPrimitive.Root>
        </MessagePrimitive.Error>
        {role === "assistant" && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-muted-foreground">
            <ActionBarPrimitive.Root hideWhenRunning className="flex items-center gap-2">
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
              <ActionBarPrimitive.ExportMarkdown
                aria-label="Download response as Markdown"
                className="rounded p-1 hover:bg-accent"
              >
                <DownloadIcon className="size-3.5" />
              </ActionBarPrimitive.ExportMarkdown>
            </ActionBarPrimitive.Root>
          </div>
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

function ModelSelector({ chat }: { chat: ReturnType<typeof useSelvamChat> }) {
  return (
    <select
      aria-label="AI model"
      value={chat.model}
      onChange={(event) => {
        const model = event.target.value as typeof chat.model;
        chat.setProvider(
          chatModels.find((candidate) => candidate.id === model)?.provider ?? "openai",
        );
        chat.setModel(model);
      }}
      className="h-9 min-w-0 max-w-64 rounded-lg border bg-background px-2.5 text-base font-medium md:text-sm"
    >
      {chatModels.map((candidate) => (
        <option key={`${candidate.provider}:${candidate.id}`} value={candidate.id}>
          {candidate.label} {chat.status?.[candidate.provider] ? "✓" : ""}
        </option>
      ))}
    </select>
  );
}

function ChatComposer({ chat }: { chat: ReturnType<typeof useSelvamChat> }) {
  return chat.status?.[chat.provider] ? (
    <ComposerPrimitive.Root className="flex flex-col rounded-2xl border bg-card p-2 shadow-sm">
      <ComposerPrimitive.Input
        maxLength={2000}
        disabled={!chat.activeThreadId || chat.threadLoading}
        placeholder="Send a message…"
        className="max-h-40 min-h-14 w-full resize-none bg-transparent px-3 py-2 text-base outline-none"
      />
      <div className="flex items-center gap-2 px-1 pb-1">
        <ModelSelector chat={chat} />
        <div className="ml-auto">
          <AuiIf condition={(state) => !state.thread.isRunning}>
            <ComposerPrimitive.Send
              disabled={!chat.activeThreadId || chat.threadLoading}
              aria-label="Send message"
              className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
            >
              <SendIcon className="size-4" />
            </ComposerPrimitive.Send>
          </AuiIf>
          <AuiIf condition={(state) => state.thread.isRunning}>
            <ComposerPrimitive.Cancel
              aria-label="Stop response"
              className="flex size-10 items-center justify-center rounded-xl border"
            >
              <SquareIcon className="size-4" />
            </ComposerPrimitive.Cancel>
          </AuiIf>
        </div>
      </div>
    </ComposerPrimitive.Root>
  ) : (
    <Button
      className="w-full"
      variant="outline"
      render={<Link href="/dashboard/settings?tab=model-keys" />}
    >
      <KeyRoundIcon /> Add an API key to start chatting
    </Button>
  );
}

export default function ChatPage() {
  const chat = useSelvamChat();
  const [historyOpen, setHistoryOpen] = useState(true);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);

  const isNewChatView = (state: any) =>
    state.thread.messages.length === 0 && (!state.thread.isLoading || state.threads.isLoading);

  return (
    <div className="flex h-[calc(100dvh-var(--header-height)-env(safe-area-inset-top))] min-h-0 min-w-0 flex-col overflow-hidden bg-muted/10">
      <div className="flex shrink-0 flex-col gap-3 border-b bg-background/95 px-3 py-3 backdrop-blur sm:flex-row sm:items-center sm:px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-2">
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
            <div className="rounded-xl bg-primary p-2 text-primary-foreground shadow-sm">
              <BrainCircuitIcon className="size-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold">Ask Selvam</h1>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Your financial research assistant · current account data
              </p>
            </div>
          </div>
          <Button
            size="icon-sm"
            variant="ghost"
            className="sm:hidden"
            onClick={chat.clear}
            aria-label="New chat"
          >
            <PlusIcon />
          </Button>
        </div>
        <div className="flex min-w-0 items-center gap-2 sm:justify-end">
          <Button
            size="icon-sm"
            variant="outline"
            render={<Link href="/dashboard/settings?tab=model-keys" />}
            aria-label="Model key settings"
          >
            <KeyRoundIcon />
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
          <Button
            size="sm"
            variant="outline"
            onClick={chat.clear}
            className="hidden sm:inline-flex"
          >
            <PlusIcon /> New chat
          </Button>
        </div>
      </div>

      {chat.notice && (
        <div
          role="alert"
          className="flex items-center gap-2 border-b px-4 py-2 text-sm text-destructive"
        >
          <span className="min-w-0 flex-1">{chat.notice}</span>
        </div>
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
          className={`${mobileHistoryOpen ? "flex" : "hidden"} fixed inset-y-0 left-0 z-50 w-[min(20rem,85vw)] flex-col border-r bg-background pt-[max(3rem,env(safe-area-inset-top))] shadow-xl md:static md:z-auto md:w-72 md:bg-muted/15 md:pt-0 md:shadow-none ${historyOpen ? "md:flex" : "md:hidden"}`}
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
                    if (window.confirm(`Delete "${thread.title}"? This cannot be undone.`))
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
          <ThreadPrimitive.Viewport
            turnAnchor="top"
            className="relative flex flex-1 flex-col overflow-x-auto overflow-y-scroll scroll-smooth px-4 pt-4"
          >
            <AuiIf condition={isNewChatView}>
              <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col items-center justify-center px-5 py-10 text-center">
                <h2 className="text-2xl font-medium tracking-tight sm:text-3xl">
                  How can I help you today?
                </h2>
                <div className="mt-8 w-full max-w-3xl text-left">
                  <ChatComposer chat={chat} />
                </div>
                <div className="mt-5 flex max-w-3xl flex-wrap justify-center gap-2">
                  {[
                    "How much of my portfolio is liquid?",
                    "How does my FIRE plan compare with current assets?",
                    "What were my verified investment returns?",
                    "Where did household spending go?",
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="rounded-xl border bg-card px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                      onClick={() => chat.sendPrompt(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
                <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheckIcon className="size-4" /> Read-only access · figures from your
                  records
                </div>
              </div>
            </AuiIf>

            <div data-slot="aui_message-group" className="mb-14 flex flex-col gap-y-6 empty:hidden">
              <ThreadPrimitive.Messages components={{ UserMessage, AssistantMessage }} />
            </div>

            <ThreadPrimitive.ViewportFooter className="sticky bottom-0 bg-gradient-to-t from-background via-background/95 to-transparent px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-8 sm:px-4 sm:pb-4">
              <div className="mx-auto max-w-3xl">
                <AuiIf condition={(state) => state.thread.isRunning}>
                  <div
                    className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"
                    role="status"
                  >
                    <LoaderCircleIcon className="size-3.5 animate-spin" />
                    Reading your current records and preparing an answer…
                  </div>
                </AuiIf>
                <ThreadPrimitive.ScrollToBottom className="mb-2 ml-auto block rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground disabled:hidden">
                  Scroll to latest
                </ThreadPrimitive.ScrollToBottom>
                <AuiIf condition={(state) => !state.thread.isEmpty}>
                  <ChatComposer chat={chat} />
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    AI can make mistakes. Verify decisions against the linked source records.
                  </p>
                </AuiIf>
              </div>
            </ThreadPrimitive.ViewportFooter>
          </ThreadPrimitive.Viewport>
        </ThreadPrimitive.Root>
      </div>
    </div>
  );
}
