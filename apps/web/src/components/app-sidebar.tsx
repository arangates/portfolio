"use client";

import { BrainCircuitIcon, Settings2Icon, WalletCardsIcon } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { dashboardNavigation } from "@/lib/navigation";
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
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="/dashboard" />}
            >
              <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <WalletCardsIcon />
              </span>
              <span className="text-base font-semibold">Selvam</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="gap-0 py-1">
        {dashboardNavigation.map((group) => {
          const items = group.items.filter(
            (item) =>
              item.url !== "/dashboard/labs" || process.env.NEXT_PUBLIC_ENABLE_LABS === "true",
          );
          if (items.length === 0) return null;
          return <NavMain key={group.label} label={group.label} items={items} />;
        })}
        <NavSecondary
          items={[
            { title: "Financial twin", url: "/dashboard/twin", icon: BrainCircuitIcon },
            { title: "Settings", url: "/dashboard/settings", icon: Settings2Icon },
          ]}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
