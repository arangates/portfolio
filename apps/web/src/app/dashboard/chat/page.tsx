"use client";

import { useFinancialPrivacy } from "@/components/dashboard-experience";
import { MarkdownText, DirectiveText } from "@/components/assistant-ui";
import {
  FileChip,
  ReasoningBlock,
  SourceChip,
  ToolCard,
} from "@/components/assistant-ui/chat-parts";
import {
  ChatSuggestions,
  ChatWorkspaceControls,
  type ChatSuggestionGroup,
} from "@portfolio/ai-chat-ui";
import {
  ActionBarMorePrimitive,
  ActionBarPrimitive,
  AuiIf,
  BranchPickerPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  groupPartByType,
  useAuiState,
  type AssistantState,
} from "@assistant-ui/react";
import { Button } from "@portfolio/ui/components/button";
import { Skeleton } from "@portfolio/ui/components/skeleton";
import { buttonVariants } from "@portfolio/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@portfolio/ui/components/dropdown-menu";
import { cn } from "@portfolio/ui/lib/utils";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BrainCircuitIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  KeyRoundIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, type FC } from "react";
import { SelvamComposer, useSelvamChat } from "@/components/global-ai-chat";
import { Checkbox } from "@portfolio/ui/components/checkbox";

// ============================================================================
// Types and Constants
// ============================================================================

const SUGGESTION_GROUPS: ChatSuggestionGroup[] = [
  {
    label: "Portfolio",
    icon: <BrainCircuitIcon className="size-4" />,
    options: [
      {
        label: "Portfolio value",
        prompt: "What is my current portfolio value?",
      },
      { label: "Liquid assets", prompt: "How much of my portfolio is liquid?" },
      { label: "Asset allocation", prompt: "Show my asset allocation breakdown" },
    ],
  },
  {
    label: "FIRE Plan",
    icon: <ShieldCheckIcon className="size-4" />,
    options: [
      { label: "Am I on track?", prompt: "Am I on track for financial independence?" },
      {
        label: "My FIRE number",
        prompt: "What is my FIRE number based on current spending?",
      },
    ],
  },
  {
    label: "Investments",
    icon: <ArrowUpIcon className="size-4" />,
    options: [{ label: "Verified returns", prompt: "What were my verified investment returns?" }],
  },
  {
    label: "Spending",
    icon: <ArrowDownIcon className="size-4" />,
    options: [{ label: "Monthly spending", prompt: "Show my monthly spending trends" }],
  },
];

// ============================================================================
// State Checks
// ============================================================================

const isNewChatView = (s: AssistantState) =>
  s.thread.messages.length === 0 && (!s.thread.isLoading || s.threads.isLoading);

const isHistoryLoadingView = (s: AssistantState) =>
  s.thread.messages.length === 0 &&
  s.thread.isLoading &&
  !s.thread.isDisabled &&
  !s.threads.isLoading;

function formatThreadDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(
    new Date(value),
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

const ThreadHistorySkeleton: FC = () => (
  <div
    data-slot="aui_thread-history-skeleton"
    role="status"
    className="animate-in fade-in fill-mode-both mx-auto flex w-full max-w-4xl flex-col gap-y-6 [animation-delay:150ms] [animation-duration:200ms]"
  >
    <span className="sr-only">Loading conversation</span>
    <Skeleton className="ml-auto h-9 w-2/5 rounded-xl motion-reduce:animate-none" />
    <div className="flex flex-col gap-y-2">
      <Skeleton className="h-4 w-11/12 motion-reduce:animate-none" />
      <Skeleton className="h-4 w-4/5 motion-reduce:animate-none" />
      <Skeleton className="h-4 w-3/5 motion-reduce:animate-none" />
    </div>
    <Skeleton className="ml-auto h-9 w-1/3 rounded-xl motion-reduce:animate-none" />
    <div className="flex flex-col gap-y-2">
      <Skeleton className="h-4 w-10/12 motion-reduce:animate-none" />
      <Skeleton className="h-4 w-2/3 motion-reduce:animate-none" />
    </div>
  </div>
);

// ============================================================================
// Thread Welcome Component
// ============================================================================

const ThreadWelcome: FC = () => {
  const chat = useSelvamChat();

  return (
    <div className="mx-auto flex w-full max-w-[38rem] flex-col items-center px-4 py-6 text-center sm:px-6">
      <h2 className="text-balance text-xl font-medium tracking-tight sm:text-2xl">
        How can I help you today?
      </h2>
      <div className="mt-6 w-full">
        <SelvamComposer />
      </div>
      <div className="mt-3 w-full">
        <ChatSuggestions
          groups={SUGGESTION_GROUPS}
          onSelect={(prompt) => {
            if (!chat.threadLoading) chat.sendPrompt(prompt);
          }}
        />
      </div>
    </div>
  );
};

// ============================================================================
// Thread Scroll to Bottom
// ============================================================================

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom className="absolute -top-12 right-1 z-10 grid min-h-10 place-items-center rounded-full border bg-card px-3 py-2 text-xs text-muted-foreground disabled:hidden">
      Scroll to latest
    </ThreadPrimitive.ScrollToBottom>
  );
};

