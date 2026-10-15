"use client";

import { Button } from "@portfolio/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@portfolio/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@portfolio/ui/components/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@portfolio/ui/components/empty";
import { Input } from "@portfolio/ui/components/input";
import { cn } from "@portfolio/ui/lib/utils";
import { AttachmentPrimitive, AuiIf, ComposerPrimitive } from "@assistant-ui/react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@portfolio/ui/components/carousel";
import {
  ArrowUpRightIcon,
  ArrowUpIcon,
  BookOpenIcon,
  BrainCircuitIcon,
  MicIcon,
  MenuIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PaperclipIcon,
  PlusIcon,
  CopyIcon,
  SearchIcon,
  XIcon,
  SquareIcon,
} from "@portfolio/ui/components/icons";
import { useRef, useState, type ReactNode } from "react";

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
  onSaveToNotes,
}: {
  title: string;
  historyOpen: boolean;
  settingsAction: ReactNode;
  onToggleHistory: () => void;
  onOpenMobileHistory: () => void;
  onShare: () => void;
  onNewChat: () => void;
  onSaveToNotes?: () => void;
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
        {onSaveToNotes && (
          <Button
            size="icon-sm"
            variant="ghost"
            className="size-10 text-amber-600 hover:text-amber-700 hover:bg-amber-500/10 dark:text-amber-400"
            onClick={onSaveToNotes}
            aria-label="Save to Notes"
            title="Save conversation to Financial Notes"
          >
            <BookOpenIcon />
          </Button>
        )}
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
        rows={2}
        className="min-h-14 w-full resize-none bg-transparent px-3 py-2 text-base leading-relaxed outline-none placeholder:text-muted-foreground"
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

const suggestionCardTones = [
  {
    gradient: "from-violet-500/20 via-fuchsia-500/5 to-violet-500/25",
    glow: "hover:border-violet-400/50 hover:shadow-[0_0_0_1px_rgba(139,92,246,0.22),0_0_26px_rgba(139,92,246,0.18)]",
    icon: "text-violet-200 group-hover/prompt:shadow-[0_0_20px_rgba(139,92,246,0.45)]",
  },
  {
    gradient: "from-sky-500/20 via-blue-500/5 to-blue-500/25",
    glow: "hover:border-blue-400/50 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.22),0_0_26px_rgba(59,130,246,0.18)]",
    icon: "text-sky-200 group-hover/prompt:shadow-[0_0_20px_rgba(59,130,246,0.45)]",
  },
  {
    gradient: "from-emerald-500/20 via-teal-500/5 to-emerald-500/25",
    glow: "hover:border-emerald-400/50 hover:shadow-[0_0_0_1px_rgba(16,185,129,0.22),0_0_26px_rgba(16,185,129,0.18)]",
    icon: "text-emerald-200 group-hover/prompt:shadow-[0_0_20px_rgba(16,185,129,0.45)]",
  },
  {
    gradient: "from-amber-500/20 via-orange-500/5 to-amber-500/25",
    glow: "hover:border-amber-400/50 hover:shadow-[0_0_0_1px_rgba(245,158,11,0.22),0_0_26px_rgba(245,158,11,0.18)]",
    icon: "text-amber-200 group-hover/prompt:shadow-[0_0_20px_rgba(245,158,11,0.45)]",
  },
  {
    gradient: "from-rose-500/20 via-red-500/5 to-rose-500/25",
    glow: "hover:border-rose-400/50 hover:shadow-[0_0_0_1px_rgba(244,63,94,0.22),0_0_26px_rgba(244,63,94,0.18)]",
    icon: "text-rose-200 group-hover/prompt:shadow-[0_0_20px_rgba(244,63,94,0.45)]",
  },
];

export function ChatSuggestions({
  groups,
  onSelect,
}: {
  groups: ChatSuggestionGroup[];
  onSelect: (prompt: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All prompts");
  const [search, setSearch] = useState("");
  const resultsRef = useRef<HTMLElement>(null);
  const suggestions = groups.flatMap((group) =>
    group.options.map((option) => ({ ...option, category: group.label, icon: group.icon })),
  );
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filteredSuggestions = suggestions.filter((suggestion) => {
    const matchesCategory =
      activeCategory === "All prompts" || suggestion.category === activeCategory;
    const matchesSearch =
      !normalizedSearch ||
      (suggestion.label + " " + suggestion.prompt + " " + suggestion.category)
        .toLocaleLowerCase()
        .includes(normalizedSearch);
    return matchesCategory && matchesSearch;
  });

  const choosePrompt = (prompt: string) => {
    setOpen(false);
    onSelect(prompt);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setActiveCategory("All prompts");
          setSearch("");
        }
      }}
    >
      <Carousel
        opts={{ align: "start", loop: true, slidesToScroll: 1 }}
        aria-label="Suggested prompts"
        className="w-full"
      >
        <div className="mb-3 flex items-center gap-3 px-0.5 text-left">
          <DialogTrigger
            render={
              <button
                type="button"
                className="group/gallery relative flex min-h-[4.5rem] min-w-0 flex-1 items-center justify-between gap-3 overflow-hidden rounded-2xl border border-border/70 bg-card px-3 py-3 text-left outline-none transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-violet-400/45 hover:shadow-[0_0_0_1px_rgba(139,92,246,0.16),0_0_28px_rgba(139,92,246,0.12)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:px-4"
              />
            }
          >
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-transparent to-sky-500/10 opacity-80 transition-opacity duration-200 group-hover/gallery:opacity-100"
            />
            <span className="relative flex min-w-0 items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-violet-300/20 bg-violet-400/10 text-violet-200 shadow-[0_0_24px_rgba(139,92,246,0.12)]">
                <BrainCircuitIcon className="size-5" />
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-semibold text-foreground">Prompt gallery</span>
                <span className="truncate text-xs text-muted-foreground">
                  Browse thoughtful prompts from across your finances
                </span>
              </span>
            </span>
            <span className="relative flex shrink-0 items-center gap-2">
              <span className="hidden rounded-full border border-border/70 bg-background/50 px-2.5 py-1 text-xs font-medium tabular-nums text-muted-foreground sm:inline-flex">
                {suggestions.length} prompts
              </span>
              <ArrowUpRightIcon className="size-4 text-muted-foreground transition-[transform,color] duration-200 group-hover/gallery:-translate-y-0.5 group-hover/gallery:translate-x-0.5 group-hover/gallery:text-foreground motion-reduce:transition-none" />
            </span>
          </DialogTrigger>
          <div className="flex shrink-0 items-center gap-2">
            <CarouselPrevious
              aria-label="Previous suggested prompt"
              className="static size-9 translate-y-0 rounded-full border-border/70 bg-card/70 text-foreground hover:bg-accent"
            />
            <CarouselNext
              aria-label="Next suggested prompt"
              className="static size-9 translate-y-0 rounded-full border-border/70 bg-card/70 text-foreground hover:bg-accent"
            />
          </div>
        </div>
        <CarouselContent className="-ml-3 pb-3">
          {suggestions.map((suggestion, index) => {
            const tone = suggestionCardTones[index % suggestionCardTones.length]!;
            return (
              <CarouselItem
                key={suggestion.category + "-" + suggestion.label}
                className="basis-[86%] pl-3 sm:basis-1/2 lg:basis-1/3"
              >
                <button
                  type="button"
                  className={cn(
                    "group/prompt relative flex h-full min-h-40 w-full flex-col items-stretch justify-between overflow-hidden rounded-2xl border border-border/70 bg-card text-left outline-none transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
                    tone.glow,
                  )}
                  aria-label={"Ask Selvam: " + suggestion.prompt}
                  onClick={() => choosePrompt(suggestion.prompt)}
                >
                  <span
                    aria-hidden="true"
                    className={cn("absolute inset-0 bg-gradient-to-br", tone.gradient)}
                  />
                  <span
                    aria-hidden="true"
                    className="absolute -right-10 -bottom-16 size-44 rounded-full bg-white/10 blur-3xl transition-transform duration-300 group-hover/prompt:scale-125 motion-reduce:transition-none"
                  />
                  <span className="relative flex items-center justify-between gap-3 p-4 pb-0">
                    <span className="inline-flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "grid size-9 place-items-center rounded-xl border border-white/15 bg-white/5 text-foreground/90 transition-[box-shadow,color] duration-200",
                          tone.icon,
                        )}
                      >
                        {suggestion.icon}
                      </span>
                      {suggestion.category}
                    </span>
                    <ArrowUpRightIcon
                      aria-hidden="true"
                      className="size-4 shrink-0 text-muted-foreground transition-[transform,color] duration-200 group-hover/prompt:-translate-y-0.5 group-hover/prompt:translate-x-0.5 group-hover/prompt:text-foreground motion-reduce:transition-none"
                    />
                  </span>
                  <span className="relative flex flex-col gap-1 p-4 pt-3">
                    <span className="text-sm font-semibold text-foreground">
                      {suggestion.label}
                    </span>
                    <span className="text-xs leading-relaxed text-muted-foreground text-pretty">
                      {suggestion.prompt}
                    </span>
                  </span>
                </button>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>

      <DialogContent
        className="flex h-[min(90dvh,60rem)] max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-7xl flex-col gap-0 overflow-hidden rounded-3xl border-border/70 bg-background p-0 shadow-[0_32px_120px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:max-w-7xl"
        showCloseButton
      >
        <DialogHeader className="shrink-0 border-b border-border/70 bg-card/30 px-4 py-4 pr-14 sm:px-6 sm:py-5 sm:pr-16">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2 text-xs font-medium tracking-[0.14em] text-primary uppercase">
                <BrainCircuitIcon className="size-4" />
                Selvam suggestions
              </div>
              <DialogTitle className="text-balance text-xl font-semibold tracking-tight sm:text-2xl">
                Prompt gallery
              </DialogTitle>
              <DialogDescription className="mt-1 max-w-xl text-pretty">
                Choose a prompt to ask Selvam about the financial records available to you.
              </DialogDescription>
            </div>
            <div className="relative w-full lg:max-w-sm">
              <SearchIcon
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                aria-label={
                  "Search " +
                  (activeCategory === "All prompts" ? "all" : activeCategory) +
                  " prompts"
                }
                placeholder={
                  "Search " +
                  (activeCategory === "All prompts" ? "all" : activeCategory) +
                  " prompts"
                }
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  if (resultsRef.current) resultsRef.current.scrollTop = 0;
                }}
                className="h-11 rounded-xl border-border/70 bg-background/75 pl-9"
              />
            </div>
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col md:grid md:grid-cols-12 md:grid-rows-1">
          <nav
            aria-label="Prompt categories"
            className="flex min-w-0 shrink-0 gap-2 overflow-x-auto border-b border-border/70 p-3 md:col-span-4 md:min-h-0 md:flex-col md:overflow-y-auto md:border-r md:border-b-0 md:p-4 lg:col-span-3"
          >
            <button
              type="button"
              aria-pressed={activeCategory === "All prompts"}
              onClick={() => {
                setActiveCategory("All prompts");
                if (resultsRef.current) resultsRef.current.scrollTop = 0;
              }}
              className={cn(
                "flex min-h-10 shrink-0 items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-sm transition-[background-color,border-color,color,box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:w-full",
                activeCategory === "All prompts"
                  ? "border-primary/30 bg-primary/10 text-foreground shadow-[0_0_22px_rgba(139,92,246,0.08)]"
                  : "border-transparent text-muted-foreground hover:border-border/60 hover:bg-accent/60 hover:text-foreground",
              )}
            >
              <span className="flex items-center gap-2.5">
                <BrainCircuitIcon className="size-4 shrink-0" />
                All prompts
              </span>
              <span className="rounded-full bg-background/60 px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                {suggestions.length}
              </span>
            </button>
            {groups.map((group) => (
              <button
                type="button"
                key={group.label}
                aria-pressed={activeCategory === group.label}
                onClick={() => {
                  setActiveCategory(group.label);
                  if (resultsRef.current) resultsRef.current.scrollTop = 0;
                }}
                className={cn(
                  "flex min-h-10 shrink-0 items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-sm transition-[background-color,border-color,color,box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:w-full",
                  activeCategory === group.label
                    ? "border-primary/30 bg-primary/10 text-foreground shadow-[0_0_22px_rgba(139,92,246,0.08)]"
                    : "border-transparent text-muted-foreground hover:border-border/60 hover:bg-accent/60 hover:text-foreground",
                )}
              >
                <span className="flex items-center gap-2.5">
                  {group.icon}
                  <span className="min-w-0 truncate">{group.label}</span>
                </span>
                <span className="rounded-full bg-background/60 px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                  {group.options.length}
                </span>
              </button>
            ))}
          </nav>

          <section
            ref={resultsRef}
            aria-label={activeCategory + " prompt results"}
            className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 md:col-span-8 lg:col-span-9"
          >
            <div className="mb-4 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-foreground">{activeCategory}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Select a card to add its prompt to the conversation.
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-border/70 bg-card/70 px-2.5 py-1 text-xs font-medium tabular-nums text-muted-foreground">
                {filteredSuggestions.length} prompts
              </span>
            </div>

            {filteredSuggestions.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filteredSuggestions.map((suggestion) => {
                  const index = suggestions.findIndex(
                    (item) =>
                      item.category === suggestion.category && item.label === suggestion.label,
                  );
                  const tone = suggestionCardTones[index % suggestionCardTones.length]!;
                  return (
                    <button
                      type="button"
                      key={suggestion.category + "-" + suggestion.label}
                      className={cn(
                        "group/gallery-card relative flex min-h-56 w-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card p-3 text-left outline-none transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
                        tone.glow,
                      )}
                      aria-label={"Use prompt: " + suggestion.prompt}
                      onClick={() => choosePrompt(suggestion.prompt)}
                    >
                      <span
                        aria-hidden="true"
                        className={cn("absolute inset-0 bg-gradient-to-br", tone.gradient)}
                      />
                      <span
                        aria-hidden="true"
                        className="absolute -right-8 -bottom-12 size-36 rounded-full bg-white/10 blur-3xl transition-transform duration-300 group-hover/gallery-card:scale-125 motion-reduce:transition-none"
                      />
                      <span className="relative flex min-h-36 flex-1 rounded-xl border border-white/5 bg-background p-4 text-sm leading-relaxed text-foreground/90 text-pretty">
                        {suggestion.prompt}
                      </span>
                      <span className="relative flex min-w-0 items-center justify-between gap-3 px-1 pt-3">
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            aria-hidden="true"
                            className={cn(
                              "grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-foreground/90",
                              tone.icon,
                            )}
                          >
                            {suggestion.icon}
                          </span>
                          <span className="flex min-w-0 flex-col gap-0.5">
                            <span className="truncate text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                              {suggestion.category}
                            </span>
                            <span className="truncate text-sm font-semibold text-foreground">
                              {suggestion.label}
                            </span>
                          </span>
                        </span>
                        <ArrowUpRightIcon
                          aria-hidden="true"
                          className="size-4 shrink-0 text-muted-foreground transition-[transform,color] duration-200 group-hover/gallery-card:-translate-y-0.5 group-hover/gallery-card:translate-x-0.5 group-hover/gallery-card:text-foreground motion-reduce:transition-none"
                        />
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <Empty className="min-h-64 rounded-2xl border border-dashed border-border/70 bg-card/20">
                <EmptyHeader>
                  <EmptyTitle>No matching prompts</EmptyTitle>
                  <EmptyDescription>
                    Try another search or choose a different category.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
