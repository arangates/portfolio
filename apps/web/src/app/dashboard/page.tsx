import { DataTable } from "@/components/data-table";
import { FinancialIntelligencePanel } from "@/components/financial-intelligence-panel";
import { EmptyDataState } from "@/components/empty-data-state";
import { PageHeader } from "@/components/page-header";
import { PortfolioCharts } from "@/components/portfolio-charts";
import { PortfolioRecordDialog } from "@/components/portfolio-record-dialog";
import { SectionCards } from "@/components/section-cards";
import { UploadDialog } from "@/components/upload-dialog";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { getFinancialIntelligence } from "@portfolio/api/financial-intelligence-queries";
import { getPortfolioOverview } from "@portfolio/api/portfolio-queries";
import { auth } from "@portfolio/auth";
import { Badge } from "@portfolio/ui/components/badge";
import {
  DatabaseIcon,
  LandmarkIcon,
  PieChartIcon,
  TrendingUpIcon,
  WalletCardsIcon,
} from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const [overview, intelligence] = await Promise.all([
    getPortfolioOverview(session.user.id),
    getFinancialIntelligence(session.user.id),
  ]);
  const { baseCurrency } = overview.preference;
  const hasAssets = overview.assets.length > 0;
  const equityReturn =
    overview.totals.equityInvested === 0
      ? 0
      : overview.totals.equityPnl / overview.totals.equityInvested;
  const longTermValue = Math.max(0, overview.totals.netWorth - overview.totals.liquidValue);
  const largestAllocation = overview.allocation.at(0);

  return (
    <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col">
      <div className="flex flex-col gap-4 py-4 sm:py-5 md:gap-5 md:py-6">
        <PageHeader
          title="Portfolio overview"
          description="Your latest net worth, liquidity, allocation and performance in one view."
          action={
            <PortfolioRecordDialog
              kind="manual_asset"
              values={{ ownershipShare: 100, riskLevel: "moderate", currency: baseCurrency }}
            />
          }
        />

        <FinancialIntelligencePanel data={intelligence} compact />

        {!hasAssets ? (
          <div className="px-4 lg:px-6">
            <EmptyDataState
              icon={DatabaseIcon}
              title="Build your portfolio"
              description="Import a broker statement or add an asset to create your first portfolio snapshot."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <UploadDialog
                    kind="zerodha_holdings"
                    title="Import Zerodha holdings"
                    description="Upload one holdings XLSX file."
                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  />
                  <PortfolioRecordDialog
                    kind="manual_asset"
                    values={{ ownershipShare: 100, riskLevel: "moderate", currency: baseCurrency }}
                  />
                </div>
              }
            />
          </div>
        ) : (
          <>
            <SectionCards
              items={[
                {
                  label: "Net worth",
                  value: formatCurrency(overview.totals.netWorth, baseCurrency),
                  badge: `${overview.assets.length} positions`,
                  note: "Converted into your base currency",
                  detail: overview.asOf
                    ? `Latest valuation ${formatDate(overview.asOf)}`
                    : "Current data",
                  icon: WalletCardsIcon,
                  href: "/dashboard/analytics#wealth-flow",
                },
                {
                  label: "Liquid assets",
                  value: formatCurrency(overview.totals.liquidValue, baseCurrency),
                  badge: formatPercent(
                    overview.totals.netWorth === 0
                      ? 0
                      : overview.totals.liquidValue / overview.totals.netWorth,
                    0,
                  ),
                  note: "Cash and readily sellable holdings",
                  detail: "Driven by each record’s liquidity setting",
                  icon: PieChartIcon,
                  href: "/dashboard/analytics#liquidity-structure",
                },
                overview.equityBreakdown.length > 0
                  ? {
                      label: "Indian equity P&L",
                      value: formatCurrency(overview.totals.equityPnl, "INR"),
                      badge: formatPercent(equityReturn, 2),
                      note: "Latest imported position snapshot",
                      detail: `${overview.equityHistory.length} historical statement${overview.equityHistory.length === 1 ? "" : "s"}`,
                      icon: TrendingUpIcon,
                      href: "/dashboard/analytics#equity-performance" as const,
                    }
                  : {
                      label: "Largest allocation",
                      value: largestAllocation?.category ?? "—",
                      badge: formatPercent(
                        overview.totals.netWorth === 0
                          ? 0
                          : (largestAllocation?.value ?? 0) / overview.totals.netWorth,
                        0,
                      ),
                      note: largestAllocation
                        ? formatCurrency(largestAllocation.value, baseCurrency)
                        : "No valued category",
                      detail: "Share of current net worth",
                      icon: PieChartIcon,
                      href: "/dashboard/analytics#wealth-mix" as const,
                    },
                {
                  label: "Long-term assets",
                  value: formatCurrency(longTermValue, baseCurrency),
                  badge: formatPercent(
                    overview.totals.netWorth === 0 ? 0 : longTermValue / overview.totals.netWorth,
                    0,
                  ),
                  note: "Wealth not classified as readily liquid",
                  detail: "Property and other long-horizon assets",
                  icon: LandmarkIcon,
                  href: "/dashboard/analytics#wealth-flow",
                },
              ]}
            />
            {overview.unconvertedCurrencies.length > 0 ? (
              <div className="flex items-center gap-2 px-4 text-sm text-muted-foreground lg:px-6">
                <Badge variant="outline">Excluded from totals</Badge>
                Add stored FX rates in Settings for {overview.unconvertedCurrencies.join(", ")}.
              </div>
            ) : null}
            <PortfolioCharts
              allocation={overview.liquidAllocation}
              equityHistory={overview.equityHistory}
              currency={baseCurrency}
              historyCurrency="INR"
              allocationTitle="Liquid asset breakdown"
              allocationDescription={`Cash and readily sellable assets only, grouped by source in ${baseCurrency}.`}
              allocationMetricLabel="liquid value"
            />
            <DataTable assets={overview.assets} baseCurrency={baseCurrency} />
          </>
        )}
      </div>
    </div>
  );
}
