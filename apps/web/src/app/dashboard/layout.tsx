import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { auth } from "@portfolio/auth";
import { SidebarInset, SidebarProvider } from "@portfolio/ui/components/sidebar";
import { DashboardExperience, FinancialContent } from "@/components/dashboard-experience";
import { GlobalAIChat } from "@/components/global-ai-chat";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const privacyHidden = (await cookies()).get("selvam-privacy")?.value === "hidden";
  return (
    <DashboardExperience initialHidden={privacyHidden}>
      <SidebarProvider
        className="bg-sidebar"
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 14)",
          } as React.CSSProperties
        }
      >
        <AppSidebar user={session.user} variant="inset" />
        {/* Bounded height turns `main` into the scroll region, keeping the header fixed above it. */}
        <SidebarInset className="h-svh overflow-hidden border border-border/60 shadow-sm md:h-[calc(100svh-1rem)]">
          <GlobalAIChat userId={session.user.id}>
            <SiteHeader />
            <main className="dashboard-content flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
              <FinancialContent>{children}</FinancialContent>
            </main>
          </GlobalAIChat>
        </SidebarInset>
      </SidebarProvider>
    </DashboardExperience>
  );
}
