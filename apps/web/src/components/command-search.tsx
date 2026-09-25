"use client";

import { dashboardChartNavigation, dashboardNavigation } from "@/lib/navigation";
import { Button } from "@portfolio/ui/components/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@portfolio/ui/components/command";
import { SearchIcon } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import * as React from "react";

export function CommandSearch() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function navigate(url: string) {
    setOpen(false);
    router.push(url as Route);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-10 w-10 justify-center gap-2 rounded-full border-transparent bg-muted/70 px-0 text-muted-foreground shadow-none transition-colors hover:border-transparent hover:bg-muted hover:text-foreground md:w-full md:justify-start md:px-4"
        onClick={() => setOpen(true)}
        aria-label="Search Selvam"
      >
        <SearchIcon data-icon="inline-start" />
        <span className="hidden md:inline">Search pages, charts, and features</span>
        <kbd className="ml-auto hidden rounded border bg-background/60 px-1.5 font-mono text-[10px] leading-5 text-muted-foreground md:inline-flex">
          ⌘K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search pages and features…" autoFocus />
        <CommandList>
          <CommandEmpty>No matching page or chart found.</CommandEmpty>
          {[...dashboardNavigation, ...dashboardChartNavigation].map((group) => (
            <CommandGroup key={group.label} heading={group.label}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.url}
                  value={`${item.title} ${item.keywords}`}
                  onSelect={() => navigate(item.url)}
                >
                  <item.icon className="size-4 text-muted-foreground" />
                  <span>{item.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
