import { auth } from "@portfolio/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getFinancialCalendar } from "@portfolio/api/calendar-queries";
import { FinancialCalendar } from "@/components/financial-calendar";
import { PageHeader } from "@/components/page-header";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const { month } = await searchParams;
  const data = await getFinancialCalendar(session.user.id, month);
  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 py-6">
      <PageHeader
        title="Financial calendar"
        description="Bills, deposit maturities, recorded activity and planning milestones in one place."
      />
      <FinancialCalendar key={data.month} {...data} />
    </div>
  );
}
