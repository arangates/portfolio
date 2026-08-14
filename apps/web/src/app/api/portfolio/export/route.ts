import { getRecentPortfolioImports } from "@portfolio/api/portfolio-import";
import {
  getBankAccounts,
  getCommodityHoldings,
  getCurrentFixedDeposits,
  getEquitySnapshotHistory,
  getGlobalEquityPortfolio,
  getLatestExchangeRates,
  getLatestZerodhaPortfolio,
  getManualAssets,
  getPortfolioPreference,
  getRecentDegiroEntries,
  getRealEstateHistory,
  getRealEstatePortfolio,
} from "@portfolio/api/portfolio-queries";
import { auth } from "@portfolio/auth";
import { getSalaryExport } from "@portfolio/api/salary-queries";
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
    globalEquity,
    degiroLedger,
    realEstate,
    realEstateHistory,
    imports,
    salary,
  ] = await Promise.all([
    getPortfolioPreference(userId),
    getLatestExchangeRates(userId),
    getBankAccounts(userId),
    getCurrentFixedDeposits(userId),
    getCommodityHoldings(userId),
    getManualAssets(userId),
    getLatestZerodhaPortfolio(userId),
    getEquitySnapshotHistory(userId),
    getGlobalEquityPortfolio(userId),
    getRecentDegiroEntries(userId, 100),
    getRealEstatePortfolio(userId),
    getRealEstateHistory(userId),
    getRecentPortfolioImports(userId),
    getSalaryExport(userId),
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
      globalEquity,
      degiroLedger,
      realEstate,
      realEstateHistory,
      imports,
      salary,
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
