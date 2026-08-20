import { EmptyDataState } from "@/components/empty-data-state";
import { PageHeader } from "@/components/page-header";
import { SectionCards } from "@/components/section-cards";
import { TableCard } from "@/components/table-card";
import { UploadDialog } from "@/components/upload-dialog";
import {
  FinancialYearsDataTable,
  FundActivityDataTable,
  TradebookImportsDataTable,
} from "@/components/zerodha-data-tables";
import { ZerodhaTradebookCharts } from "@/components/zerodha-tradebook-charts";
import { formatCurrency, formatPercent } from "@/lib/format";
import { getLatestZerodhaPortfolio } from "@portfolio/api/portfolio-queries";
import { getZerodhaTradebookAnalytics } from "@portfolio/api/zerodha-tradebook-queries";
import { auth } from "@portfolio/auth";
import { CalendarRangeIcon, IndianRupeeIcon, Repeat2Icon, ShieldCheckIcon } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const xlsxAccept = ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function TradebookImport() {
  return (
    <UploadDialog
      kind="zerodha_tradebook"
      title="Import Zerodha tradebooks"
      description="Select annual Mutual Fund or Equity tradebook XLSX files. Overlapping rows are deduplicated."
      accept={xlsxAccept}
      multiple
      triggerLabel="Import tradebooks"
    />
  );
}

export default async function TradebookPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const [tradebook, portfolio] = await Promise.all([
    getZerodhaTradebookAnalytics(session.user.id),
    getLatestZerodhaPortfolio(session.user.id),
  ]);

  if (tradebook.summary.trades === 0) {
    return (
      <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col py-4 sm:py-5 md:py-6">
        <PageHeader
          title="Tradebook insights"
          description="Turn complete Zerodha transaction history into contribution, redemption and data-quality intelligence."
          action={<TradebookImport />}
        />
        <div className="mt-4 px-4 lg:px-6">
          <EmptyDataState
            icon={CalendarRangeIcon}
            title="No tradebook history"
            description="Import every available annual tradebook together. Selvam safely removes overlaps between files."
            action={<TradebookImport />}
          />
        </div>
      </div>
    );
  }

  const heldIsins = new Set(portfolio?.holdings.map((holding) => holding.isin) ?? []);
  const funds = tradebook.funds.map((fund) => ({ ...fund, held: heldIsins.has(fund.isin) }));

  return (
    <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 py-4 sm:py-5 md:gap-5 md:py-6">
      <PageHeader
        title="Tradebook insights"
        description="Deduplicated multi-year cash flows, investing behaviour and explicit confidence checks—separate from current holdings."
        action={<TradebookImport />}
      />
      <SectionCards
        items={[
          {
            label: "Net cash invested",
            value: formatCurrency(tradebook.summary.netInvested, "INR"),
            badge: `${tradebook.summary.trades} trades`,
            note: `${formatCurrency(tradebook.summary.totalBuys, "INR")} purchased`,
            detail: `${formatCurrency(tradebook.summary.totalSells, "INR")} redeemed`,
            icon: IndianRupeeIcon,
          },
          {
            label: "Contribution consistency",
            value: formatPercent(tradebook.summary.contributionConsistency, 0),
            badge: `${tradebook.summary.monthsWithBuys}/${tradebook.summary.coveredMonths} months`,
            note: `${formatCurrency(tradebook.summary.averageMonthlyBuy, "INR")} per active month`,
            detail: "Across imported coverage",
            icon: CalendarRangeIcon,
          },
          {
            label: "Redemption intensity",
            value: formatPercent(tradebook.summary.sellToBuyRatio, 1),
            badge: `${tradebook.funds.filter((fund) => fund.sellTrades > 0).length} funds sold`,
            note: "Redemptions as a share of purchases",
            detail: `Largest fund ${formatPercent(tradebook.summary.largestFundContributionShare, 1)}`,
            icon: Repeat2Icon,
          },
          {
            label: "Return readiness",
            value: tradebook.summary.performanceReady
              ? "Complete"
              : `${tradebook.summary.incompleteInstrumentCount} gaps`,
            badge: `${tradebook.summary.importFiles} files`,
            note: tradebook.summary.performanceReady
              ? "Sales have known acquisition history"
              : "Earlier buys are still needed",
            detail: "Avoids false return precision",
            icon: ShieldCheckIcon,
          },
        ]}
      />
      {!tradebook.summary.performanceReady ? (
        <div className="px-4 lg:px-6">
          <div className="flex gap-3 rounded-lg border bg-muted/35 p-4 text-sm">
            <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium">Returns are intentionally withheld</p>
              <p className="text-muted-foreground">
                Cash flows are exact, but realized P&L, CAGR and XIRR stay hidden until every
                redemption can be matched to earlier units.
              </p>
            </div>
          </div>
        </div>
      ) : null}
      <ZerodhaTradebookCharts monthly={tradebook.monthly} funds={tradebook.funds} />
      <div className="grid min-w-0 gap-4 px-4 xl:grid-cols-2 lg:px-6">
        <TableCard
          dataTable={false}
          title="Financial-year coverage"
          description="Unique activity after trade-level deduplication."
        >
          <FinancialYearsDataTable data={tradebook.financialYears} />
        </TableCard>
        <TableCard
          dataTable={false}
          title="Import quality"
          description="Every source remains auditable; overlaps are counted once."
        >
          <TradebookImportsDataTable data={tradebook.imports} />
        </TableCard>
      </div>
      <div className="px-4 lg:px-6">
        <TableCard
          dataTable={false}
          title="Fund activity"
          description="Contribution and redemption intelligence by ISIN."
        >
          <FundActivityDataTable data={funds} />
        </TableCard>
      </div>
    </div>
  );
}
