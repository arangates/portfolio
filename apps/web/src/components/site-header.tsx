"use client";
import { AmountModeToggle } from "@/components/amount-preferences";

import { PrivacyToggle } from "@/components/dashboard-experience";
import { AppStatus, InstallApp } from "@/components/pwa-controls";
import { ModeToggle } from "@/components/mode-toggle";
import { CommandSearch } from "@/components/command-search";
import { NotificationBell } from "@/components/notification-bell";
import { dashboardPages } from "@/lib/navigation";
import { Separator } from "@portfolio/ui/components/separator";
import { SidebarTrigger } from "@portfolio/ui/components/sidebar";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname();
  const title = pathname.startsWith("/dashboard/salary/")
    ? "Salary payslip"
    : (dashboardPages.find((page) => page.url === pathname)?.title ?? "Selvam");

  return (
    <header className="app-header sticky top-0 z-30 flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="grid w-full min-w-0 grid-cols-[1fr_auto] items-center gap-2 px-3 sm:px-4 md:grid-cols-[minmax(10rem,1fr)_minmax(18rem,42rem)_minmax(10rem,1fr)] lg:px-6">
        <div className="flex min-w-0 items-center gap-1 lg:gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-1 h-4 data-vertical:self-auto sm:mx-2" />
          <h1 className="truncate text-sm font-medium sm:text-base">{title}</h1>
        </div>
        <div className="hidden min-w-0 md:block">
          <CommandSearch />
        </div>
        <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-2">
          <span className="hidden sm:inline-flex">
            <AmountModeToggle />
          </span>
          <span className="hidden sm:inline-flex">
            <InstallApp />
          </span>
          <PrivacyToggle />
          <span className="md:hidden">
            <CommandSearch />
          </span>
          <AppStatus />
          <NotificationBell />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