// ============================================================================
// Message Error Component
// ============================================================================

const MessageError: FC = () => {
  return (
    <MessagePrimitive.Error>
      <ErrorPrimitive.Root className="mt-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-destructive">
        <ErrorPrimitive.Message />
      </ErrorPrimitive.Root>
    </MessagePrimitive.Error>
  );
};

// ============================================================================
// Assistant Working Indicator
// ============================================================================

const AssistantWorkingIndicator: FC = () => {
  const isEmpty = useAuiState((s) => s.message.content.length === 0);

  if (isEmpty) {
    return (
      <span
        data-slot="aui_assistant-message-indicator"
        className="text-muted-foreground inline-flex items-center gap-2 align-middle"
      >
        <div className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <span className="text-sm">Reading your current records...</span>
      </span>
    );
  }

  return (
    <span
      data-slot="aui_assistant-message-indicator"
      className="animate-pulse font-sans"
      aria-label="Assistant is working"
    >
      {"\u25C6"}
    </span>
  );
};

// ============================================================================
// Assistant Message Component
// ============================================================================

const ACTION_BAR_PT = "pt-1.5";
const ACTION_BAR_HEIGHT = `-mb-7.5 min-h-7.5 ${ACTION_BAR_PT}`;

const AssistantMessage: FC = () => (
  <MessagePrimitive.Root
    data-slot="aui_assistant-message-root"
    data-role="assistant"
    className="fade-in slide-in-from-bottom-1 animate-in relative mx-auto w-full max-w-4xl duration-150"
  >
    <div
      data-slot="aui_assistant-message-content"
      className="text-foreground px-2 leading-relaxed wrap-break-word"
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
            case "group-reasoning":
              return <>{children}</>;
            case "text":
              return <MarkdownText />;
            case "reasoning":
              return <ReasoningBlock text={part.text} running={part.status.type === "running"} />;
            case "tool-call":
              return <ToolCard part={part} />;
            case "source":
              return <SourceChip id={part.id} url={part.url} title={part.title} />;
            case "file":
              return <FileChip name={part.filename} mimeType={part.mimeType} data={part.data} />;
            case "indicator":
              return <AssistantWorkingIndicator />;
            case "data":
              return part.dataRendererUI;
            default:
              return null;
          }
        }}
      </MessagePrimitive.GroupedParts>
      <MessageError />
    </div>
    <div
      data-slot="aui_assistant-message-footer"
      className={cn("ml-2 flex items-center", ACTION_BAR_HEIGHT)}
    >
      <BranchPicker />
      <AssistantActionBar />
    </div>
  </MessagePrimitive.Root>
);

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="text-muted-foreground animate-in fade-in col-start-3 row-start-2 -ml-1 flex gap-1 duration-200"
    >
      <ActionBarPrimitive.Copy asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Copy">
          <AuiIf condition={(s) => s.message.isCopied}>
            <CheckIcon className="size-3.5" />
          </AuiIf>
          <AuiIf condition={(s) => !s.message.isCopied}>
            <CopyIcon className="size-3.5" />
          </AuiIf>
        </Button>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Refresh">
          <RefreshCwIcon className="size-3.5" />
        </Button>
      </ActionBarPrimitive.Reload>
      <ActionBarMorePrimitive.Root>
        <ActionBarMorePrimitive.Trigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="More"
            className="data-[state=open]:bg-accent"
          >
            <MoreHorizontalIcon className="size-3.5" />
          </Button>
        </ActionBarMorePrimitive.Trigger>
        <ActionBarMorePrimitive.Content
          side="bottom"
          align="start"
          sideOffset={6}
          className="bg-popover text-popover-foreground data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:animate-out data-[side=bottom]:slide-in-from-top-2 z-50 min-w-[8rem] overflow-hidden rounded-xl border p-1.5"
        >
          <ActionBarPrimitive.ExportMarkdown asChild>
            <ActionBarMorePrimitive.Item className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground">
              <DownloadIcon className="size-4" />
              Export as Markdown
            </ActionBarMorePrimitive.Item>
          </ActionBarPrimitive.ExportMarkdown>
        </ActionBarMorePrimitive.Content>
      </ActionBarMorePrimitive.Root>
    </ActionBarPrimitive.Root>
  );
};

