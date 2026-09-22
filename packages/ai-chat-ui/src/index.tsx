"use client";

import { Button } from "@portfolio/ui/components/button";
import { cn } from "@portfolio/ui/lib/utils";
import {
  AuiIf,
  ComposerPrimitive,
  unstable_useMentionAdapter,
  unstable_useSlashCommandAdapter,
  type Unstable_SlashCommand,
} from "@assistant-ui/react";
import {
  ArrowUpIcon,
  BrainCircuitIcon,
  CheckIcon,
  ChevronDownIcon,
  MicIcon,
  MenuIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PlusIcon,
  Share2Icon,
  SquareIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

export type ChatModelOption = {
  id: string;
  label: string;
  provider: string;
};

export type ChatSuggestionGroup = {
  label: string;
  icon: ReactNode;
  options: { label: string; prompt: string }[];
};

export type ChatMention = {
  id: string;
  label: string;
  type: string;
};

export type ChatCommand = Unstable_SlashCommand;

export function ChatWorkspaceControls({
  title,
  historyOpen,
  settingsAction,
  onToggleHistory,
  onOpenMobileHistory,
  onShare,
  onNewChat,
}: {
  title: string;
  historyOpen: boolean;
  settingsAction: ReactNode;
  onToggleHistory: () => void;
  onOpenMobileHistory: () => void;
  onShare: () => void;
  onNewChat: () => void;
}) {
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
            <span className="block min-w-0 truncate text-sm font-medium">{title}</span>
            <p className="hidden truncate text-[11px] text-muted-foreground sm:block">
              Financial research assistant
            </p>
          </div>
        </div>
      </div>
      <div className="pointer-events-auto flex shrink-0 items-center gap-1 rounded-2xl border bg-background/90 p-1 shadow-sm backdrop-blur-md">
        {settingsAction}
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={onShare}
          aria-label="Share transcript"
          title="Share transcript"
        >
          <Share2Icon />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={onNewChat}
          aria-label="Start a new chat"
          title="Start a new chat"
        >
          <PlusIcon />
        </Button>
      </div>
    </div>
  );
}

