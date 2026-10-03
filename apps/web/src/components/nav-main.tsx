"use client";

import type { LucideIcon } from "lucide-react";
import { ChevronDownIcon } from "lucide-react";
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
  items,
}: {
  label: string;
  items: ReadonlyArray<{ title: string; url: string; icon: LucideIcon }>;
}) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const contentId = useId();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <SidebarGroup className="px-3 py-1.5">
      <SidebarGroupLabel
        className="h-7 w-full cursor-pointer justify-between px-2 text-xs font-semibold tracking-wider text-sidebar-foreground/60 uppercase hover:text-sidebar-foreground"
        render={<button type="button" aria-expanded={isOpen} aria-controls={contentId} />}
        onClick={() => setIsOpen((open) => !open)}
      >
        {label}
        <ChevronDownIcon
          aria-hidden="true"
          data-state={isOpen ? "open" : "closed"}
          className="size-3.5! transition-transform motion-reduce:transition-none data-[state=closed]:-rotate-90"
        />
      </SidebarGroupLabel>
      <SidebarGroupContent id={contentId} hidden={!isOpen}>
        <SidebarMenu>
          {items.map((item) => {
            const isActive =
              item.url === "/dashboard" ? pathname === item.url : pathname.startsWith(item.url);
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  className="h-9 gap-2.5 rounded-lg px-2.5 text-sidebar-foreground/80 data-active:text-sidebar-accent-foreground [&_svg]:text-sidebar-foreground/60 data-active:[&_svg]:text-sidebar-accent-foreground"
                  isActive={isActive}
                  onClick={() => setOpenMobile(false)}
                  tooltip={item.title}
                  render={<Link href={item.url as Route} />}
                >
                  <item.icon />
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