// ============================================================================
// User Message Component
// ============================================================================

const UserMessage: FC = () => {
  const chat = useSelvamChat();

  return (
    <MessagePrimitive.Root
      data-slot="aui_user-message-root"
      data-role="user"
      className="fade-in slide-in-from-bottom-1 animate-in mx-auto w-full max-w-4xl grid auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] content-start gap-y-2 px-2 duration-150 [&:where(>*)]:col-start-2"
    >
      <div className="aui-user-message-content-wrapper relative col-start-2 min-w-0">
        <div className="aui-user-message-content peer bg-primary text-primary-foreground rounded-2xl px-4 py-2 wrap-break-word empty:hidden">
          <MessagePrimitive.Quote>
            {(quote) => (
              <blockquote className="border-muted-foreground/30 text-muted-foreground my-1 border-s-2 ps-3 text-sm">
                {quote.text}
              </blockquote>
            )}
          </MessagePrimitive.Quote>
          <MessagePrimitive.Parts
            components={{
              Text: ({ text }) => <DirectiveText>{text}</DirectiveText>,
              File: ({ filename, mimeType, data }) => (
                <div className="my-1">
                  <FileChip name={filename} mimeType={mimeType} data={data} />
                </div>
              ),
              Image: ({ image, filename }) => (
                <div className="my-1">
                  <FileChip name={filename} mimeType="image/*" data={image} />
                </div>
              ),
            }}
          />
        </div>
      </div>

      <div className="col-span-full col-start-1 flex min-h-10 items-center justify-between px-1">
        <BranchPicker data-slot="aui_user-branch-picker" />
        {chat.status?.[chat.provider] && (
          <ActionBarPrimitive.Root className="flex items-center">
            <ActionBarPrimitive.Edit asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-10"
                aria-label="Edit message"
                title="Edit message"
              >
                <PencilIcon />
              </Button>
            </ActionBarPrimitive.Edit>
          </ActionBarPrimitive.Root>
        )}
      </div>
    </MessagePrimitive.Root>
  );
};

const UserEditComposer: FC = () => (
  <MessagePrimitive.Root
    data-slot="aui_user-message-edit"
    className="mx-auto w-full max-w-4xl px-2"
  >
    <ComposerPrimitive.Root className="flex flex-col gap-2 rounded-2xl border bg-background p-3 shadow-sm focus-within:border-ring/60">
      <ComposerPrimitive.Input
        aria-label="Edit your message"
        rows={3}
        className="min-h-20 w-full resize-y bg-transparent px-2 py-1 text-base leading-relaxed outline-none"
      />
      <div className="flex justify-end gap-2">
        <ComposerPrimitive.Cancel asChild>
          <Button variant="ghost" size="sm">
            Cancel
          </Button>
        </ComposerPrimitive.Cancel>
        <ComposerPrimitive.Send asChild>
          <Button size="sm">Update and retry</Button>
        </ComposerPrimitive.Send>
      </div>
    </ComposerPrimitive.Root>
  </MessagePrimitive.Root>
);

// ============================================================================
// Branch Picker Component
// ============================================================================

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({ className, ...rest }) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn("text-muted-foreground mr-2 -ml-2 inline-flex items-center text-xs", className)}
      {...rest}
    >
      <BranchPickerPrimitive.Previous asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Previous">
          <ChevronLeftIcon className="size-3.5" />
        </Button>
      </BranchPickerPrimitive.Previous>
      <span className="font-medium">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Next">
          <ChevronRightIcon className="size-3.5" />
        </Button>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};

// ============================================================================
// Main Thread Component
// ============================================================================

