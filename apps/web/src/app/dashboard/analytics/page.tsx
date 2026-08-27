import { EmptyDataState } from "@/components/empty-data-state";
import { EquityPerformanceCharts } from "@/components/equity-performance-charts";
import { HouseholdCharts } from "@/components/household-charts";
import { PageHeader } from "@/components/page-header";
import { PortfolioFlowChart } from "@/components/portfolio-flow-chart";
import { RealEstateCharts } from "@/components/real-estate-charts";
import { SalaryCharts } from "@/components/salary-charts";
import { WealthMixCharts } from "@/components/wealth-mix-charts";
import { ZerodhaTradebookCharts } from "@/components/zerodha-tradebook-charts";
import { getHouseholdDashboard } from "@portfolio/api/household-queries";
import { getPortfolioOverview, getRealEstateDashboard } from "@portfolio/api/portfolio-queries";
import { getSalaryPayslips } from "@portfolio/api/salary-queries";
import { getZerodhaTradebookAnalytics } from "@portfolio/api/zerodha-tradebook-queries";
import { auth } from "@portfolio/auth";
import { ChartNoAxesCombinedIcon } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

function monthLabel(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}

function AnalyticsSection({
  id,
  title,
  description,
  children,
}: {
  id?: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="min-w-0 scroll-mt-24 space-y-3">
      <div className="px-4 lg:px-6">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

export default async function AnalyticsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const [overview, tradebook, payslips, household, realEstate] = await Promise.all([
    getPortfolioOverview(session.user.id),
    getZerodhaTradebookAnalytics(session.user.id),
    getSalaryPayslips(session.user.id),
    getHouseholdDashboard(session.user.id),
    getRealEstateDashboard(session.user.id),
  ]);

  const baseCurrency = overview.preference.baseCurrency;
  const hasPortfolio = overview.assets.length > 0;
  const hasTradebook = tradebook.summary.trades > 0;
  const hasSalary = payslips.length > 0;
  const hasHousehold = household.configured && household.categoryBreakdown.length > 0;
  const hasProperty = realEstate.properties.length > 0;
  const hasAnyData = hasPortfolio || hasTradebook || hasSalary || hasHousehold || hasProperty;

  const salaryCurrency = payslips.at(-1)?.currency ?? "EUR";
  const salaryData = payslips.map((payslip) => ({
    month: monthLabel(payslip.payPeriod),
    baseSalary: payslip.baseSalary,
    supplementalGross: payslip.supplementalGross,
    netPay: payslip.netPay,
    wageTax: payslip.wageTax,
    pensionContribution: payslip.pensionContribution,
    socialInsurance: payslip.socialInsurance,
  }));

  return (
    <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col">
      <div className="flex min-w-0 flex-col gap-7 py-4 sm:py-5 md:py-6">
        <PageHeader
          title="Analytics"
          description="Interactive wealth, cash-flow, income and planning intelligence in one focused workspace."
        />

        {!hasAnyData ? (
          <div className="px-4 lg:px-6">
            <EmptyDataState
              icon={ChartNoAxesCombinedIcon}
              title="No analytics yet"
              description="Import a statement or add an asset. Your charts will appear here automatically."
            />
          </div>
        ) : null}

        {hasPortfolio ? (
          <AnalyticsSection
            id="wealth-structure"
            title="Wealth structure"
            description="Composition, liquidity and historical market value across your complete portfolio."
          >
            <PortfolioFlowChart
              assets={overview.assets}
              netWorth={overview.totals.netWorth}
              liquidValue={overview.totals.liquidValue}
              currency={baseCurrency}
            />
            <WealthMixCharts
              allocation={overview.allocation}
              netWorth={overview.totals.netWorth}
              liquidValue={overview.totals.liquidValue}
              currency={baseCurrency}
            />
          </AnalyticsSection>
        ) : null}

        {overview.equityBreakdown.length > 0 ? (
          <AnalyticsSection
            id="equity-performance-section"
            title="Indian equity performance"
            description="The holdings responsible for current unrealized P&L and how the total evolved across imports."
          >
            <EquityPerformanceCharts
              holdings={overview.equityBreakdown}
              history={overview.equityHistory}
            />
          </AnalyticsSection>
        ) : null}

        {hasTradebook ? (
          <AnalyticsSection
            title="Investment behaviour"
            description="How contributions and redemptions evolved across imported Zerodha tradebooks."
          >
            <ZerodhaTradebookCharts monthly={tradebook.monthly} funds={tradebook.funds} />
          </AnalyticsSection>
        ) : null}

        {hasSalary ? (
          <AnalyticsSection
            title="Income intelligence"
            description="Recurring earnings, special payments, take-home pay and deductions from payslips."
          >
            <SalaryCharts data={salaryData} currency={salaryCurrency} />
          </AnalyticsSection>
        ) : null}

        {hasHousehold ? (
          <AnalyticsSection
            title="Household economics"
            description="Your recurring family cost structure and the impact of alternative scenarios."
          >
            <HouseholdCharts
              categories={household.categoryBreakdown}
              scenarios={household.scenarios}
              currency={household.currency}
              essentialExpenses={household.metrics.essentialExpenses}
              flexibleExpenses={household.metrics.flexibleExpenses}
            />
          </AnalyticsSection>
        ) : null}

        {hasProperty ? (
          <AnalyticsSection
            title="Property intelligence"
            description={`Attributable real-estate value across every property, normalized into ${realEstate.preference.baseCurrency}.`}
          >
            <RealEstateCharts
              allocation={realEstate.allocation}
              history={realEstate.history}
              currency={realEstate.preference.baseCurrency}
            />
          </AnalyticsSection>
        ) : null}
      </div>
    </div>
  );
}
