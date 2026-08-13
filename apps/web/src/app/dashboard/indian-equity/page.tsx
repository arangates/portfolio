import { EmptyDataState } from "@/components/empty-data-state";
import { PageHeader } from "@/components/page-header";
import { PortfolioCharts } from "@/components/portfolio-charts";
import { SectionCards } from "@/components/section-cards";
import { TableCard } from "@/components/table-card";
import { UploadDialog } from "@/components/upload-dialog";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import {
  getEquitySnapshotHistory,
  getLatestZerodhaPortfolio,
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
import { CircleDashedIcon, IndianRupeeIcon, LineChartIcon, TrendingUpIcon } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function IndianEquityPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const [portfolio, history] = await Promise.all([
    getLatestZerodhaPortfolio(session.user.id),
    getEquitySnapshotHistory(session.user.id),
  ]);

  if (!portfolio) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <PageHeader
            title="Indian equity"
            description="Each Zerodha upload becomes a dated, immutable position snapshot owned by your account."
          />
          <div className="px-4 lg:px-6">
            <EmptyDataState
              icon={LineChartIcon}
              title="No Zerodha holdings"
              description="Import your holdings workbook to build the first position snapshot."
              action={
                <UploadDialog
                  kind="zerodha_holdings"
                  title="Import Zerodha holdings"
                  description="Upload one holdings XLSX file."
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                />
              }
            />
          </div>
        </div>
      </div>
    );
  }

  const investedValue = portfolio.holdings.reduce((sum, holding) => sum + holding.investedValue, 0);
  const marketValue = portfolio.holdings.reduce((sum, holding) => sum + holding.marketValue, 0);
  const pnl = portfolio.holdings.reduce((sum, holding) => sum + holding.unrealizedPnl, 0);
  const categories = new Set(portfolio.holdings.map((holding) => holding.category));
  const allocation = [...categories].map((category) => ({
    category,
    value: portfolio.holdings
      .filter((holding) => holding.category === category)
      .reduce((sum, holding) => sum + holding.marketValue, 0),
  }));

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <PageHeader
          title="Indian equity"
          description="Latest Zerodha positions with historical statement snapshots. Re-uploading a file is idempotent and never erases older valuations."
          action={
            <UploadDialog
              kind="zerodha_holdings"
              title="Import Zerodha holdings"
              description="Upload one holdings XLSX file."
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            />
          }
        />
        <SectionCards
          items={[
            {
              label: "Market value",
              value: formatCurrency(marketValue, "INR"),
              badge: `${portfolio.holdings.length} holdings`,
              note: "Latest combined statement",
              detail: portfolio.statementDate
                ? `As of ${formatDate(portfolio.statementDate)}`
                : "Latest upload",
              icon: LineChartIcon,
            },
            {
              label: "Invested value",
              value: formatCurrency(investedValue, "INR"),
              badge: "Cost basis",
              note: "Quantity × average price",
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
              detail: "History grows with each import",
              icon: CircleDashedIcon,
            },
          ]}
        />
        <PortfolioCharts allocation={allocation} equityHistory={history} currency="INR" />
        <div className="px-4 lg:px-6">
          <TableCard
            title="Current holdings"
            description="Only the latest snapshot for this signed-in account."
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
                {portfolio.holdings.map((holding) => (
                  <TableRow key={holding.isin}>
                    <TableCell>
                      <div className="font-medium">{holding.name}</div>
                      <div className="text-xs text-muted-foreground">{holding.isin}</div>
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
      </div>
    </div>
  );
}
