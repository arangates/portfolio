import { EmptyDataState } from "@/components/empty-data-state";
import { PageHeader } from "@/components/page-header";
import { PortfolioCharts } from "@/components/portfolio-charts";
import { SectionCards } from "@/components/section-cards";
import { TableCard } from "@/components/table-card";
import { UploadDialog } from "@/components/upload-dialog";
import { ZerodhaTradebookCharts } from "@/components/zerodha-tradebook-charts";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import {
  getEquitySnapshotHistory,
  getLatestZerodhaPortfolio,
} from "@portfolio/api/portfolio-queries";
import { getZerodhaTradebookAnalytics } from "@portfolio/api/zerodha-tradebook-queries";
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
import {
  CalendarRangeIcon,
  CircleDashedIcon,
  IndianRupeeIcon,
  LineChartIcon,
  Repeat2Icon,
  ShieldCheckIcon,
  TrendingUpIcon,
} from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const xlsxAccept = ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function ImportActions() {
  return (
    <div className="flex flex-wrap gap-2">
      <UploadDialog
        kind="zerodha_tradebook"
        title="Import Zerodha tradebooks"
        description="Select annual Mutual Fund or Equity tradebook XLSX files. Overlapping trades are deduplicated."
        accept={xlsxAccept}
        multiple
        triggerLabel="Import tradebooks"
      />
      <UploadDialog
        kind="zerodha_holdings"
        title="Import Zerodha holdings"
        description="Upload one holdings XLSX file."
        accept={xlsxAccept}
        triggerLabel="Import holdings"
      />
    </div>
  );
}

