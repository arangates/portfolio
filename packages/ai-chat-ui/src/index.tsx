"use client";

import { Button } from "@portfolio/ui/components/button";
import { cn } from "@portfolio/ui/lib/utils";
import {
  BrainCircuitIcon,
  MenuIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PlusIcon,
  Share2Icon,
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
  return (
    <select
      aria-label="AI model"
      value={`${provider}:${model}`}
      onChange={(event) => {
        const separator = event.target.value.indexOf(":");
        onChange(event.target.value.slice(0, separator), event.target.value.slice(separator + 1));
      }}
      className="h-9 min-w-0 max-w-64 rounded-lg border bg-background px-2.5 text-base font-medium transition-colors duration-200 md:text-sm"
    >
      {models.map((candidate) => (
        <option
          key={`${candidate.provider}:${candidate.id}`}
          value={`${candidate.provider}:${candidate.id}`}
        >
          {candidate.label} {providerStatus?.[candidate.provider] ? "\u2713" : ""}
        </option>
      ))}
    </select>
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
