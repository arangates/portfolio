import { BankStatementUploadDialog } from "@/components/bank-statement-upload-dialog";
import { CashFlowDashboard } from "@/components/cash-flow-dashboard";
import { EmptyDataState } from "@/components/empty-data-state";
import { PageHeader } from "@/components/page-header";
import { SectionCards } from "@/components/section-cards";
import { getAmountFormatter } from "@/lib/amount-format-server";
import { getCashFlowDashboard } from "@portfolio/api/cash-flow-queries";
import { auth } from "@portfolio/auth";
import { BanknoteIcon, CircleDollarSignIcon, PiggyBankIcon, ReceiptTextIcon } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function CashFlowPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const [data, formatter] = await Promise.all([
    getCashFlowDashboard(session.user.id),
    getAmountFormatter(),
  ]);
  return (
    <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col">
      <div className="flex flex-col gap-4 py-4 sm:py-5 md:gap-5 md:py-6">
        <PageHeader
          title="Cash flow"
          description="One reconciled view of salary, personal-account transfers, joint household spending, and investment funding."
          action={<BankStatementUploadDialog />}
        />
        {!data.configured ? (
          <div className="px-4 lg:px-6">
            <EmptyDataState
              icon={BanknoteIcon}
              title="No bank statements yet"
              description="Import ABN AMRO Statement of Account PDFs or an ING transaction CSV. Accounts and duplicates are detected automatically."
              action={<BankStatementUploadDialog />}
            />
          </div>
        ) : (
          <>
            <SectionCards
              items={[
                {
                  label: "External income",
                  value: formatter.formatCurrency(data.metrics.totalIncome, "EUR"),
                  badge: `${data.metrics.salaryCredits} salary credits`,
                  note: "Transfers between your own accounts excluded",
                  icon: CircleDollarSignIcon,
                },
                {
                  label: "Household spending",
                  value: formatter.formatCurrency(data.metrics.totalSpending, "EUR"),
                  badge: `${data.categories.length} categories`,
                  note: `Average ${formatter.formatCurrency(data.metrics.averageMonthlySpending, "EUR")} per active month`,
                  icon: ReceiptTextIcon,
                },
                {
                  label: "Capital invested",
                  value: formatter.formatCurrency(data.metrics.totalInvested, "EUR"),
                  badge: "Cash deployed",
                  note: "Transfers identified as broker or investment funding",
                  icon: PiggyBankIcon,
                },
                {
                  label: "Needs review",
                  value: data.metrics.lowConfidenceRows.toLocaleString(),
                  badge: "Below 80%",
                  note: "Confirm these categories to improve future analysis",
                  icon: BanknoteIcon,
                },
              ]}
            />
            <CashFlowDashboard data={data} />
          </>
        )}
      </div>
    </div>
  );
}