export function ChatModelSelector({
  provider,
  model,
  models,
  providerStatus,
  onChange,
}: {
  provider: string;
  model: string;
  models: ChatModelOption[];
  providerStatus: Record<string, boolean> | null;
  onChange: (provider: string, model: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = models.find(
    (candidate) => candidate.provider === provider && candidate.id === model,
  );

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        className="h-9 max-w-64 gap-2 rounded-full px-3 font-medium"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Choose AI model"
      >
        <span className="size-5 shrink-0 rounded-full bg-muted text-center text-[11px] leading-5">
          {(selected?.label ?? model).slice(0, 1).toUpperCase()}
        </span>
        <span className="truncate">{selected?.label ?? model}</span>
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </Button>
      {open && (
        <div
          role="listbox"
          aria-label="Available AI models"
          className="absolute bottom-full left-0 z-50 mb-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border bg-popover p-1.5 text-popover-foreground shadow-xl"
        >
          {models.map((candidate) => {
            const active = candidate.provider === provider && candidate.id === model;
            return (
              <button
                key={`${candidate.provider}:${candidate.id}`}
                type="button"
                role="option"
                aria-selected={active}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent",
                  active && "bg-accent",
                )}
                onClick={() => {
                  onChange(candidate.provider, candidate.id);
                  setOpen(false);
                }}
              >
                <span className="size-6 shrink-0 rounded-full bg-muted text-center text-xs leading-6">
                  {candidate.label.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1 truncate">{candidate.label}</span>
                {providerStatus?.[candidate.provider] && <CheckIcon className="size-4" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ChatComposer({
  modelSelector,
  mentions = [],
  commands = [],
}: {
  modelSelector: ReactNode;
  mentions?: ChatMention[];
  commands?: ChatCommand[];
}) {
  const mention = unstable_useMentionAdapter({ items: mentions });
  const slash = unstable_useSlashCommandAdapter({ commands });

  return (
    <ComposerPrimitive.Unstable_TriggerPopoverRoot>
      <ComposerPrimitive.Unstable_TriggerPopover char="@" adapter={mention.adapter}>
        <ComposerPrimitive.Unstable_TriggerPopover.Directive
          formatter={mention.directive.formatter}
          onInserted={mention.directive.onInserted}
        />
        <ComposerPrimitive.Unstable_TriggerPopoverItems>
          {(items) => (
            <div className="absolute bottom-full z-50 mb-2 w-72 overflow-hidden rounded-2xl border bg-popover p-1.5 shadow-xl">
              {items.map((item, index) => (
                <ComposerPrimitive.Unstable_TriggerPopoverItem
                  key={item.id}
                  item={item}
                  index={index}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm outline-none data-[highlighted]:bg-accent"
                >
                  <span className="size-6 shrink-0 rounded-full bg-muted text-center text-xs leading-6">
                    {item.label.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                </ComposerPrimitive.Unstable_TriggerPopoverItem>
              ))}
            </div>
          )}
        </ComposerPrimitive.Unstable_TriggerPopoverItems>
      </ComposerPrimitive.Unstable_TriggerPopover>
      <ComposerPrimitive.Unstable_TriggerPopover char="/" adapter={slash.adapter}>
        <ComposerPrimitive.Unstable_TriggerPopover.Action {...slash.action} />
        <ComposerPrimitive.Unstable_TriggerPopoverItems>
          {(items) => (
            <div className="absolute bottom-full left-0 z-50 mb-2 w-80 overflow-hidden rounded-2xl border bg-popover p-1.5 shadow-xl">
              {items.map((item, index) => (
                <ComposerPrimitive.Unstable_TriggerPopoverItem
                  key={item.id}
                  item={item}
                  index={index}
                  className="flex w-full flex-col items-start rounded-xl px-3 py-2.5 text-left outline-none data-[highlighted]:bg-accent"
                >
                  <span className="font-medium">/{item.label}</span>
                  {item.description && (
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  )}
                </ComposerPrimitive.Unstable_TriggerPopoverItem>
              ))}
            </div>
          )}
        </ComposerPrimitive.Unstable_TriggerPopoverItems>
      </ComposerPrimitive.Unstable_TriggerPopover>
      <ComposerPrimitive.Root className="relative flex w-full flex-col gap-2 rounded-3xl border bg-card p-2.5 shadow-sm transition-shadow focus-within:shadow-md">
        <ComposerPrimitive.Attachments>
          {({ attachment }) => (
            <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-xs">
              <span className="min-w-0 flex-1 truncate">{attachment.name}</span>
            </div>
          )}
        </ComposerPrimitive.Attachments>
        <ComposerPrimitive.Input
          placeholder="Message, or @ to mention / for commands..."
          rows={1}
          className="min-h-11 w-full resize-none bg-transparent px-3 py-2 text-base outline-none placeholder:text-muted-foreground"
        />
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex min-w-0 items-center gap-1">
            <ComposerPrimitive.AddAttachment
              aria-label="Add attachment"
              className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <PlusIcon className="size-4" />
            </ComposerPrimitive.AddAttachment>
            {modelSelector}
          </div>
          <div className="flex items-center gap-1">
            <ComposerPrimitive.Dictate
              aria-label="Use voice input"
              className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <MicIcon className="size-4" />
            </ComposerPrimitive.Dictate>
            <AuiIf condition={(state) => !state.thread.isRunning}>
              <ComposerPrimitive.Send
                aria-label="Send message"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
              >
                <ArrowUpIcon className="size-4" />
              </ComposerPrimitive.Send>
            </AuiIf>
            <AuiIf condition={(state) => state.thread.isRunning}>
              <ComposerPrimitive.Cancel
                aria-label="Stop generating"
                className="grid size-9 shrink-0 place-items-center rounded-full border"
              >
                <SquareIcon className="size-3" />
              </ComposerPrimitive.Cancel>
            </AuiIf>
          </div>
        </div>
      </ComposerPrimitive.Root>
    </ComposerPrimitive.Unstable_TriggerPopoverRoot>
  );
}

const suggestionChipClass =
  "rounded-xl border bg-card px-3 py-2 text-sm text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground";

export function ChatSuggestions({
  groups,
  onSelect,
}: {
  groups: ChatSuggestionGroup[];
  onSelect: (prompt: string) => void;
}) {
  const [expandedLabel, setExpandedLabel] = useState<string | null>(null);
  const expandedGroup = groups.find((group) => group.label === expandedLabel);

  return (
    <div className="flex w-full flex-col gap-2 px-4">
      <div className="w-full overflow-x-auto scrollbar-none">
        <div className="mx-auto flex w-max items-center gap-2">
          {groups.map((group) => (
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
        <div className="fade-in slide-in-from-top-1 animate-in w-full overflow-x-auto scrollbar-none duration-200">
          <div className="mx-auto flex w-max items-center gap-2">
            {expandedGroup.options.map((option) => (
              <Button
                key={option.label}
                variant="ghost"
                className={suggestionChipClass}
                onClick={() => onSelect(option.prompt)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
