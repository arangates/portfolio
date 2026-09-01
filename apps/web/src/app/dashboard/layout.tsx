import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { auth } from "@portfolio/auth";
import { db, user } from "@portfolio/db";
import { SidebarInset, SidebarProvider } from "@portfolio/ui/components/sidebar";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  let activeUser = session?.user;
  if (!activeUser && process.env.NODE_ENV === "development") {
    activeUser = (
      await db.select().from(user).where(eq(user.email, "arangates@gmail.com")).limit(1)
    )[0];
  }
  if (!activeUser) redirect("/login");

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar user={activeUser} variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <main className="flex min-w-0 flex-1 flex-col overflow-x-hidden">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