const Thread: FC = () => {
  const isEmpty = useAuiState(isNewChatView);

  return (
    <ThreadPrimitive.Root
      className="bg-background @container flex min-h-0 min-w-0 w-full flex-1 flex-col transition-opacity duration-200"
      style={{
        ["--thread-max-width" as string]: "44rem",
        ["--composer-bg" as string]: "color-mix(in oklab, var(--color-muted) 30%, transparent)",
        ["--composer-radius" as string]: "var(--radius-thread)",
        ["--composer-padding" as string]: "8px",
      }}
    >
      <ThreadPrimitive.Viewport
        turnAnchor="top"
        data-slot="aui_thread-viewport"
        className={cn(
          "relative flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-scroll scroll-smooth px-4 py-6 sm:px-6",
          isEmpty && "justify-center",
        )}
      >
        <AuiIf condition={isNewChatView}>
          <ThreadWelcome />
        </AuiIf>
        <AuiIf condition={isHistoryLoadingView}>
          <ThreadHistorySkeleton />
        </AuiIf>

        <div data-slot="aui_message-group" className="mb-14 flex flex-col gap-y-6 empty:hidden">
          <ThreadPrimitive.Messages>
            {({ message }) => {
              if (message.composer.isEditing) return <UserEditComposer />;
              if (message.role === "user") return <UserMessage />;
              return <AssistantMessage />;
            }}
          </ThreadPrimitive.Messages>
          <AuiIf condition={(s) => !s.thread.isEmpty && !s.thread.isRunning}>
            <p className="px-2 text-center text-xs text-muted-foreground">
              AI can make mistakes. Verify decisions against the linked source records.
            </p>
          </AuiIf>
        </div>
      </ThreadPrimitive.Viewport>
      <AuiIf condition={(s) => !isNewChatView(s)}>
        <div className="relative z-10 shrink-0 border-t bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-3">
            <ThreadScrollToBottom />
            <AuiIf condition={(s) => s.thread.isRunning}>
              <div className="flex items-center gap-2 text-xs text-muted-foreground" role="status">
                <div className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Reading your current records and preparing an answer...
              </div>
            </AuiIf>
            <SelvamComposer />
          </div>
        </div>
      </AuiIf>
    </ThreadPrimitive.Root>
  );
};

// ============================================================================
// Main Chat Page Component
// ============================================================================

