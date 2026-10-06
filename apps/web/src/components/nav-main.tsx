"use client";

import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { ChevronDownIcon } from "@portfolio/ui/components/icons";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@portfolio/ui/components/sidebar";

export function NavMain({
  label,
  overviewUrl,
  items,
  onNavigate,
}: {
  label: string;
  overviewUrl?: string;
  items: ReadonlyArray<{ title: string; url: string; icon: PhosphorIcon }>;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const contentId = useId();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <SidebarGroup className="px-3 py-1.5">
      <div className="flex h-7 items-center justify-between px-2">
        {overviewUrl ? (
          <SidebarGroupLabel
            className="h-7 cursor-pointer px-0 text-xs font-semibold tracking-wider text-sidebar-foreground/60 uppercase hover:text-sidebar-foreground"
            render={<Link href={overviewUrl as Route} />}
          >
            {label}
          </SidebarGroupLabel>
        ) : (
          <SidebarGroupLabel className="h-7 px-0 text-xs font-semibold tracking-wider text-sidebar-foreground/60 uppercase">
            {label}
          </SidebarGroupLabel>
        )}
        <button
          type="button"
          className="flex size-7 items-center justify-center rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          aria-label={`${isOpen ? "Collapse" : "Expand"} ${label}`}
          aria-expanded={isOpen}
          aria-controls={contentId}
          onClick={() => setIsOpen((open) => !open)}
        >
          <ChevronDownIcon
            aria-hidden="true"
            data-state={isOpen ? "open" : "closed"}
            className="size-3.5! transition-transform motion-reduce:transition-none data-[state=closed]:-rotate-90"
          />
        </button>
      </div>
      <SidebarGroupContent id={contentId} hidden={!isOpen}>
        <SidebarMenu>
          {items.map((item) => {
            const isActive =
              item.url === "/dashboard" ? pathname === item.url : pathname.startsWith(item.url);
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  className="h-11 gap-3 rounded-lg px-3 text-base font-medium text-sidebar-foreground/80 data-active:text-sidebar-accent-foreground [&_svg]:text-sidebar-foreground/60 [&_svg]:size-[18px] data-active:[&_svg]:text-sidebar-accent-foreground"
                  isActive={isActive}
                  onClick={() => {
                    setOpenMobile(false);
                    onNavigate?.();
                  }}
                  tooltip={item.title}
                  render={<Link href={item.url as Route} />}
                >
                  <item.icon className="!size-[18px]" />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
