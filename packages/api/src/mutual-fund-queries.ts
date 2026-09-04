import "server-only";

import {
  db,
  instrument,
  mutualFundInstrumentLink,
  mutualFundNav,
  mutualFundScheme,
  mutualFundSyncRun,
} from "@portfolio/db";
import { and, asc, desc, eq, inArray } from "drizzle-orm";

import {
  annualizedVolatility,
  downsideDeviation,
  drawdownSeries,
  maxDrawdown,
  pearsonCorrelation,
  PERFORMANCE_HORIZONS,
  rollingAnnualReturns,
  trailingReturn,
  type NavPoint,
} from "./mutual-fund-calculations";
import { getLatestZerodhaPortfolio } from "./portfolio-queries";

function weightedAverage(rows: Array<{ weight: number; value: number | null }>) {
  const available = rows.filter(
    (row): row is { weight: number; value: number } => row.value !== null && row.weight > 0,
  );
  const weight = available.reduce((sum, row) => sum + row.weight, 0);
  return weight > 0
    ? available.reduce((sum, row) => sum + row.value * row.weight, 0) / weight
    : null;
}

function shortFundName(name: string) {
  return name
    .replace(/\s+-\s+direct plan\s*-?\s*/gi, " ")
    .replace(/\s+-\s+growth\s*$/i, "")
    .replace(/\s+direct\s+(growth|plan).*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalSchemeCategory(value: string | null) {
  if (!value) return "Unclassified";
  const normalized = value.toLowerCase().replaceAll("schemes", "scheme").replace(/\s+/g, " ");
  if (normalized.includes("small cap")) return "Equity · Small cap";
  if (normalized.includes("mid cap")) return "Equity · Mid cap";
  if (normalized.includes("flexi cap")) return "Equity · Flexi cap";
  if (normalized.includes("sectoral") || normalized.includes("thematic"))
    return "Equity · Sectoral/Thematic";
  if (normalized.includes("elss")) return "Equity · ELSS";
  if (normalized.includes("ultra short")) return "Debt · Ultra short duration";
  if (normalized.includes("balanced advantage") || normalized.includes("dynamic asset"))
    return "Hybrid · Balanced advantage";
  if (normalized.includes("index fund") || normalized.includes("etf")) return "Passive · Index/ETF";
  if (normalized.includes("fof")) return "Other · Fund of funds";
  return value.replaceAll("Schemes", "Scheme").replace(/\s+/g, " ").trim();
}

export async function getMutualFundIntelligence(userId: string) {
  const [portfolio, links, latestRuns] = await Promise.all([
    getLatestZerodhaPortfolio(userId),
    db
      .select({
        instrumentId: mutualFundInstrumentLink.instrumentId,
        instrumentName: instrument.name,
        instrumentIsin: instrument.isin,
        linkStatus: mutualFundInstrumentLink.status,
        linkError: mutualFundInstrumentLink.errorMessage,
        matchMethod: mutualFundInstrumentLink.matchMethod,
        lastSyncedAt: mutualFundInstrumentLink.lastSyncedAt,
        schemeCode: mutualFundScheme.schemeCode,
        schemeName: mutualFundScheme.schemeName,
        fundHouse: mutualFundScheme.fundHouse,
        schemeType: mutualFundScheme.schemeType,
        schemeCategory: mutualFundScheme.schemeCategory,
        isinGrowth: mutualFundScheme.isinGrowth,
        isinDivReinvestment: mutualFundScheme.isinDivReinvestment,
      })
      .from(mutualFundInstrumentLink)
      .innerJoin(
        instrument,
        and(
          eq(mutualFundInstrumentLink.instrumentId, instrument.id),
          eq(instrument.userId, userId),
        ),
      )
      .leftJoin(
        mutualFundScheme,
        eq(mutualFundInstrumentLink.schemeCode, mutualFundScheme.schemeCode),
      )
      .where(eq(mutualFundInstrumentLink.userId, userId)),
    db
      .select()
      .from(mutualFundSyncRun)
      .where(eq(mutualFundSyncRun.userId, userId))
      .orderBy(desc(mutualFundSyncRun.createdAt))
      .limit(5),
  ]);

  const schemeCodes = [
    ...new Set(
      links.map((link) => link.schemeCode).filter((code): code is number => code !== null),
    ),
  ];
  const navRows =
    schemeCodes.length > 0
      ? await db
          .select({
            schemeCode: mutualFundNav.schemeCode,
            date: mutualFundNav.navDate,
            nav: mutualFundNav.nav,
          })
          .from(mutualFundNav)
          .where(inArray(mutualFundNav.schemeCode, schemeCodes))
          .orderBy(asc(mutualFundNav.navDate))
      : [];
  const navByScheme = new Map<number, NavPoint[]>();
  for (const row of navRows) {
    const series = navByScheme.get(row.schemeCode) ?? [];
    series.push({ date: row.date, nav: Number(row.nav) });
    navByScheme.set(row.schemeCode, series);
  }

  const holdingsById = new Map(
    (portfolio?.holdings ?? []).map((holding) => [holding.instrumentId, holding]),
  );
  const funds = links
    .filter((link) => holdingsById.has(link.instrumentId))
    .map((link) => {
      const holding = holdingsById.get(link.instrumentId)!;
      const nav = link.schemeCode ? (navByScheme.get(link.schemeCode) ?? []) : [];
      const latestNav = nav.at(-1) ?? null;
      const previousClosingNav = portfolio?.statementDate
        ? (nav.findLast((point) => point.date < portfolio.statementDate!) ?? null)
        : null;
      const returnEligible = Boolean(
        link.isinGrowth &&
        holding.isin.trim().toUpperCase() === link.isinGrowth.trim().toUpperCase(),
      );
      const returns = Object.fromEntries(
        PERFORMANCE_HORIZONS.map((horizon) => [
          horizon.key,
          returnEligible
            ? trailingReturn(nav, {
                months: "months" in horizon ? horizon.months : undefined,
                years: "years" in horizon ? horizon.years : undefined,
              })
            : null,
        ]),
      ) as Record<(typeof PERFORMANCE_HORIZONS)[number]["key"], number | null>;
      return {
        instrumentId: link.instrumentId,
        name: holding.name,
        shortName: shortFundName(link.schemeName ?? holding.name),
        isin: holding.isin,
        importedCategory: holding.category,
        quantity: holding.quantity,
        investedValue: holding.investedValue,
        marketValue: holding.marketValue,
        unrealizedPnl: holding.unrealizedPnl,
        unrealizedReturn:
          holding.investedValue > 0 ? holding.unrealizedPnl / holding.investedValue : null,
        importedNav: holding.currentPrice,
        linkStatus: link.linkStatus,
        linkError: link.linkError,
        matchMethod: link.matchMethod,
        lastSyncedAt: link.lastSyncedAt,
        schemeCode: link.schemeCode,
        schemeName: link.schemeName,
        fundHouse: link.fundHouse,
        schemeType: link.schemeType,
        schemeCategory: canonicalSchemeCategory(link.schemeCategory),
        sourceSchemeCategory: link.schemeCategory,
        returnEligible,
        navHistoryStart: nav[0]?.date ?? null,
        latestNavDate: latestNav?.date ?? null,
        latestNav: latestNav?.nav ?? null,
        navObservations: nav.length,
        referenceNavDate: previousClosingNav?.date ?? null,
        referenceNav: previousClosingNav?.nav ?? null,
        referenceNavDifference:
          previousClosingNav && holding.currentPrice > 0
            ? holding.currentPrice / previousClosingNav.nav - 1
            : null,
        returns,
        volatility3y: returnEligible ? annualizedVolatility(nav, 3) : null,
        downsideDeviation3y: returnEligible ? downsideDeviation(nav, 3) : null,
        maxDrawdown5y: returnEligible ? maxDrawdown(nav, 5) : null,
        rolling1y: returnEligible ? rollingAnnualReturns(nav, 5) : [],
        drawdowns: returnEligible
          ? drawdownSeries(nav, 5).filter((_, index) => index % 10 === 0)
          : [],
        nav,
      };
    })
    .sort((left, right) => right.marketValue - left.marketValue);

  const holdingCount = portfolio?.holdings.length ?? 0;
  const totalMarketValue = (portfolio?.holdings ?? []).reduce(
    (sum, holding) => sum + holding.marketValue,
    0,
  );
  const linkedMarketValue = funds
    .filter((fund) => fund.schemeCode !== null)
    .reduce((sum, fund) => sum + fund.marketValue, 0);
  const syncedFunds = funds.filter((fund) => fund.navObservations > 0);
  const categories = [...new Set(syncedFunds.map((fund) => fund.schemeCategory ?? "Unclassified"))]
    .map((category) => {
      const members = syncedFunds.filter(
        (fund) => (fund.schemeCategory ?? "Unclassified") === category,
      );
      return {
        category,
        funds: members.length,
        marketValue: members.reduce((sum, fund) => sum + fund.marketValue, 0),
      };
    })
    .sort((left, right) => right.marketValue - left.marketValue);

  const correlationFunds = syncedFunds.filter((fund) => fund.returnEligible).slice(0, 12);
  const correlation = correlationFunds.flatMap((left, leftIndex) =>
    correlationFunds.map((right, rightIndex) => ({
      leftIndex,
      rightIndex,
      value:
        left.instrumentId === right.instrumentId ? 1 : pearsonCorrelation(left.nav, right.nav, 3),
    })),
  );

  const latestNavDate =
    syncedFunds
      .map((fund) => fund.latestNavDate)
      .filter((date): date is string => Boolean(date))
      .sort()
      .at(-1) ?? null;
  const exactReconciliations = funds.filter((fund) => fund.referenceNavDifference !== null);
  const exactReconciliationPasses = exactReconciliations.filter(
    (fund) => Math.abs(fund.referenceNavDifference ?? 1) <= 0.001,
  ).length;

  return {
    portfolioDate: portfolio?.statementDate ?? null,
    latestRun: latestRuns[0] ?? null,
    recentRuns: latestRuns,
    funds: funds.map(({ nav: _nav, ...fund }) => fund),
    categories,
    correlation: {
      labels: correlationFunds.map((fund) => fund.shortName),
      values: correlation,
      methodology: "Pearson correlation of aligned daily NAV returns over up to 3 years",
    },
    summary: {
      holdingCount,
      linkedFunds: funds.filter((fund) => fund.schemeCode !== null).length,
      syncedFunds: syncedFunds.length,
      totalMarketValue,
      linkedMarketValue,
      valueCoverage: totalMarketValue > 0 ? linkedMarketValue / totalMarketValue : 0,
      latestNavDate,
      weighted1yReturn: weightedAverage(
        syncedFunds.map((fund) => ({ weight: fund.marketValue, value: fund.returns["1y"] })),
      ),
      weighted3yReturn: weightedAverage(
        syncedFunds.map((fund) => ({ weight: fund.marketValue, value: fund.returns["3y"] })),
      ),
      weightedVolatility3y: weightedAverage(
        syncedFunds.map((fund) => ({ weight: fund.marketValue, value: fund.volatility3y })),
      ),
      worstMaxDrawdown5y:
        syncedFunds.length > 0
          ? Math.min(...syncedFunds.map((fund) => fund.maxDrawdown5y ?? 0))
          : null,
      redundantCategories: categories.filter((category) => category.funds > 1).length,
      exactReconciliations: exactReconciliations.length,
      exactReconciliationPasses,
    },
    evidence: {
      nav: "MFAPI / AMFI-derived scheme metadata and daily NAV history",
      portfolio: "Latest user-imported Zerodha holdings snapshot",
      stockOverlapAvailable: false,
      stockOverlapReason:
        "MFAPI does not publish portfolio constituents or weights. Official dated AMC portfolio disclosures are required.",
      expenseRatioAvailable: false,
      expenseRatioReason:
        "MFAPI does not publish total expense ratios. A dated factsheet or official AMC disclosure is required.",
    },
  };
}
