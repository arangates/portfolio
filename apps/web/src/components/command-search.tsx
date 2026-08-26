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
        className="h-8 w-8 justify-center gap-2 px-0 text-muted-foreground sm:w-44 sm:justify-start sm:px-2.5"
        onClick={() => setOpen(true)}
        aria-label="Search Selvam"
      >
        <SearchIcon className="size-4" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="ml-auto hidden rounded border bg-muted px-1.5 font-mono text-[10px] leading-5 text-muted-foreground sm:inline-flex">
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