export default function ChatPage() {
  const chat = useSelvamChat();
  const privateMode = useFinancialPrivacy();
  const [historyOpen, setHistoryOpen] = useState(true);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [historyQuery, setHistoryQuery] = useState("");
  const [selectedThreadIds, setSelectedThreadIds] = useState<Set<string>>(new Set());
  const allThreadsSelected =
    chat.threads.length > 0 && selectedThreadIds.size === chat.threads.length;
  const visibleThreads = chat.threads.filter((thread) =>
    thread.title.toLocaleLowerCase().includes(historyQuery.trim().toLocaleLowerCase()),
  );

  // Keyboard shortcuts for chat
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isMeta = event.metaKey || event.ctrlKey;

      // ⌘+Shift+N: New thread
      if (isMeta && event.shiftKey && event.key === "N") {
        event.preventDefault();
        chat.clear();
        return;
      }

      // Escape: Close mobile history panel
      if (event.key === "Escape" && mobileHistoryOpen) {
        event.preventDefault();
        setMobileHistoryOpen(false);
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [chat, mobileHistoryOpen]);

  function toggleThreadSelection(id: string) {
    setSelectedThreadIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllThreads() {
    setSelectedThreadIds(
      allThreadsSelected ? new Set() : new Set(chat.threads.map((thread) => thread.id)),
    );
  }

  function deleteSelectedThreads() {
    if (!selectedThreadIds.size) return;
    if (
      !window.confirm(
        `Delete ${selectedThreadIds.size} conversation${selectedThreadIds.size === 1 ? "" : "s"}? This cannot be undone.`,
      )
    )
      return;
    const ids = [...selectedThreadIds];
    setSelectedThreadIds(new Set());
    void chat.deleteThreads(ids);
  }

  function deleteAllThreads() {
    if (!chat.threads.length) return;
    if (!window.confirm("Delete all conversations? This cannot be undone.")) return;
    setSelectedThreadIds(new Set());
    void chat.deleteThreads();
  }

  // Sync with global chat state
  if (privateMode) {
    return (
      <div className="flex h-[calc(100dvh-var(--header-height)-env(safe-area-inset-top))] flex-col items-center justify-center">
        <p className="text-muted-foreground">Chat is disabled in private mode</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-var(--header-height)-env(safe-area-inset-top))] min-h-0 min-w-0 flex-col overflow-hidden bg-muted/10">
      {chat.notice && (
        <div
          role="alert"
          className="flex items-center gap-2 border-b px-4 py-2 text-sm text-destructive"
        >
          <span className="min-w-0 flex-1">{chat.notice}</span>
        </div>
      )}

      <div className="relative flex min-h-0 min-w-0 flex-1">
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
          <div className="flex flex-col gap-3 border-b p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-base font-semibold">Conversations</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {chat.threads.length} saved conversation{chat.threads.length === 1 ? "" : "s"}
                </p>
              </div>
              <Button
                size="icon-sm"
                variant="ghost"
                className="size-10"
                onClick={() => {
                  void chat.newThread();
                  setMobileHistoryOpen(false);
                }}
                aria-label="New conversation"
                title="New conversation"
              >
                <PlusIcon />
              </Button>
            </div>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={historyQuery}
                onChange={(event) => setHistoryQuery(event.target.value)}
                placeholder="Search conversations"
                aria-label="Search conversations"
                className="h-10 w-full rounded-lg border bg-muted/20 pr-3 pl-9 text-base outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 md:text-sm"
              />
            </div>
            <div className="flex items-center justify-between gap-2 text-xs">
              {chat.threads.length > 0 && (
                <div className="flex items-center gap-1">
                  <label className="flex items-center gap-1.5 text-muted-foreground">
                    <Checkbox checked={allThreadsSelected} onCheckedChange={toggleAllThreads} />
                    Select all
                  </label>
                </div>
              )}
            </div>
            {selectedThreadIds.size > 0 && (
              <div className="flex items-center gap-1 border-t pt-3">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                  disabled={!selectedThreadIds.size}
                  onClick={deleteSelectedThreads}
                >
                  <Trash2Icon /> Delete selected
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                  onClick={deleteAllThreads}
                >
                  Delete all
                </Button>
              </div>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {visibleThreads.map((thread) => (
              <div
                key={thread.id}
                className={`group flex min-h-16 items-center gap-1 border-b px-2 py-2 transition-colors ${thread.id === chat.activeThreadId ? "bg-accent/70" : "hover:bg-muted/50"}`}
              >
                <span className="grid size-10 shrink-0 place-items-center">
                  <Checkbox
                    checked={selectedThreadIds.has(thread.id)}
                    onCheckedChange={() => toggleThreadSelection(thread.id)}
                    aria-label={`Select ${thread.title}`}
                  />
                </span>
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-start justify-between gap-2 py-2 text-left"
                  onClick={() => {
                    void chat.selectThread(thread.id);
                    setMobileHistoryOpen(false);
                  }}
                >
                  <span
                    title={thread.title}
                    className="line-clamp-2 min-w-0 break-words text-sm leading-5 font-medium"
                  >
                    {thread.title}
                  </span>
                  <time
                    dateTime={thread.updatedAt}
                    className="hidden shrink-0 text-xs tabular-nums text-muted-foreground sm:block"
                  >
                    {formatThreadDate(thread.updatedAt)}
                  </time>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="size-10 shrink-0"
                        aria-label={`More actions for ${thread.title}`}
                      />
                    }
                  >
                    <MoreHorizontalIcon />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem
                      onClick={() => {
                        const title = window.prompt("Conversation title", thread.title)?.trim();
                        if (title) void chat.renameThread(thread.id, title);
                      }}
                    >
                      <PencilIcon /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => {
                        if (window.confirm(`Delete "${thread.title}"? This cannot be undone.`))
                          void chat.deleteThread(thread.id);
                      }}
                    >
                      <Trash2Icon /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
            {visibleThreads.length === 0 && (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {historyQuery ? "No conversations match this search." : "No conversations yet."}
                </p>
                {historyQuery ? (
                  <Button variant="ghost" size="sm" onClick={() => setHistoryQuery("")}>
                    Clear search
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => void chat.newThread()}>
                    <PlusIcon data-icon="inline-start" /> Start a conversation
                  </Button>
                )}
              </div>
            )}
          </div>
        </aside>
        <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col transition-[width,opacity] duration-200">
          <ChatWorkspaceControls
            title={
              chat.threads.find((thread) => thread.id === chat.activeThreadId)?.title ?? "New chat"
            }
            historyOpen={historyOpen}
            settingsAction={
              <Link
                href="/dashboard/settings?tab=model-keys"
                className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                aria-label="Model key settings"
                title="Model key settings"
              >
                <KeyRoundIcon />
              </Link>
            }
            onToggleHistory={() => setHistoryOpen(!historyOpen)}
            onOpenMobileHistory={() => setMobileHistoryOpen(true)}
            onShare={() => void chat.shareTranscript()}
            onNewChat={chat.clear}
          />
          <Thread />
        </div>
      </div>
    </div>
  );
}
