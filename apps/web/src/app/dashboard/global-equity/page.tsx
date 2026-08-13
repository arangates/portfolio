import { EmptyDataState } from "@/components/empty-data-state";
import { PageHeader } from "@/components/page-header";
import { PortfolioCharts } from "@/components/portfolio-charts";
import { SectionCards } from "@/components/section-cards";
import { TableCard } from "@/components/table-card";
import { UploadDialog } from "@/components/upload-dialog";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import {
  getDegiroAnalytics,
  getGlobalEquityPortfolio,
  getRecentDegiroEntries,
} from "@portfolio/api/portfolio-queries";
import { auth } from "@portfolio/auth";
import { Badge } from "@portfolio/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@portfolio/ui/components/table";
import { CircleDollarSignIcon, Globe2Icon, LineChartIcon, TrendingUpIcon } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function GlobalEquityPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const [portfolio, analytics, entries] = await Promise.all([
    getGlobalEquityPortfolio(session.user.id),
    getDegiroAnalytics(session.user.id),
    getRecentDegiroEntries(session.user.id),
  ]);
  const marketValue = portfolio.holdings.reduce((sum, holding) => sum + holding.marketValue, 0);
  const costBasis = portfolio.holdings.reduce((sum, holding) => sum + holding.costBasis, 0);
  const unrealizedPnl = marketValue - costBasis;
  const allocation = portfolio.holdings.slice(0, 10).map((holding) => ({
    category: holding.name,
    value: holding.marketValue,
  }));
  const hasData = portfolio.history.length > 0 || entries.length > 0;

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <PageHeader
          title="Global equity"
          description="Degiro trades, income and fees live here—separate from EUR bank cash. Overlapping exports are deduplicated and earlier transactions are retained."
          action={
            <UploadDialog
              kind="degiro"
              title="Import Degiro exports"
              description="Select Transactions and Account CSV exports."
              accept=".csv,text/csv"
              multiple
            />
          }
        />
        {!hasData ? (
          <div className="px-4 lg:px-6">
            <EmptyDataState
              icon={Globe2Icon}
              title="No global equity activity"
              description="Import your Degiro Transactions and Account CSV exports to reconstruct holdings and returns."
              action={
                <UploadDialog
                  kind="degiro"
                  title="Import Degiro exports"
                  description="Select Transactions and Account CSV exports."
                  accept=".csv,text/csv"
                  multiple
                />
              }
            />
          </div>
        ) : (
          <>
            <SectionCards
              items={[
                {
                  label: "Estimated market value",
                  value: formatCurrency(marketValue, "EUR"),
                  badge: `${portfolio.holdings.length} holdings`,
                  note: "Based on the latest imported trade price",
                  detail: portfolio.lastTradeAt
                    ? `Last trade ${formatDate(portfolio.lastTradeAt)}`
                    : "No current positions",
                  icon: LineChartIcon,
                },
                {
                  label: "Open cost basis",
                  value: formatCurrency(costBasis, "EUR"),
                  badge: "Ledger derived",
                  note: "Moving-average cost of open positions",
                  detail: "Includes imported transaction totals",
                  icon: CircleDollarSignIcon,
                },
                {
                  label: "Unrealized P&L",
                  value: formatCurrency(unrealizedPnl, "EUR"),
                  badge: formatPercent(costBasis === 0 ? 0 : unrealizedPnl / costBasis, 2),
                  note: "Estimate at latest imported trade prices",
                  detail: "Not a live market quote",
                  icon: TrendingUpIcon,
                },
                {
                  label: "Realized P&L",
                  value: formatCurrency(portfolio.realizedPnl, "EUR"),
                  badge: `${formatCurrency(analytics.dividends, "EUR")} dividends`,
                  note: "Sales proceeds minus moving-average cost",
                  detail: `${formatCurrency(Math.abs(analytics.fees), "EUR")} fees tracked`,
                  icon: Globe2Icon,
                },
              ]}
            />
            {portfolio.history.length > 0 ? (
              <PortfolioCharts
                allocation={allocation}
                equityHistory={portfolio.history}
                currency="EUR"
                allocationTitle="Largest positions"
                historyTitle="Global equity history"
                historyDescription="Open cost basis and estimated value reconstructed from imported trades."
              />
            ) : null}
            <div className="grid gap-4 px-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:px-6">
              <TableCard
                title="Current holdings"
                description="Reconstructed from all account-scoped Degiro trades."
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Instrument</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Average</TableHead>
                      <TableHead className="text-right">Latest trade</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">P&L</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {portfolio.holdings.map((holding) => (
                      <TableRow key={holding.isin}>
                        <TableCell>
                          <div className="max-w-64 truncate font-medium">{holding.name}</div>
                          <div className="text-xs text-muted-foreground">{holding.isin}</div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {holding.quantity.toLocaleString("en", { maximumFractionDigits: 6 })}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(holding.averagePrice, "EUR")}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(holding.latestPrice, "EUR")}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(holding.marketValue, "EUR")}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(holding.unrealizedPnl, "EUR")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableCard>
              <TableCard title="Recent activity" description="Latest imported broker ledger rows.">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.slice(0, 12).map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{formatDate(entry.occurredAt)}</TableCell>
                        <TableCell>
                          <div className="max-w-48 truncate font-medium">
                            {entry.product ?? entry.description ?? "Activity"}
                          </div>
                          <Badge variant="outline">{entry.entryType.replaceAll("_", " ")}</Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(Number(entry.netAmount ?? 0), entry.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableCard>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
