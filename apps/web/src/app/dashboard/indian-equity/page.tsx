import { EmptyDataState } from "@/components/empty-data-state";
import { PageHeader } from "@/components/page-header";
import { PortfolioCharts } from "@/components/portfolio-charts";
import { SectionCards } from "@/components/section-cards";
import { TableCard } from "@/components/table-card";
import { UploadDialog } from "@/components/upload-dialog";
import { HoldingsDataTable } from "@/components/zerodha-data-tables";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import {
  getEquitySnapshotHistory,
  getLatestZerodhaPortfolio,
} from "@portfolio/api/portfolio-queries";
import { auth } from "@portfolio/auth";
import { Button } from "@portfolio/ui/components/button";
import { IndianRupeeIcon, LineChartIcon, RefreshCwIcon, TrendingUpIcon } from "lucide-react";
import { headers } from "next/headers";
import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

const xlsxAccept = ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function HoldingsImport() {
  return (
    <UploadDialog
      kind="zerodha_holdings"
      title="Import Zerodha holdings"
      description="Upload your latest holdings XLSX. Existing snapshots remain intact."
      accept={xlsxAccept}
      triggerLabel="Import holdings"
    />
  );
}

export default async function IndianEquityPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const [portfolio, history] = await Promise.all([
    getLatestZerodhaPortfolio(session.user.id),
    getEquitySnapshotHistory(session.user.id),
  ]);

  if (!portfolio) {
    return (
      <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col py-4 sm:py-5 md:py-6">
        <PageHeader
          title="Indian equity"
          description="Track current Zerodha holdings and preserve every valuation snapshot."
          action={<HoldingsImport />}
        />
        <div className="mt-4 px-4 lg:px-6">
          <EmptyDataState
            icon={LineChartIcon}
            title="No holdings yet"
            description="Import your latest Zerodha holdings file to build your current portfolio and valuation history."
            action={<HoldingsImport />}
          />
        </div>
      </div>
    );
  }

  const holdings = portfolio.holdings;
  const investedValue = holdings.reduce((sum, holding) => sum + holding.investedValue, 0);
  const marketValue = holdings.reduce((sum, holding) => sum + holding.marketValue, 0);
  const pnl = holdings.reduce((sum, holding) => sum + holding.unrealizedPnl, 0);
  const allocation = [...new Set(holdings.map((holding) => holding.category))].map((category) => ({
    category,
    value: holdings
      .filter((holding) => holding.category === category)
      .reduce((sum, holding) => sum + holding.marketValue, 0),
  }));

  return (
    <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 py-4 sm:py-5 md:gap-5 md:py-6">
      <PageHeader
        title="Indian equity"
        description="Current holdings stay separate from transaction intelligence, while every upload adds to your valuation history."
        action={
          <>
            <Button
              variant="outline"
              size="sm"
              render={<Link href={"/dashboard/mutual-funds" as Route} />}
            >
              Fund intelligence
            </Button>
            <Button
              variant="outline"
              size="sm"
              render={<Link href={"/dashboard/tradebook" as Route} />}
            >
              Tradebook insights
            </Button>
            <HoldingsImport />
          </>
        }
      />
      <SectionCards
        items={[
          {
            label: "Market value",
            value: formatCurrency(marketValue, "INR"),
            badge: `${holdings.length} holdings`,
            note: portfolio.statementDate
              ? `As of ${formatDate(portfolio.statementDate)}`
              : "Latest upload",
            detail: `${history.length} saved snapshots`,
            icon: LineChartIcon,
          },
          {
            label: "Total return",
            value: formatCurrency(pnl, "INR"),
            badge: formatPercent(investedValue === 0 ? 0 : pnl / investedValue, 2),
            note: "Unrealized P&L",
            detail: "Before taxes and exit costs",
            icon: TrendingUpIcon,
          },
          {
            label: "Cost basis",
            value: formatCurrency(investedValue, "INR"),
            badge: "Current portfolio",
            note: "Statement-reported investment",
            detail: "Not reconstructed from trades",
            icon: IndianRupeeIcon,
          },
          {
            label: "Data history",
            value: `${history.length} snapshots`,
            badge: portfolio.statementDate ? formatDate(portfolio.statementDate) : "Latest",
            note: "Uploads never overwrite history",
            detail: "Use Tradebook for cash-flow returns",
            icon: RefreshCwIcon,
          },
        ]}
      />
      <PortfolioCharts allocation={allocation} equityHistory={history} currency="INR" />
      <div className="px-4 lg:px-6">
        <TableCard
          dataTable={false}
          title="Current holdings"
          description="Latest Zerodha holdings snapshot for this account."
        >
          <HoldingsDataTable data={holdings} />
        </TableCard>
      </div>
    </div>
  );
}
