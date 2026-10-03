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

import { AnalyticsTabs } from "@/components/analytics-tabs";
import { getCashFlowDashboard } from "@portfolio/api/cash-flow-queries";
import { MonthlyCashFlowCard } from "@/components/monthly-cash-flow-card";

async function WealthTab({ userId }: { userId: string }) {
  const overview = await getPortfolioOverview(userId);
  if (overview.assets.length === 0)
    return (
      <div className="px-4 lg:px-6">
        <EmptyDataState
          icon={ChartNoAxesCombinedIcon}
          title="No portfolio data"
          description="Add an asset to see your wealth structure."
        />
      </div>
    );
  const baseCurrency = overview.preference.baseCurrency;
  return (
    <div className="flex flex-col gap-7">
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
    </div>
  );
}

async function PropertyTab({ userId }: { userId: string }) {
  const realEstate = await getRealEstateDashboard(userId);
  if (realEstate.properties.length === 0)
    return (
      <div className="px-4 lg:px-6">
        <EmptyDataState
          icon={ChartNoAxesCombinedIcon}
          title="No real estate data"
          description="Add a property to see real estate analytics."
        />
      </div>
    );
  return (
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
  );
}

async function CashFlowTab({ userId }: { userId: string }) {
  const [unified, personal, joint] = await Promise.all([
    getCashFlowDashboard(userId, "all"),
    getCashFlowDashboard(userId, "personal"),
    getCashFlowDashboard(userId, "joint"),
  ]);
  const anyConfigured = unified.configured || personal.configured || joint.configured;
  if (!anyConfigured)
    return (
      <div className="px-4 lg:px-6">
        <EmptyDataState
          icon={ChartNoAxesCombinedIcon}
          title="No cash flow data"
          description="Import bank statements to see cash flow analytics."
        />
      </div>
    );

  return (
    <AnalyticsSection
      title="Cash flow intelligence"
      description="Monthly insights across your unified, personal, and household cash flows."
    >
      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2 lg:px-6 px-4">
        {unified.configured ? <MonthlyCashFlowCard data={unified} scope="all" /> : null}
        {personal.configured ? <MonthlyCashFlowCard data={personal} scope="personal" /> : null}
        {joint.configured ? <MonthlyCashFlowCard data={joint} scope="joint" /> : null}
      </div>
    </AnalyticsSection>
  );
}

async function IncomeTab({ userId }: { userId: string }) {
  const payslips = await getSalaryPayslips(userId);
  if (payslips.length === 0)
    return (
      <div className="px-4 lg:px-6">
        <EmptyDataState
          icon={ChartNoAxesCombinedIcon}
          title="No income data"
          description="Import payslips to see income analytics."
        />
      </div>
    );

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
    <AnalyticsSection
      title="Income intelligence"
      description="Recurring earnings, special payments, take-home pay and deductions from payslips."
    >
      <SalaryCharts data={salaryData} currency={salaryCurrency} />
    </AnalyticsSection>
  );
}

async function HouseholdTab({ userId }: { userId: string }) {
  const household = await getHouseholdDashboard(userId);
  if (!household.configured || household.categoryBreakdown.length === 0)
    return (
      <div className="px-4 lg:px-6">
        <EmptyDataState
          icon={ChartNoAxesCombinedIcon}
          title="No household data"
          description="Configure household categories to see analytics."
        />
      </div>
    );

  return (
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
  );
}

async function TradingTab({ userId }: { userId: string }) {
  const tradebook = await getZerodhaTradebookAnalytics(userId);
  if (tradebook.summary.trades === 0)
    return (
      <div className="px-4 lg:px-6">
        <EmptyDataState
          icon={ChartNoAxesCombinedIcon}
          title="No trading data"
          description="Import tradebook to see investment behaviour."
        />
      </div>
    );

  return (
    <AnalyticsSection
      title="Investment behaviour"
      description="How contributions and redemptions evolved across imported Zerodha tradebooks."
    >
      <ZerodhaTradebookCharts monthly={tradebook.monthly} funds={tradebook.funds} />
    </AnalyticsSection>
  );
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const tab = (await searchParams).tab || "wealth";
  const userId = session.user.id;

  return (
    <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col">
      <div className="flex min-w-0 flex-col gap-5 py-4 sm:py-5 md:gap-6 md:py-6">
        <PageHeader
          title="Analytics"
          description="Interactive wealth, cash-flow, income and planning intelligence in one focused workspace."
        />
        <AnalyticsTabs
          defaultValue={tab}
          wealth={tab === "wealth" ? <WealthTab userId={userId} /> : null}
          property={tab === "property" ? <PropertyTab userId={userId} /> : null}
          cashFlow={tab === "cash-flow" ? <CashFlowTab userId={userId} /> : null}
          income={tab === "income" ? <IncomeTab userId={userId} /> : null}
          household={tab === "household" ? <HouseholdTab userId={userId} /> : null}
          trading={tab === "trading" ? <TradingTab userId={userId} /> : null}
        />
      </div>
    </div>
  );
}
