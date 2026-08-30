import { getRecentPortfolioImports } from "@portfolio/api/portfolio-import";
import { getCommodityInventoryExport } from "@portfolio/api/commodity-inventory";
import { getFireExport } from "@portfolio/api/fire-queries";
import { getHouseholdExport } from "@portfolio/api/household-queries";
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
import { getIncomeTaxExport } from "@portfolio/api/income-tax-queries";
import { getNetherlandsTaxExport } from "@portfolio/api/netherlands-tax-queries";
import { getZerodhaTradebookExport } from "@portfolio/api/zerodha-tradebook-queries";
import { headers } from "next/headers";
import { getDriveArchiveState } from "@/lib/google-drive-archive";

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
    commodityInventory,
    manualAssets,
    indianEquity,
    indianEquityHistory,
    zerodhaTradebook,
    globalEquity,
    degiroLedger,
    realEstate,
    realEstateHistory,
    imports,
    salary,
    household,
    fire,
    incomeTax,
    netherlandsTax,
    sourceDocuments,
  ] = await Promise.all([
    getPortfolioPreference(userId),
    getLatestExchangeRates(userId),
    getBankAccounts(userId),
    getCurrentFixedDeposits(userId),
    getCommodityHoldings(userId),
    getCommodityInventoryExport(userId),
    getManualAssets(userId),
    getLatestZerodhaPortfolio(userId),
    getEquitySnapshotHistory(userId),
    getZerodhaTradebookExport(userId),
    getGlobalEquityPortfolio(userId),
    getRecentDegiroEntries(userId, 100),
    getRealEstatePortfolio(userId),
    getRealEstateHistory(userId),
    getRecentPortfolioImports(userId),
    getSalaryExport(userId),
    getHouseholdExport(userId),
    getFireExport(userId),
    getIncomeTaxExport(userId),
    getNetherlandsTaxExport(userId),
    getDriveArchiveState(userId),
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
      commodityInventory,
      manualAssets,
      indianEquity,
      indianEquityHistory,
      zerodhaTradebook,
      globalEquity,
      degiroLedger,
      realEstate,
      realEstateHistory,
      imports,
      salary,
      household,
      fire,
      incomeTax,
      netherlandsTax,
      sourceDocuments: {
        enabled: sourceDocuments.enabled,
        documentCount: sourceDocuments.documentCount,
        storedCount: sourceDocuments.storedCount,
        failedCount: sourceDocuments.failedCount,
        documents: sourceDocuments.documents,
      },
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