export default async function IndianEquityPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const [portfolio, history, tradebook] = await Promise.all([
    getLatestZerodhaPortfolio(session.user.id),
    getEquitySnapshotHistory(session.user.id),
    getZerodhaTradebookAnalytics(session.user.id),
  ]);

  if (!portfolio && tradebook.summary.trades === 0) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <PageHeader
            title="Indian investments"
            description="Holdings provide current valuations; tradebooks provide complete transaction history."
          />
          <div className="px-4 lg:px-6">
            <EmptyDataState
              icon={LineChartIcon}
              title="No Zerodha data"
              description="Import the latest holdings and all available annual tradebooks. The application keeps both histories without double counting."
              action={<ImportActions />}
            />
          </div>
        </div>
      </div>
    );
  }

  const holdings = portfolio?.holdings ?? [];
  const investedValue = holdings.reduce((sum, holding) => sum + holding.investedValue, 0);
  const marketValue = holdings.reduce((sum, holding) => sum + holding.marketValue, 0);
  const pnl = holdings.reduce((sum, holding) => sum + holding.unrealizedPnl, 0);
  const categories = new Set(holdings.map((holding) => holding.category));
  const allocation = [...categories].map((category) => ({
    category,
    value: holdings
      .filter((holding) => holding.category === category)
      .reduce((sum, holding) => sum + holding.marketValue, 0),
  }));
  const currentIsins = new Set(holdings.map((holding) => holding.isin));

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <PageHeader
          title="Indian investments"
          description="Current Zerodha holdings plus deduplicated, multi-year trade history. Returns are shown only when their source history is complete."
          action={<ImportActions />}
        />

        {portfolio ? (
          <>
            <SectionCards
              items={[
                {
                  label: "Market value",
                  value: formatCurrency(marketValue, "INR"),
                  badge: `${holdings.length} holdings`,
                  note: "Latest combined statement",
                  detail: portfolio.statementDate
                    ? `As of ${formatDate(portfolio.statementDate)}`
                    : "Latest upload",
                  icon: LineChartIcon,
                },
                {
                  label: "Invested value",
                  value: formatCurrency(investedValue, "INR"),
                  badge: "Current cost basis",
                  note: "Supplied by the holdings statement",
                  detail: "Retained for every snapshot",
                  icon: IndianRupeeIcon,
                },
                {
                  label: "Unrealized P&L",
                  value: formatCurrency(pnl, "INR"),
                  badge: formatPercent(investedValue === 0 ? 0 : pnl / investedValue, 2),
                  note: "Latest position profit",
                  detail: "Before taxes and exit costs",
                  icon: TrendingUpIcon,
                },
                {
                  label: "Diversification",
                  value: `${categories.size} categories`,
                  badge: `${history.length} snapshots`,
                  note: "Asset classes in the latest statement",
                  detail: "History grows with each holdings import",
                  icon: CircleDashedIcon,
                },
              ]}
            />
            <PortfolioCharts allocation={allocation} equityHistory={history} currency="INR" />
            <div className="px-4 lg:px-6">
              <TableCard
                title="Current holdings"
                description="Latest holdings snapshot for this signed-in account; tradebook rows never overwrite it."
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Instrument</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Average</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">P&L</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holdings.map((holding) => (
                      <TableRow key={holding.isin}>
                        <TableCell>
                          <div className="font-medium">{holding.name}</div>
                          <div className="text-muted-foreground text-xs">{holding.isin}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{holding.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {holding.quantity.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(holding.averagePrice, "INR")}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(holding.currentPrice, "INR")}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(holding.marketValue, "INR")}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(holding.unrealizedPnl, "INR")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableCard>
            </div>
          </>
        ) : (
          <div className="px-4 lg:px-6">
            <EmptyDataState
              icon={LineChartIcon}
              title="Current valuation unavailable"
              description="Trade history is available below. Import a holdings statement to add current market value and unrealized performance."
              action={
                <UploadDialog
                  kind="zerodha_holdings"
                  title="Import Zerodha holdings"
                  description="Upload one holdings XLSX file."
                  accept={xlsxAccept}
                  triggerLabel="Import holdings"
                />
              }
            />
          </div>
        )}

        {tradebook.summary.trades > 0 ? (
          <>
            <div className="px-4 lg:px-6">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Tradebook intelligence</h2>
                <p className="text-muted-foreground text-sm">
                  Cash-flow analytics use unique trades across every imported financial year.
                </p>
              </div>
            </div>
            <SectionCards
              items={[
                {
                  label: "Net cash invested",
                  value: formatCurrency(tradebook.summary.netInvested, "INR"),
                  badge: `${tradebook.summary.trades} unique trades`,
                  note: `${formatCurrency(tradebook.summary.totalBuys, "INR")} purchased`,
                  detail: `${formatCurrency(tradebook.summary.totalSells, "INR")} redeemed`,
                  icon: IndianRupeeIcon,
                },
                {
                  label: "Contribution consistency",
                  value: formatPercent(tradebook.summary.contributionConsistency, 0),
                  badge: `${tradebook.summary.monthsWithBuys}/${tradebook.summary.coveredMonths} months`,
                  note: `${formatCurrency(tradebook.summary.averageMonthlyBuy, "INR")} average active month`,
                  detail: "Based on months covered by imported trades",
                  icon: CalendarRangeIcon,
                },
                {
                  label: "Redemption intensity",
                  value: formatPercent(tradebook.summary.sellToBuyRatio, 1),
                  badge: `${tradebook.funds.filter((fund) => fund.sellTrades > 0).length} funds sold`,
                  note: "Redemptions ÷ purchases",
                  detail: `Largest fund received ${formatPercent(tradebook.summary.largestFundContributionShare, 1)} of purchases`,
                  icon: Repeat2Icon,
                },
                {
                  label: "Performance readiness",
                  value: tradebook.summary.performanceReady
                    ? "Ready"
                    : `${tradebook.summary.incompleteInstrumentCount} gaps`,
                  badge: `${tradebook.summary.importFiles} source files`,
                  note: tradebook.summary.performanceReady
                    ? "Every sale has known acquisition history"
                    : "Earlier buys are missing for some sold units",
                  detail:
                    tradebook.summary.realizedPnl == null
                      ? "Realized return withheld to avoid false precision"
                      : `Realized P&L ${formatCurrency(tradebook.summary.realizedPnl, "INR")}`,
                  icon: ShieldCheckIcon,
                },
              ]}
            />
            {!tradebook.summary.performanceReady ? (
              <div className="px-4 lg:px-6">
                <div className="border-border bg-muted/40 flex gap-3 rounded-lg border p-4 text-sm">
                  <ShieldCheckIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="font-medium">
                      More historical tradebooks are needed for trustworthy realized returns
                    </p>
                    <p className="text-muted-foreground">
                      Cash flows and purchase patterns below are exact. Realized P&L, CAGR and XIRR
                      remain hidden until every redemption can be matched to earlier acquired units.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            <ZerodhaTradebookCharts monthly={tradebook.monthly} funds={tradebook.funds} />
            <div className="grid gap-4 px-4 xl:grid-cols-2 lg:px-6">
              <TableCard
                title="Financial-year coverage"
                description="Unique activity after trade-level deduplication across overlapping files."
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Purchases</TableHead>
                      <TableHead className="text-right">Redemptions</TableHead>
                      <TableHead className="text-right">Net invested</TableHead>
                      <TableHead className="text-right">Trades</TableHead>
                      <TableHead className="text-right">Active months</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tradebook.financialYears.map((year) => (
                      <TableRow key={year.financialYear}>
                        <TableCell className="font-medium">{year.financialYear}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(year.buys, "INR")}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(year.sells, "INR")}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(year.netInvested, "INR")}
                        </TableCell>
                        <TableCell className="text-right">{year.trades}</TableCell>
                        <TableCell className="text-right">{year.activeMonths}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableCard>
              <TableCard
                title="Import quality"
                description="Every file remains auditable; overlapping trade rows are counted once."
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File</TableHead>
                      <TableHead>Coverage end</TableHead>
                      <TableHead className="text-right">Rows</TableHead>
                      <TableHead className="text-right">New</TableHead>
                      <TableHead className="text-right">Overlapping</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tradebook.imports.slice(0, 10).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="max-w-64 truncate font-medium">
                          {item.fileName}
                        </TableCell>
                        <TableCell>{item.statementDate ?? "—"}</TableCell>
                        <TableCell className="text-right">{item.rowCount}</TableCell>
                        <TableCell className="text-right">{item.insertedRows}</TableCell>
                        <TableCell className="text-right">{item.skippedRows}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableCard>
            </div>
            <div className="px-4 lg:px-6">
              <TableCard
                title="Fund activity"
                description="Contribution and redemption intelligence by ISIN. Current-holding status comes from the latest holdings file."
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fund</TableHead>
                      <TableHead>Current</TableHead>
                      <TableHead className="text-right">Purchases</TableHead>
                      <TableHead className="text-right">Redemptions</TableHead>
                      <TableHead className="text-right">Average buy NAV</TableHead>
                      <TableHead className="text-right">Trades</TableHead>
                      <TableHead>History quality</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tradebook.funds.map((fund) => (
                      <TableRow key={fund.isin}>
                        <TableCell>
                          <div className="font-medium">{fund.name}</div>
                          <div className="text-muted-foreground text-xs">{fund.isin}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {currentIsins.has(fund.isin) ? "Held" : "Not in latest file"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(fund.buyAmount, "INR")}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(fund.sellAmount, "INR")}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {fund.averageBuyPrice == null
                            ? "—"
                            : formatCurrency(fund.averageBuyPrice, "INR")}
                        </TableCell>
                        <TableCell className="text-right">
                          {fund.buyTrades + fund.sellTrades}
                        </TableCell>
                        <TableCell>
                          <Badge variant={fund.historyComplete ? "secondary" : "outline"}>
                            {fund.historyComplete ? "Complete in imports" : "Earlier buys needed"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableCard>
            </div>
          </>
        ) : (
          <div className="px-4 lg:px-6">
            <EmptyDataState
              icon={CalendarRangeIcon}
              title="Add transaction history"
              description="Select annual Zerodha tradebooks together to unlock contribution patterns, redemption activity and performance-readiness checks."
              action={
                <UploadDialog
                  kind="zerodha_tradebook"
                  title="Import Zerodha tradebooks"
                  description="Select up to 10 annual tradebook XLSX files."
                  accept={xlsxAccept}
                  multiple
                  triggerLabel="Import tradebooks"
                />
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
