import { EmptyDataState } from "@/components/empty-data-state";
import { HouseholdCharts } from "@/components/household-charts";
import { PageHeader } from "@/components/page-header";
import { PortfolioCharts } from "@/components/portfolio-charts";
import { RealEstateCharts } from "@/components/real-estate-charts";
import { SalaryCharts } from "@/components/salary-charts";
import { WealthMixCharts } from "@/components/wealth-mix-charts";
import { ZerodhaTradebookCharts } from "@/components/zerodha-tradebook-charts";
import { getHouseholdDashboard } from "@portfolio/api/household-queries";
import {
  getPortfolioOverview,
  getRealEstateHistory,
  getRealEstatePortfolio,
} from "@portfolio/api/portfolio-queries";
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
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 space-y-3">
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

  const [overview, tradebook, payslips, household, properties, allPropertyHistory] =
    await Promise.all([
      getPortfolioOverview(session.user.id),
      getZerodhaTradebookAnalytics(session.user.id),
      getSalaryPayslips(session.user.id),
      getHouseholdDashboard(session.user.id),
      getRealEstatePortfolio(session.user.id),
      getRealEstateHistory(session.user.id),
    ]);

  const baseCurrency = overview.preference.baseCurrency;
  const hasPortfolio = overview.assets.length > 0;
  const hasTradebook = tradebook.summary.trades > 0;
  const hasSalary = payslips.length > 0;
  const hasHousehold = household.configured && household.categoryBreakdown.length > 0;
  const hasProperty = properties.length > 0;
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

  const propertyCurrency = properties[0]?.currency ?? baseCurrency;
  const currencyProperties = properties.filter(
    (property) => property.currency === propertyCurrency,
  );
  const propertyTypes = [...new Set(currencyProperties.map((property) => property.propertyType))];
  const propertyAllocation = propertyTypes.map((propertyType) => ({
    category: propertyType,
    value: currencyProperties
      .filter((property) => property.propertyType === propertyType)
      .reduce((sum, property) => sum + property.ownedValue, 0),
  }));
  const propertyHistory = allPropertyHistory.filter((point) => point.currency === propertyCurrency);

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
            title="Wealth structure"
            description="Composition, liquidity and historical market value across your complete portfolio."
          >
            <WealthMixCharts
              allocation={overview.allocation}
              netWorth={overview.totals.netWorth}
              liquidValue={overview.totals.liquidValue}
              currency={baseCurrency}
            />
            <PortfolioCharts
              allocation={overview.allocation}
              equityHistory={overview.equityHistory}
              currency={baseCurrency}
              historyCurrency="INR"
              allocationTitle="Allocation concentration"
              historyTitle="Indian equity trajectory"
              historyDescription="Invested capital versus market value across imported snapshots."
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
            />
          </AnalyticsSection>
        ) : null}

        {hasProperty ? (
          <AnalyticsSection
            title="Property intelligence"
            description={`Attributable real-estate value and valuation history in ${propertyCurrency}.`}
          >
            <RealEstateCharts
              allocation={propertyAllocation}
              history={propertyHistory}
              currency={propertyCurrency}
            />
          </AnalyticsSection>
        ) : null}
      </div>
    </div>
  );
}
