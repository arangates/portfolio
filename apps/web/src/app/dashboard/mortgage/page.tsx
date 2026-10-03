import { MortgageDashboard } from "@/components/mortgage-dashboard";
import { ING_MORTGAGE_OVERVIEW } from "@portfolio/api/mortgage-calculations";
import {
  getMortgageBankPayments,
  getMortgageRecord,
  getMortgageSnapshots,
} from "@portfolio/api/mortgage-queries";
import { auth } from "@portfolio/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function MortgagePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const userId = session.user.id;
  const record = await getMortgageRecord(userId);
  const [bank, snapshots] = await Promise.all([
    getMortgageBankPayments(
      userId,
      record?.settings.terms.monthlyPayment ?? ING_MORTGAGE_OVERVIEW.monthlyPayment,
    ),
    record ? getMortgageSnapshots(userId, record.loanId) : Promise.resolve([]),
  ]);
  return (
    <MortgageDashboard
      key={record?.overviewId ?? `unsaved-${record?.updatedAt ?? ""}`}
      record={record}
      snapshots={snapshots}
      bankPayments={bank.payments}
      coverageStart={bank.coverageStart}
      coverageEnd={bank.coverageEnd}
    />
  );
}
