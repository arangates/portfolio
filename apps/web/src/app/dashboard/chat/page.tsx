"use client";

import { useFinancialPrivacy } from "@/components/dashboard-experience";
import { MarkdownText, DirectiveText } from "@/components/assistant-ui";
import { type ChatModel, type ChatProvider } from "@/lib/ai-models";
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
import { LexicalComposerInput, type DirectiveChipProps } from "@assistant-ui/react-lexical";
import { Button } from "@portfolio/ui/components/button";
import { Skeleton } from "@portfolio/ui/components/skeleton";
import { buttonVariants } from "@portfolio/ui/components/button";
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
  MenuIcon,
  MoreHorizontalIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PlusIcon,
  RefreshCwIcon,
  SendIcon,
  Share2Icon,
  ShieldCheckIcon,
  SquareIcon,
  Trash2Icon,
  WrenchIcon,
} from "lucide-react";
import Link from "next/link";
import { useState, type FC, type ReactNode, memo } from "react";
import { useSelvamChat } from "@/components/global-ai-chat";

// ============================================================================
// Types and Constants
// ============================================================================

type SuggestionGroup = {
  label: string;
  icon: ReactNode;
  options: { label: string; prompt: string }[];
};

const SUGGESTION_GROUPS: SuggestionGroup[] = [
  {
    label: "Portfolio",
    icon: <BrainCircuitIcon className="size-4" />,
    options: [
      {
        label: "What's my current portfolio value?",
        prompt: "What is my current portfolio value?",
      },
      { label: "How much is liquid?", prompt: "How much of my portfolio is liquid?" },
      { label: "Show asset allocation", prompt: "Show my asset allocation breakdown" },
    ],
  },
  {
    label: "FIRE Plan",
    icon: <ShieldCheckIcon className="size-4" />,
    options: [
      {
        label: "Compare with assets",
        prompt: "How does my FIRE plan compare with current assets?",
      },
      { label: "Am I on track?", prompt: "Am I on track for financial independence?" },
      {
        label: "What's my FIRE number?",
        prompt: "What is my FIRE number based on current spending?",
      },
    ],
  },
  {
    label: "Investments",
    icon: <ArrowUpIcon className="size-4" />,
    options: [
      { label: "Verified returns", prompt: "What were my verified investment returns?" },
      { label: "Mutual fund performance", prompt: "Show my mutual fund performance" },
      { label: "Equity analysis", prompt: "Analyze my equity portfolio performance" },
    ],
  },
  {
    label: "Spending",
    icon: <ArrowDownIcon className="size-4" />,
    options: [
      { label: "Where did it go?", prompt: "Where did household spending go?" },
      { label: "Monthly trends", prompt: "Show my monthly spending trends" },
      { label: "Budget analysis", prompt: "Analyze my household budget" },
    ],
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

// ============================================================================
// Thread Title Component
// ============================================================================

const ThreadTitle: FC = () => {
  const chat = useSelvamChat();
  const activeThread = chat.threads.find((t) => t.id === chat.activeThreadId);
  return (
    <span className="min-w-0 truncate text-sm font-medium">
      {activeThread?.title ?? "New Chat"}
    </span>
  );
};

// ============================================================================
// Workspace Controls
// ============================================================================

const WorkspaceControls: FC<{
  historyOpen: boolean;
  onToggleHistory: () => void;
  onOpenMobileHistory: () => void;
}> = ({ historyOpen, onToggleHistory, onOpenMobileHistory }) => {
  const chat = useSelvamChat();

  return (
    <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex items-start justify-between gap-3 sm:inset-x-5">
      <div className="pointer-events-auto flex min-w-0 items-center gap-2 rounded-2xl border bg-background/90 px-2 py-1.5 shadow-sm backdrop-blur-md">
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          onClick={onOpenMobileHistory}
          aria-label="Open chat history"
        >
          <MenuIcon className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="hidden md:inline-flex"
          onClick={onToggleHistory}
          aria-label={historyOpen ? "Hide chat history" : "Show chat history"}
        >
          {historyOpen ? <PanelLeftCloseIcon /> : <PanelLeftOpenIcon />}
        </Button>
        <div className="flex min-w-0 items-center gap-2 border-l pl-2">
          <BrainCircuitIcon className="size-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <ThreadTitle />
            <p className="hidden truncate text-[11px] text-muted-foreground sm:block">
              Financial research assistant
            </p>
          </div>
        </div>
      </div>
      <div className="pointer-events-auto flex shrink-0 items-center gap-1 rounded-2xl border bg-background/90 p-1 shadow-sm backdrop-blur-md">
        <Link
          href="/dashboard/settings?tab=model-keys"
          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
          aria-label="Model key settings"
          title="Model key settings"
        >
          <KeyRoundIcon />
        </Link>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => void chat.shareTranscript()}
          aria-label="Share transcript"
          title="Share transcript"
        >
          <Share2Icon />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={chat.clear}
          aria-label="Start a new chat"
          title="Start a new chat"
        >
          <PlusIcon />
        </Button>
      </div>
    </div>
  );
};

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
  return (
    <div className="mx-auto mb-6 flex w-full max-w-4xl flex-col items-center justify-center px-5 py-10 text-center">
      <h2 className="fade-in slide-in-from-bottom-1 animate-in fill-mode-both text-2xl font-medium tracking-tight duration-200 sm:text-3xl">
        How can I help you today?
      </h2>
      <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheckIcon className="size-4" /> Read-only access &middot; figures from your records
      </div>
    </div>
  );
};

