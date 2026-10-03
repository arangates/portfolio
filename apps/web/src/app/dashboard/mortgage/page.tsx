import { MortgageDashboard } from "@/components/mortgage-dashboard";
import { ING_MORTGAGE_OVERVIEW } from "@portfolio/api/mortgage-calculations";
import { getMortgageBankPayments } from "@portfolio/api/mortgage-queries";
import { auth } from "@portfolio/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function MortgagePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const { payments, coverageStart } = await getMortgageBankPayments(
    session.user.id,
    ING_MORTGAGE_OVERVIEW.monthlyPayment,
  );
  return <MortgageDashboard bankPayments={payments} coverageStart={coverageStart} />;
}
