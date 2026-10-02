"use client";

import { Button } from "@portfolio/ui/components/button";
import { cn } from "@portfolio/ui/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@portfolio/ui/components/dropdown-menu";
import { AuiIf, ComposerPrimitive } from "@assistant-ui/react";
import {
  ArrowUpIcon,
  BrainCircuitIcon,
  MicIcon,
  SparklesIcon,
  MenuIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PlusIcon,
  CopyIcon,
  SquareIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

export type ChatSuggestionGroup = {
  label: string;
  icon: ReactNode;
  options: { label: string; prompt: string }[];
};

export type ChatCommand = {
  id: string;
  description: string;
  execute: () => void;
};

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
    <div className="relative z-10 flex min-h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-2 sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-10 md:hidden"
          onClick={onOpenMobileHistory}
          aria-label="Open chat history"
        >
          <MenuIcon className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="hidden size-10 md:inline-flex"
          onClick={onToggleHistory}
          aria-label={historyOpen ? "Hide chat history" : "Show chat history"}
        >
          {historyOpen ? <PanelLeftCloseIcon /> : <PanelLeftOpenIcon />}
        </Button>
        <div className="flex min-w-0 items-center gap-2 border-l pl-3">
          <BrainCircuitIcon className="size-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <span className="block min-w-0 truncate text-sm font-medium">{title}</span>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {settingsAction}
        <Button
          size="icon-sm"
          variant="ghost"
          className="size-10"
          onClick={onShare}
          aria-label="Copy transcript"
          title="Copy transcript"
        >
          <CopyIcon />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          className="size-10"
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

export function ChatComposer({
  modelSelector,
  commands = [],
}: {
  modelSelector: ReactNode;
  commands?: ChatCommand[];
}) {
  return (
    <ComposerPrimitive.Root className="relative flex w-full flex-col gap-2 rounded-[28px] border bg-background p-3 shadow-sm transition-shadow focus-within:border-ring/60 focus-within:shadow-md">
      <ComposerPrimitive.Input
        aria-label="Message Selvam"
        placeholder="Ask about your finances..."
        rows={1}
        className="min-h-11 w-full resize-none bg-transparent px-3 py-2 text-base outline-none placeholder:text-muted-foreground"
      />
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex min-w-0 items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 gap-2 rounded-full px-3"
                  aria-label="Quick prompts"
                />
              }
            >
              <SparklesIcon data-icon="inline-start" /> Prompts
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              side="top"
              className="w-[min(20rem,calc(100vw-2rem))]"
            >
              {commands.map((command) => (
                <DropdownMenuItem
                  key={command.id}
                  className="items-start py-2.5"
                  onClick={command.execute}
                >
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-medium">
                      {command.id.charAt(0).toUpperCase() +
                        command.id.slice(1).replaceAll("-", " ")}
                    </span>
                    <span className="text-xs text-muted-foreground">{command.description}</span>
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {modelSelector}
        </div>
        <div className="flex items-center gap-1">
          <ComposerPrimitive.Dictate
            aria-label="Use voice input"
            className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <MicIcon className="size-4" />
          </ComposerPrimitive.Dictate>
          <AuiIf condition={(state) => !state.thread.isRunning}>
            <ComposerPrimitive.Send
              aria-label="Send message"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
            >
              <ArrowUpIcon className="size-4" />
            </ComposerPrimitive.Send>
          </AuiIf>
          <AuiIf condition={(state) => state.thread.isRunning}>
            <ComposerPrimitive.Cancel
              aria-label="Stop generating"
              className="grid size-10 shrink-0 place-items-center rounded-full border"
            >
              <SquareIcon className="size-3" />
            </ComposerPrimitive.Cancel>
          </AuiIf>
        </div>
      </div>
    </ComposerPrimitive.Root>
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
