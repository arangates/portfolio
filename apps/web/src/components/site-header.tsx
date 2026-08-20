"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { CommandSearch } from "@/components/command-search";
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
    <header className="sticky top-0 z-30 flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4 data-vertical:self-auto" />
        <h1 className="min-w-0 flex-1 truncate text-sm font-medium sm:text-base">{title}</h1>
        <div className="flex shrink-0 items-center gap-2">
          <CommandSearch />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