// ============================================================================
// Thread Suggestions Component
// ============================================================================

const suggestionChipClass =
  "rounded-xl border bg-card px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground";

const ThreadSuggestions: FC = () => {
  const chat = useSelvamChat();
  const [expandedLabel, setExpandedLabel] = useState<string | null>(null);
  const expandedGroup = SUGGESTION_GROUPS.find((group) => group.label === expandedLabel);

  const sendPrompt = (prompt: string) => {
    if (chat.threadLoading) return;
    chat.sendPrompt(prompt);
  };

  return (
    <div className="flex w-full flex-col gap-2 px-4">
      <div className="w-full scrollbar-none overflow-x-auto">
        <div className="mx-auto flex w-max items-center gap-2">
          {SUGGESTION_GROUPS.map((group) => (
            <Button
              key={group.label}
              variant="ghost"
              className={cn(suggestionChipClass, group.label === expandedLabel && "bg-muted")}
              onClick={() => setExpandedLabel(group.label === expandedLabel ? null : group.label)}
            >
              {group.icon}
              {group.label}
            </Button>
          ))}
        </div>
      </div>
      {expandedGroup && (
        <div
          key={expandedGroup.label}
          className="fade-in slide-in-from-top-1 animate-in w-full scrollbar-none overflow-x-auto duration-200"
        >
          <div className="mx-auto flex w-max items-center gap-2">
            {expandedGroup.options.map((option) => (
              <Button
                key={option.label}
                variant="ghost"
                className={suggestionChipClass}
                onClick={() => sendPrompt(option.prompt)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Model Selector Component
// ============================================================================

const ModelSelector: FC = () => {
  const chat = useSelvamChat();

  return (
    <select
      aria-label="AI model"
      value={`${chat.provider}:${chat.model}`}
      onChange={(event) => {
        const separator = event.target.value.indexOf(":");
        const provider = event.target.value.slice(0, separator) as ChatProvider;
        const model = event.target.value.slice(separator + 1) as ChatModel;
        chat.setProvider(provider);
        chat.setModel(model);
      }}
      className="h-9 min-w-0 max-w-64 rounded-lg border bg-background px-2.5 text-base font-medium md:text-sm"
    >
      {chat.models.map((candidate) => (
        <option
          key={`${candidate.provider}:${candidate.id}`}
          value={`${candidate.provider}:${candidate.id}`}
        >
          {candidate.label} {chat.status?.[candidate.provider as ChatProvider] ? "\u2713" : ""}
        </option>
      ))}
    </select>
  );
};

// ============================================================================
// Directive Chip Component
// ============================================================================

const DirectiveChip = memo(function DirectiveChip(props: DirectiveChipProps) {
  const { directiveId, directiveType, label } = props;
  const showWrench = directiveType !== "command";
  return (
    <span
      className="aui-directive-chip inline-flex items-baseline gap-1 rounded-md bg-blue-100 px-1.5 py-0.5 text-[13px] leading-none font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
      data-directive-type={directiveType}
      data-directive-id={directiveId}
    >
      {showWrench && (
        <span className="aui-directive-chip-icon self-center">
          <WrenchIcon className="size-3" />
        </span>
      )}
      <span className="aui-directive-chip-label">{label}</span>
    </span>
  );
});

// ============================================================================
// Financial Tool Status - Custom for Selvam
// ============================================================================

function FinancialToolStatus({ toolName, status }: { toolName: string; status: { type: string } }) {
  const running = status.type === "running" || status.type === "requires-action";
  return (
    <div className="my-2 flex items-center gap-2 rounded-lg border bg-muted/25 px-3 py-2 text-xs text-muted-foreground">
      {running ? (
        <div className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <CheckIcon className="size-3.5 text-emerald-500" />
      )}
      <span>
        {running ? "Checking" : "Checked"}{" "}
        {toolName === "getFinancialSection" ? "your latest Selvam records" : toolName}
      </span>
    </div>
  );
}

// ============================================================================
// Composer Component
// ============================================================================

const Composer: FC = () => {
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
    <ComposerPrimitive.Root className="relative flex w-full flex-col">
      <ComposerPrimitive.AttachmentDropzone asChild>
        <div
          data-slot="aui_composer-shell"
          className="border-foreground/10 focus-within:border-foreground/25 data-[dragging=true]:border-ring flex w-full cursor-text flex-col gap-2 rounded-2xl border bg-card p-2 shadow-sm transition-[border-color] data-[dragging=true]:border-dashed data-[dragging=true]:bg-[color-mix(in_oklab,var(--color-accent)_50%,var(--color-background))]"
        >
          <LexicalComposerInput
            directiveChip={DirectiveChip}
            placeholder="Send a message..."
            className="relative max-h-40 min-h-10 w-full resize-none bg-transparent px-3 py-2 text-base outline-none [&_.aui-lexical-placeholder]:text-muted-foreground/60 [&_.aui-directive-chip]:inline-flex [&_.aui-directive-chip]:items-baseline [&_.aui-directive-chip]:gap-1 [&_.aui-directive-chip]:rounded-md [&_.aui-directive-chip]:bg-blue-100 [&_.aui-directive-chip]:px-1.5 [&_.aui-directive-chip]:py-0.5 [&_.aui-directive-chip]:text-[13px] [&_.aui-directive-chip]:leading-none [&_.aui-directive-chip]:font-medium [&_.aui-directive-chip]:text-blue-700 dark:[&_.aui-directive-chip]:bg-blue-900/50 dark:[&_.aui-directive-chip]:text-blue-300 [&_.aui-directive-chip-icon]:self-center [&_.aui-lexical-input]:min-h-lh [&_.aui-lexical-input]:outline-none [&_.aui-lexical-placeholder]:pointer-events-none [&_.aui-lexical-placeholder]:absolute [&_.aui-lexical-placeholder]:top-0 [&_.aui-lexical-placeholder]:right-0 [&_.aui-lexical-placeholder]:left-0 [&_.aui-lexical-placeholder]:truncate [&_.aui-lexical-placeholder]:px-3 [&_.aui-lexical-placeholder]:py-2"
          />
          <ComposerAction />
        </div>
      </ComposerPrimitive.AttachmentDropzone>
    </ComposerPrimitive.Root>
  );
};

const ComposerAction: FC = () => {
  const chat = useSelvamChat();

  return (
    <div className="relative flex items-center justify-between px-1 pb-1">
      <div className="flex items-center gap-1">
        <ModelSelector />
      </div>
      <div className="flex items-center gap-1.5">
        <AuiIf condition={(s) => !s.thread.isRunning}>
          <ComposerPrimitive.Send
            disabled={!chat.activeThreadId || chat.threadLoading}
            aria-label="Send message"
            className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
          >
            <SendIcon className="size-4" />
          </ComposerPrimitive.Send>
        </AuiIf>
        <AuiIf condition={(s) => s.thread.isRunning}>
          <ComposerPrimitive.Cancel
            aria-label="Stop response"
            className="flex size-10 items-center justify-center rounded-xl border"
          >
            <SquareIcon className="size-4" />
          </ComposerPrimitive.Cancel>
        </AuiIf>
      </div>
    </div>
  );
};

// ============================================================================
// Thread Scroll to Bottom
// ============================================================================

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom className="mb-2 ml-auto block rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground disabled:hidden">
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

const AssistantMessage: FC = () => {
  return (
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
                return <MarkdownText />;
              case "reasoning":
                return (
                  <details className="my-2 rounded-lg border bg-muted/25 px-3 py-2 text-xs text-muted-foreground">
                    <summary className="cursor-pointer select-none font-medium text-foreground">
                      Reasoning summary
                    </summary>
                    <p className="mt-2 whitespace-pre-wrap leading-relaxed">{part.text}</p>
                  </details>
                );
              case "tool-call":
                return <FinancialToolStatus toolName={part.toolName} status={part.status} />;
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
};

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
            components={{ Text: ({ text }) => <DirectiveText>{text}</DirectiveText> }}
          />
        </div>
      </div>

      <BranchPicker
        data-slot="aui_user-branch-picker"
        className="col-span-full col-start-1 -mr-1 justify-end"
      />
    </MessagePrimitive.Root>
  );
};

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
      className="bg-background @container flex h-full min-w-0 w-full flex-1 flex-col transition-opacity duration-200"
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
          "relative flex min-w-0 flex-1 flex-col overflow-x-auto overflow-y-scroll scroll-smooth px-4 pt-20 sm:pt-24",
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
              if (message.composer.isEditing) return null; // Edit mode not implemented yet
              if (message.role === "user") return <UserMessage />;
              return <AssistantMessage />;
            }}
          </ThreadPrimitive.Messages>
        </div>

        <ThreadPrimitive.ViewportFooter
          className={cn(
            "mx-auto flex w-full max-w-4xl flex-col gap-4 overflow-visible pb-4 md:pb-6",
            !isEmpty && "sticky bottom-0 mt-auto rounded-t-2xl",
          )}
        >
          <ThreadScrollToBottom />
          <AuiIf condition={(s) => s.thread.isRunning}>
            <div className="flex items-center gap-2 text-xs text-muted-foreground" role="status">
              <div className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Reading your current records and preparing an answer...
            </div>
          </AuiIf>
          <Composer />
          <AuiIf condition={isNewChatView}>
            <div className="min-h-19">
              <AuiIf condition={(s) => s.composer.isEmpty}>
                <ThreadSuggestions />
              </AuiIf>
            </div>
          </AuiIf>
          <AuiIf condition={(s) => !s.thread.isEmpty && !s.thread.isRunning}>
            <p className="text-center text-xs text-muted-foreground">
              AI can make mistakes. Verify decisions against the linked source records.
            </p>
          </AuiIf>
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>
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
                  \u270E
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
        <div className="relative min-w-0 w-full flex-1 transition-[width,opacity] duration-200">
          <WorkspaceControls
            historyOpen={historyOpen}
            onToggleHistory={() => setHistoryOpen(!historyOpen)}
            onOpenMobileHistory={() => setMobileHistoryOpen(true)}
          />
          <Thread />
        </div>
      </div>
    </div>
  );
}
