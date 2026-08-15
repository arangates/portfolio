"use client";

import {
  BanknoteIcon,
  Building2Icon,
  CoinsIcon,
  DatabaseIcon,
  HandCoinsIcon,
  EuroIcon,
  FlameIcon,
  Globe2Icon,
  LandmarkIcon,
  LayoutDashboardIcon,
  TrendingUpIcon,
  WalletCardsIcon,
  SettingsIcon,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@portfolio/ui/components/sidebar";

const navigation = [
  {
    label: "Portfolio",
    items: [
      { title: "Overview & assets", url: "/dashboard", icon: LayoutDashboardIcon },
      { title: "Fixed deposits", url: "/dashboard/fixed-deposits", icon: LandmarkIcon },
    ],
  },
  {
    label: "Cash accounts",
    items: [
      { title: "INR", url: "/dashboard/inr", icon: BanknoteIcon },
      { title: "EUR", url: "/dashboard/eur", icon: EuroIcon },
    ],
  },
  {
    label: "Investments",
    items: [
      { title: "Indian equity", url: "/dashboard/indian-equity", icon: TrendingUpIcon },
      { title: "Global equity", url: "/dashboard/global-equity", icon: Globe2Icon },
      { title: "Real estate", url: "/dashboard/real-estate", icon: Building2Icon },
      { title: "Commodities", url: "/dashboard/commodities", icon: CoinsIcon },
    ],
  },
  {
    label: "Income",
    items: [{ title: "Salary", url: "/dashboard/salary", icon: HandCoinsIcon }],
  },
  {
    label: "Planning",
    items: [{ title: "FIRE planner", url: "/dashboard/fire", icon: FlameIcon }],
  },
  {
    label: "Data",
    items: [
      { title: "Import history", url: "/dashboard/imports", icon: DatabaseIcon },
      { title: "Settings & data", url: "/dashboard/settings", icon: SettingsIcon },
    ],
  },
] as const;

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
      <SidebarContent>
        {navigation.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
