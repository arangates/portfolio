import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { auth } from "@portfolio/auth";
import { SidebarInset, SidebarProvider } from "@portfolio/ui/components/sidebar";
import {
  DashboardExperience,
  FinancialContent,
  MobileNavigation,
} from "@/components/dashboard-experience";
import { AppStatus } from "@/components/pwa-controls";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const privacyHidden = (await cookies()).get("selvam-privacy")?.value === "hidden";
  return (
    <DashboardExperience initialHidden={privacyHidden}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar user={session.user} variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <AppStatus />
          <main className="dashboard-content flex min-w-0 flex-1 flex-col overflow-x-hidden">
            <FinancialContent>{children}</FinancialContent>
          </main>
          <MobileNavigation />
        </SidebarInset>
      </SidebarProvider>
    </DashboardExperience>
  );
}
