"use client";

import { AppStatus } from "@/components/pwa-controls";
import { ModeToggle } from "@/components/mode-toggle";
import { CommandSearch } from "@/components/command-search";
import { NotificationBell } from "@/components/notification-bell";
import { Button } from "@portfolio/ui/components/button";
import { SidebarTrigger } from "@portfolio/ui/components/sidebar";
import { ChevronRightIcon, MessageCircleIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { dashboardPages } from "@/lib/navigation";

function CurrentLocation() {
  const pathname = usePathname();
  const page = [...dashboardPages]
    .sort((a, b) => b.url.length - a.url.length)
    .find((item) => pathname === item.url || pathname.startsWith(`${item.url}/`));

  if (!page) return null;
  const pageTitle = page.title;

  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-2 text-sm lg:flex">
      <Link
        href="/dashboard"
        className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
      >
        Selvam
      </Link>
      <ChevronRightIcon aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground/60" />
      <span className="shrink-0 text-muted-foreground">{page.group}</span>
      <ChevronRightIcon aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground/60" />
      <span aria-current="page" className="truncate font-medium text-foreground">
        {"shortTitle" in page ? (page.shortTitle ?? pageTitle) : pageTitle}
      </span>
    </nav>
  );
}

export function SiteHeader() {
  return (
    <header className="app-header sticky top-0 z-30 flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2 sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <SidebarTrigger className="-ml-1" />
          <CurrentLocation />
        </div>
        <div className="hidden min-w-0 md:block md:justify-self-center md:w-[min(100%,42rem)]">
          <CommandSearch />
        </div>
        <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-2">
          <span className="md:hidden">
            <CommandSearch />
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 rounded-full px-3"
            render={<Link href="/dashboard/chat" />}
            nativeButton={false}
            aria-label="Open Selvam assistant"
            title="Open Selvam assistant"
          >
            <MessageCircleIcon />
            <span className="hidden sm:inline">Ask Selvam</span>
          </Button>
          <AppStatus />
          <NotificationBell />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
