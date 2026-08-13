import { getRecentPortfolioImports } from "@zerodha-coin/api/portfolio-import";
import {
  getBankAccounts,
  getCommodityHoldings,
  getCurrentFixedDeposits,
  getEquitySnapshotHistory,
  getLatestExchangeRates,
  getLatestZerodhaPortfolio,
  getManualAssets,
  getPortfolioPreference,
  getRecentDegiroEntries,
} from "@zerodha-coin/api/portfolio-queries";
import { auth } from "@zerodha-coin/auth";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const [
    preference,
    exchangeRates,
    accounts,
    fixedDeposits,
    commodities,
    manualAssets,
    indianEquity,
    indianEquityHistory,
    degiroLedger,
    imports,
  ] = await Promise.all([
    getPortfolioPreference(userId),
    getLatestExchangeRates(userId),
    getBankAccounts(userId),
    getCurrentFixedDeposits(userId),
    getCommodityHoldings(userId),
    getManualAssets(userId),
    getLatestZerodhaPortfolio(userId),
    getEquitySnapshotHistory(userId),
    getRecentDegiroEntries(userId, 100),
    getRecentPortfolioImports(userId),
  ]);

  const body = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      account: { id: userId, name: session.user.name, email: session.user.email },
      preference,
      exchangeRates,
      accounts,
      fixedDeposits,
      commodities,
      manualAssets,
      indianEquity,
      indianEquityHistory,
      degiroLedger,
      imports,
    },
    null,
    2,
  );

  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="portfolio-export-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
