import { PageHeader } from "@/components/page-header";
import { SectionPageLinks } from "@/components/section-page-links";
import { MonthlyCashFlowCard } from "@/components/monthly-cash-flow-card";
import { SalaryCharts } from "@/components/salary-charts";
import { WealthMixCharts } from "@/components/wealth-mix-charts";
import { getCashFlowDashboard } from "@portfolio/api/cash-flow-queries";
import { getPortfolioOverview } from "@portfolio/api/portfolio-queries";
import { getSalaryPayslips } from "@portfolio/api/salary-queries";
import { auth } from "@portfolio/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@portfolio/ui/components/card";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";

const sectionDetails: Record<string, { label: string; summary: string; chart?: string }> = {
  "cash-accounts": {
    label: "Cash accounts",
    summary:
      "Balances stay separated by currency. Cash-flow analytics use imported transactions and exclude transfers between your own accounts.",
    chart: "cash-flow",
  },
  investments: {
    label: "Investments",
    summary:
      "Explore holdings, performance, property, mortgage and commodities. Each page keeps its own valuation date and source context.",
    chart: "wealth",
  },
  income: {
    label: "Income",
    summary:
      "Review salary records and tax assessments from their original documents. Figures remain grouped by source and currency.",
    chart: "income",
  },
  planning: {
    label: "Planning",
    summary:
      "Compare planning tools built from your saved assumptions and evidence. Projections are model outputs, not observed balances.",
  },
  data: {
    label: "Data",
    summary:
      "Review imported source files, processing results and archive status. Import history is the audit trail for values shown elsewhere.",
  },
};

function monthLabel(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", year: "2-digit", timeZone: "UTC" }).format(
    new Date(`${value}T12:00:00Z`),
  );
}

async function SectionChart({ section, userId }: { section: string; userId: string }) {
  if (section === "cash-accounts") {
    const data = await getCashFlowDashboard(userId, "all");
    return data.configured ? (
      <MonthlyCashFlowCard data={data} scope="all" />
    ) : (
      <MissingChart note="Import supported bank transactions to see cash-flow trends." />
    );
  }
  if (section === "investments") {
    const data = await getPortfolioOverview(userId);
    return data.assets.length ? (
      <>
        {data.unconvertedCurrencies.length ? (
          <div className="px-4 lg:px-6">
            <Card className="border-amber-500/30 bg-amber-500/5 py-3 shadow-xs">
              <CardContent className="px-4 text-sm">
                Missing stored FX rates for {data.unconvertedCurrencies.join(", ")}. Affected assets
                are excluded from the base-currency chart.
              </CardContent>
            </Card>
          </div>
        ) : null}
        <WealthMixCharts
          allocation={data.allocation}
          netWorth={data.totals.netWorth}
          liquidValue={data.totals.liquidValue}
          currency={data.preference.baseCurrency}
        />
      </>
    ) : (
      <MissingChart note="Add or import an asset to see the current wealth mix." />
    );
  }
  if (section === "income") {
    const payslips = await getSalaryPayslips(userId);
    return payslips.length ? (
      <SalaryCharts
        data={payslips.map((payslip) => ({
          month: monthLabel(payslip.payPeriod),
          baseSalary: payslip.baseSalary,
          supplementalGross: payslip.supplementalGross,
          netPay: payslip.netPay,
          wageTax: payslip.wageTax,
          pensionContribution: payslip.pensionContribution,
          socialInsurance: payslip.socialInsurance,
        }))}
        currency={payslips.at(-1)?.currency ?? "EUR"}
      />
    ) : (
      <MissingChart note="Import payslips to see salary and deduction trends." />
    );
  }
  return null;
}

function MissingChart({ note }: { note: string }) {
  return (
    <div className="px-4 lg:px-6">
      <Card className="gap-2 py-4 shadow-xs">
        <CardHeader className="px-4">
          <CardTitle className="text-base">Visualization not available yet</CardTitle>
          <CardDescription>{note}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export default async function SectionOverviewPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const detail = sectionDetails[section];
  if (!detail) notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  return (
    <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col">
      <div className="flex flex-col gap-5 py-4 sm:py-5 md:gap-6 md:py-6">
        <PageHeader title={`${detail.label} overview`} description={detail.summary} />

        {detail.chart ? <SectionChart section={section} userId={session.user.id} /> : null}

        {!detail.chart ? (
          <div className="px-4 lg:px-6">
            <Card className="gap-2 py-4 shadow-xs">
              <CardHeader className="px-4">
                <CardTitle className="text-base">No combined chart for this section</CardTitle>
                <CardDescription>
                  This section has no single cross-page measure. Keep source records, projections
                  and archive status in their own detailed views.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        ) : null}

        <SectionPageLinks section={detail.label} />
      </div>
    </div>
  );
}
