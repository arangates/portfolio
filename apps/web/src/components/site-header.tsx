"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { PortfolioRecordDialog } from "@/components/portfolio-record-dialog";
import { Separator } from "@portfolio/ui/components/separator";
import { SidebarTrigger } from "@portfolio/ui/components/sidebar";
import { usePathname } from "next/navigation";

const titles: Record<string, string> = {
  "/dashboard": "Overview & assets",
  "/dashboard/fixed-deposits": "Fixed deposits",
  "/dashboard/inr": "INR accounts",
  "/dashboard/eur": "EUR accounts",
  "/dashboard/indian-equity": "Indian equity",
  "/dashboard/global-equity": "Global equity",
  "/dashboard/real-estate": "Real estate",
  "/dashboard/commodities": "Commodities",
  "/dashboard/salary": "Salary",
  "/dashboard/fire": "FIRE planner",
  "/dashboard/imports": "Import history",
  "/dashboard/settings": "Settings & data",
};

export function SiteHeader() {
  const pathname = usePathname();
  const title = pathname.startsWith("/dashboard/salary/")
    ? "Salary payslip"
    : (titles[pathname] ?? "Selvam");

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4 data-vertical:self-auto" />
        <h1 className="truncate text-base font-medium">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          {pathname === "/dashboard/fixed-deposits" ? (
            <PortfolioRecordDialog
              kind="fixed_deposit"
              values={{ currency: "INR", compoundingPerYear: 4 }}
            />
          ) : null}
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
