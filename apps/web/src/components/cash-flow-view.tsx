import { BankStatementUploadDialog } from "@/components/bank-statement-upload-dialog";
import { CashFlowDashboard } from "@/components/cash-flow-dashboard";
import { EmptyDataState } from "@/components/empty-data-state";
import { PageHeader } from "@/components/page-header";
import { SectionCards, type MetricCard } from "@/components/section-cards";
import { getAmountFormatter } from "@/lib/amount-format-server";
import { getCashFlowDashboard, type CashFlowScope } from "@portfolio/api/cash-flow-queries";
import {
  BanknoteIcon,
  CircleDollarSignIcon,
  HandCoinsIcon,
  PiggyBankIcon,
  ReceiptTextIcon,
  Repeat2Icon,
  ShieldCheckIcon,
} from "lucide-react";

const copy = {
  all: {
    title: "Unified cash flow",
    description:
      "Cross-account movement with transfers between owned accounts removed so income and spending are counted once.",
    empty: "Import personal and joint bank statements to build the unified cash-flow view.",
  },
  personal: {
    title: "Personal cash flow",
    description:
      "Salary arrival, household funding, personal spending, and capital deployment from personal accounts.",
    empty:
      "Import ABN AMRO or other personal-account statements to build personal cash-flow intelligence.",
  },
  joint: {
    title: "Household cash flow",
    description:
      "Actual household spending, refunds, merchants, and cash received by joint accounts. Values remain at full household level.",
    empty:
      "Import the ING joint-account CSV or other joint-account statements to track actual household cash flow.",
  },
} as const;

export async function CashFlowView({ userId, scope }: { userId: string; scope: CashFlowScope }) {
  const [data, formatter] = await Promise.all([
    getCashFlowDashboard(userId, scope),
    getAmountFormatter(),
  ]);
  const cards: MetricCard[] =
    scope === "personal"
      ? [
          {
            label: "Salary received",
            value: formatter.formatCurrency(data.metrics.salaryReceived, "EUR"),
            badge: `${data.metrics.salaryMatches}/${data.metrics.salaryPayslips} payslips verified`,
            note:
              data.metrics.salaryMissing || data.metrics.salaryMismatches
                ? `${data.metrics.salaryMissing} missing · ${data.metrics.salaryMismatches} amount mismatches`
                : "Every imported payslip matches an external bank credit",
            icon: HandCoinsIcon,
          },
          {
            label: "Household funding",
            value: formatter.formatCurrency(data.metrics.internalTransfersOut, "EUR"),
            badge: "Owned-account transfers",
            note: "Excluded from personal spending and unified totals",
            icon: Repeat2Icon,
          },
          {
            label: "Capital invested",
            value: formatter.formatCurrency(data.metrics.totalInvested, "EUR"),
            badge: "Broker funding",
            note: "Cash transferred to identified investment accounts",
            icon: PiggyBankIcon,
          },
          {
            label: "Personal spending",
            value: formatter.formatCurrency(data.metrics.totalSpending, "EUR"),
            badge: `${data.categories.length} categories`,
            note: "External expenses paid from personal accounts",
            icon: ReceiptTextIcon,
          },
        ]
      : scope === "joint"
        ? [
            {
              label: "Household funding received",
              value: formatter.formatCurrency(data.metrics.internalTransfersIn, "EUR"),
              badge: "Owned-account transfers",
              note: "Funding received from personal accounts",
              icon: Repeat2Icon,
            },
            {
              label: "Actual household spending",
              value: formatter.formatCurrency(data.metrics.totalSpending, "EUR"),
              badge: `${data.categories.length} categories`,
              note: "Internal transfers and investments excluded",
              icon: ReceiptTextIcon,
            },
            {
              label: "Average active month",
              value: formatter.formatCurrency(data.metrics.averageMonthlySpending, "EUR"),
              badge: `${data.monthly.length} months`,
              note: "Average across months represented by transactions",
              icon: CircleDollarSignIcon,
            },
            {
              label: "Needs review",
              value: data.metrics.lowConfidenceRows.toLocaleString(),
              badge: "Below 80%",
              note: "Confirm uncertain categories for precise household analytics",
              icon: ShieldCheckIcon,
            },
          ]
        : [
            {
              label: "External income",
              value: formatter.formatCurrency(data.metrics.totalIncome, "EUR"),
              badge: `${data.metrics.salaryCredits} salary credits`,
              note: "Transfers between owned accounts excluded",
              icon: CircleDollarSignIcon,
            },
            {
              label: "External spending",
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
              note: "Confirm categories to improve every linked view",
              icon: BanknoteIcon,
            },
          ];
  return (
    <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col">
      <div className="flex flex-col gap-4 py-4 sm:py-5 md:gap-5 md:py-6">
        <PageHeader
          title={copy[scope].title}
          description={copy[scope].description}
          action={<BankStatementUploadDialog />}
        />
        {!data.configured ? (
          <div className="px-4 lg:px-6">
            <EmptyDataState
              icon={BanknoteIcon}
              title={`No ${scope === "all" ? "bank" : scope} statements yet`}
              description={copy[scope].empty}
              action={<BankStatementUploadDialog />}
            />
          </div>
        ) : (
          <>
            <SectionCards items={cards} />
            <CashFlowDashboard data={data} scope={scope} />
          </>
        )}
      </div>
    </div>
  );
}
