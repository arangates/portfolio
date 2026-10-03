"use client";

import { Button } from "@portfolio/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@portfolio/ui/components/dropdown-menu";
import { AttachmentPrimitive, AuiIf, ComposerPrimitive } from "@assistant-ui/react";
import {
  ArrowUpIcon,
  BrainCircuitIcon,
  MicIcon,
  MenuIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PaperclipIcon,
  PlusIcon,
  CopyIcon,
  XIcon,
  SquareIcon,
} from "lucide-react";
import type { ReactNode } from "react";

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
    <ComposerPrimitive.Root className="relative flex w-full flex-col gap-0.5 rounded-2xl border bg-card/70 px-2 py-1 shadow-sm transition-[border-color,box-shadow] focus-within:border-ring/60 focus-within:shadow-md">
      <ComposerPrimitive.Input
        aria-label="Message Selvam"
        placeholder="Send a message..."
        rows={1}
        className="min-h-8 w-full resize-none bg-transparent px-2 py-1 text-base outline-none placeholder:text-muted-foreground"
      />
      <AuiIf condition={(state) => state.composer.attachments.length > 0}>
        <div className="flex flex-wrap gap-1.5 px-1 pt-1">
          <ComposerPrimitive.Attachments>
            {() => (
              <AttachmentPrimitive.Root className="flex max-w-48 items-center gap-1.5 rounded-lg border bg-muted/40 py-1 pr-1 pl-2 text-xs">
                <PaperclipIcon
                  className="size-3 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="truncate">
                  <AttachmentPrimitive.Name />
                </span>
                <AttachmentPrimitive.Remove
                  aria-label="Remove attachment"
                  className="grid size-5 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <XIcon className="size-3" />
                </AttachmentPrimitive.Remove>
              </AttachmentPrimitive.Root>
            )}
          </ComposerPrimitive.Attachments>
        </div>
      </AuiIf>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1">
          <ComposerPrimitive.AddAttachment
            aria-label="Attach files"
            title="Attach images or PDFs"
            className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <PaperclipIcon className="size-4" />
          </ComposerPrimitive.AddAttachment>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="size-10 shrink-0 rounded-full"
                  aria-label="Quick prompts"
                  title="Quick prompts"
                />
              }
            >
              <PlusIcon />
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
          <div className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
            <BrainCircuitIcon className="size-4 shrink-0" aria-hidden="true" />
            {modelSelector}
          </div>
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
  "h-8 rounded-lg px-3 text-xs font-normal text-muted-foreground transition-colors duration-150 hover:text-foreground";

export function ChatSuggestions({
  groups,
  onSelect,
}: {
  groups: ChatSuggestionGroup[];
  onSelect: (prompt: string) => void;
}) {
  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-2">
      {groups.flatMap((group) =>
        group.options.map((option) => (
          <Button
            key={`${group.label}-${option.label}`}
            variant="outline"
            className={suggestionChipClass}
            onClick={() => onSelect(option.prompt)}
          >
            {option.label}
          </Button>
        )),
      )}
    </div>
  );
}
