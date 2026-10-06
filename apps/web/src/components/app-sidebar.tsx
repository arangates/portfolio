"use client";

import { SearchIcon, XIcon } from "@portfolio/ui/components/icons";
import Image from "next/image";
import { useState } from "react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { dashboardNavigation } from "@/lib/navigation";
import { Button } from "@portfolio/ui/components/button";
import { Input } from "@portfolio/ui/components/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@portfolio/ui/components/sidebar";

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: { name: string; email: string; image?: string | null };
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const availableGroups = dashboardNavigation
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => item.url !== "/dashboard/labs" || process.env.NEXT_PUBLIC_ENABLE_LABS === "true",
      ),
    }))
    .filter((group) => group.items.length > 0);
  const visibleGroups = normalizedQuery
    ? availableGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) =>
            group.label.toLowerCase().includes(normalizedQuery)
              ? true
              : `${item.title} ${"shortTitle" in item ? (item.shortTitle ?? "") : ""} ${item.keywords}`
                  .toLowerCase()
                  .includes(normalizedQuery),
          ),
        }))
        .filter((group) => group.items.length > 0)
    : availableGroups;
  const searchResults = visibleGroups.flatMap((group) => group.items);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="/dashboard" />}
            >
              <Image
                src="/selvam-mark.svg"
                alt=""
                width={28}
                height={28}
                data-no-outline
                className="size-7 object-contain"
              />
              <span className="text-base font-semibold">Selvam</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="gap-0 py-1">
        <div className="px-3 pb-2 group-data-[collapsible=icon]:hidden">
          <label htmlFor="sidebar-navigation-search" className="sr-only">
            Search navigation
          </label>
          <div className="relative">
            <SearchIcon
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="sidebar-navigation-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setQuery("");
              }}
              placeholder="Search navigation"
              className="h-10 pl-9 pr-9"
            />
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
                aria-label="Clear navigation search"
                onClick={() => setQuery("")}
              >
                <XIcon />
              </Button>
            )}
          </div>
        </div>
        {normalizedQuery ? (
          searchResults.length ? (
            <NavMain
              key="navigation-search-results"
              label="Results"
              items={searchResults}
              onNavigate={() => setQuery("")}
            />
          ) : (
            <p className="px-5 py-3 text-sm text-muted-foreground">No matching pages.</p>
          )
        ) : (
          visibleGroups.map((group) => (
            <NavMain
              key={group.label}
              label={group.label}
              overviewUrl={group.overviewUrl}
              items={group.items}
            />
          ))
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
