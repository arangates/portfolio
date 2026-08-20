import { DataTable } from "@/components/data-table";
import { EmptyDataState } from "@/components/empty-data-state";
import { PageHeader } from "@/components/page-header";
import { PortfolioCharts } from "@/components/portfolio-charts";
import { PortfolioRecordDialog } from "@/components/portfolio-record-dialog";
import { SectionCards } from "@/components/section-cards";
import { UploadDialog } from "@/components/upload-dialog";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { getPortfolioOverview } from "@portfolio/api/portfolio-queries";
import { auth } from "@portfolio/auth";
import { Badge } from "@portfolio/ui/components/badge";
import { DatabaseIcon, PieChartIcon, TrendingUpIcon, WalletCardsIcon } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const overview = await getPortfolioOverview(session.user.id);
  const { baseCurrency } = overview.preference;
  const hasAssets = overview.assets.length > 0;
  const equityReturn =
    overview.totals.equityInvested === 0
      ? 0
      : overview.totals.equityPnl / overview.totals.equityInvested;

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
                },
                {
                  label: "Indian equity P&L",
                  value: formatCurrency(overview.totals.equityPnl, "INR"),
                  badge: formatPercent(equityReturn, 2),
                  note: "Latest imported position snapshot",
                  detail: `${overview.equityHistory.length} historical statement${overview.equityHistory.length === 1 ? "" : "s"}`,
                  icon: TrendingUpIcon,
                },
                {
                  label: "Data coverage",
                  value:
                    overview.unconvertedCurrencies.length === 0
                      ? "Complete"
                      : `${overview.unconvertedCurrencies.length} FX gap${overview.unconvertedCurrencies.length === 1 ? "" : "s"}`,
                  badge: overview.unconvertedCurrencies.length === 0 ? "Valued" : "Action needed",
                  note: "Currencies included in net worth",
                  detail:
                    overview.unconvertedCurrencies.length === 0
                      ? `All values converted to ${baseCurrency}`
                      : `Add rates for ${overview.unconvertedCurrencies.join(", ")}`,
                  icon: DatabaseIcon,
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
              allocation={overview.allocation}
              equityHistory={overview.equityHistory}
              currency={baseCurrency}
            />
            <DataTable assets={overview.assets} baseCurrency={baseCurrency} />
          </>
        )}
      </div>
    </div>
  );
}
