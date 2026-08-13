import "server-only";

import {
  bankAccount,
  bankBalanceSnapshot,
  commodityHolding,
  commoditySnapshot,
  db,
  exchangeRateSnapshot,
  fixedDeposit,
  fixedDepositSnapshot,
  importBatch,
  instrument,
  ledgerEntry,
  manualAsset,
  manualAssetSnapshot,
  portfolioPreference,
  positionSnapshot,
} from "@portfolio/db";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";

function latestBy<T>(rows: T[], key: (row: T) => string) {
  const latest = new Map<string, T>();
  for (const row of rows) {
    const id = key(row);
    if (!latest.has(id)) latest.set(id, row);
  }
  return [...latest.values()];
}

export async function getPortfolioPreference(userId: string) {
  const [preference] = await db
    .select({
      baseCurrency: portfolioPreference.baseCurrency,
      locale: portfolioPreference.locale,
      timeZone: portfolioPreference.timeZone,
    })
    .from(portfolioPreference)
    .where(eq(portfolioPreference.userId, userId))
    .limit(1);

  return preference ?? { baseCurrency: "INR", locale: "en-IN", timeZone: "UTC" };
}

export async function getLatestExchangeRates(userId: string) {
  const rows = await db
    .select({
      id: exchangeRateSnapshot.id,
      baseCurrency: exchangeRateSnapshot.baseCurrency,
      quoteCurrency: exchangeRateSnapshot.quoteCurrency,
      rate: exchangeRateSnapshot.rate,
      asOf: exchangeRateSnapshot.asOf,
    })
    .from(exchangeRateSnapshot)
    .where(eq(exchangeRateSnapshot.userId, userId))
    .orderBy(desc(exchangeRateSnapshot.asOf));

  return latestBy(rows, (row) => `${row.baseCurrency}:${row.quoteCurrency}`).map((row) => ({
    ...row,
    rate: Number(row.rate),
  }));
}

export async function getLatestZerodhaPortfolio(userId: string) {
  const [latestImport] = await db
    .select({
      id: importBatch.id,
      statementDate: importBatch.statementDate,
      createdAt: importBatch.createdAt,
    })
    .from(importBatch)
    .where(
      and(
        eq(importBatch.userId, userId),
        eq(importBatch.kind, "zerodha_holdings"),
        eq(importBatch.status, "completed"),
      ),
    )
    .orderBy(desc(importBatch.statementDate), desc(importBatch.createdAt))
    .limit(1);

  if (!latestImport) return null;

  const rows = await db
    .select({
      name: instrument.name,
      isin: instrument.isin,
      category: instrument.assetClass,
      quantity: positionSnapshot.quantity,
      averagePrice: positionSnapshot.averagePrice,
      currentPrice: positionSnapshot.marketPrice,
      investedValue: positionSnapshot.investedValue,
      marketValue: positionSnapshot.marketValue,
      unrealizedPnl: positionSnapshot.unrealizedPnl,
    })
    .from(positionSnapshot)
    .innerJoin(
      instrument,
      and(eq(positionSnapshot.instrumentId, instrument.id), eq(instrument.userId, userId)),
    )
    .where(and(eq(positionSnapshot.userId, userId), eq(positionSnapshot.batchId, latestImport.id)))
    .orderBy(desc(positionSnapshot.marketValue));

  return {
    statementDate: latestImport.statementDate,
    createdAt: latestImport.createdAt,
    holdings: rows.map((row) => ({
      name: row.name,
      isin: row.isin,
      category: row.category,
      quantity: Number(row.quantity),
      averagePrice: Number(row.averagePrice ?? 0),
      currentPrice: Number(row.currentPrice ?? 0),
      investedValue: Number(row.investedValue ?? 0),
      marketValue: Number(row.marketValue ?? 0),
      unrealizedPnl: Number(row.unrealizedPnl ?? 0),
    })),
  };
}

export async function getEquitySnapshotHistory(userId: string) {
  const rows = await db
    .select({
      batchId: importBatch.id,
      statementDate: importBatch.statementDate,
      createdAt: importBatch.createdAt,
      investedValue: sql<string>`coalesce(sum(${positionSnapshot.investedValue}), 0)`,
      marketValue: sql<string>`coalesce(sum(${positionSnapshot.marketValue}), 0)`,
      unrealizedPnl: sql<string>`coalesce(sum(${positionSnapshot.unrealizedPnl}), 0)`,
    })
    .from(importBatch)
    .innerJoin(
      positionSnapshot,
      and(eq(positionSnapshot.batchId, importBatch.id), eq(positionSnapshot.userId, userId)),
    )
    .where(
      and(
        eq(importBatch.userId, userId),
        eq(importBatch.kind, "zerodha_holdings"),
        eq(importBatch.status, "completed"),
      ),
    )
    .groupBy(importBatch.id)
    .orderBy(asc(importBatch.statementDate), asc(importBatch.createdAt));

  return rows.map((row) => ({
    ...row,
    date: row.statementDate ?? row.createdAt.toISOString().slice(0, 10),
    investedValue: Number(row.investedValue),
    marketValue: Number(row.marketValue),
    unrealizedPnl: Number(row.unrealizedPnl),
  }));
}

export async function getRecentDegiroEntries(userId: string, limit = 25) {
  return db
    .select({
      id: ledgerEntry.id,
      occurredAt: ledgerEntry.occurredAt,
      product: instrument.name,
      description: ledgerEntry.description,
      entryType: ledgerEntry.entryType,
      quantity: ledgerEntry.quantity,
      price: ledgerEntry.price,
      fees: ledgerEntry.fees,
      netAmount: ledgerEntry.netAmount,
      currency: ledgerEntry.currency,
    })
    .from(ledgerEntry)
    .innerJoin(
      importBatch,
      and(
        eq(ledgerEntry.batchId, importBatch.id),
        eq(importBatch.userId, userId),
        eq(importBatch.status, "completed"),
      ),
    )
    .leftJoin(
      instrument,
      and(eq(ledgerEntry.instrumentId, instrument.id), eq(instrument.userId, userId)),
    )
    .where(eq(ledgerEntry.userId, userId))
    .orderBy(desc(ledgerEntry.occurredAt))
    .limit(Math.min(Math.max(limit, 1), 100));
}

export async function getDegiroAnalytics(userId: string) {
  const [summary] = await db
    .select({
      rowCount: sql<number>`count(*)::int`,
      dividends: sql<string>`coalesce(sum(case when ${ledgerEntry.entryType} = 'dividend' then ${ledgerEntry.netAmount} else 0 end), 0)`,
      fees: sql<string>`coalesce(sum(case when ${ledgerEntry.entryType} = 'fee' then ${ledgerEntry.netAmount} else ${ledgerEntry.fees} end), 0)`,
      tradeCashFlow: sql<string>`coalesce(sum(case when ${ledgerEntry.entryType} in ('buy', 'sell') then ${ledgerEntry.netAmount} else 0 end), 0)`,
    })
    .from(ledgerEntry)
    .innerJoin(
      importBatch,
      and(
        eq(ledgerEntry.batchId, importBatch.id),
        eq(importBatch.userId, userId),
        eq(importBatch.status, "completed"),
      ),
    )
    .where(eq(ledgerEntry.userId, userId));

  const balanceRows = await db
    .select({
      currency: ledgerEntry.currency,
      balance: ledgerEntry.balance,
      occurredAt: ledgerEntry.occurredAt,
    })
    .from(ledgerEntry)
    .innerJoin(
      importBatch,
      and(
        eq(ledgerEntry.batchId, importBatch.id),
        eq(importBatch.userId, userId),
        eq(importBatch.status, "completed"),
      ),
    )
    .where(and(eq(ledgerEntry.userId, userId), sql`${ledgerEntry.balance} is not null`))
    .orderBy(desc(ledgerEntry.occurredAt));

  return {
    rowCount: summary?.rowCount ?? 0,
    dividends: Number(summary?.dividends ?? 0),
    fees: Number(summary?.fees ?? 0),
    tradeCashFlow: Number(summary?.tradeCashFlow ?? 0),
    balances: latestBy(balanceRows, (row) => row.currency).map((row) => ({
      currency: row.currency,
      balance: Number(row.balance ?? 0),
      occurredAt: row.occurredAt,
    })),
  };
}

export async function getBankAccounts(userId: string, currency?: string) {
  const conditions = [eq(bankAccount.userId, userId), isNull(bankAccount.archivedAt)];
  if (currency) conditions.push(eq(bankAccount.currency, currency));

  const rows = await db
    .select({
      id: bankAccount.id,
      institution: bankAccount.institution,
      name: bankAccount.name,
      accountType: bankAccount.accountType,
      accountLast4: bankAccount.accountLast4,
      currency: bankAccount.currency,
      notes: bankAccount.notes,
      amount: bankBalanceSnapshot.amount,
      asOf: bankBalanceSnapshot.asOf,
    })
    .from(bankAccount)
    .leftJoin(
      bankBalanceSnapshot,
      and(
        eq(bankBalanceSnapshot.accountId, bankAccount.id),
        eq(bankBalanceSnapshot.userId, userId),
      ),
    )
    .where(and(...conditions))
    .orderBy(desc(bankBalanceSnapshot.asOf), asc(bankAccount.institution));

  return latestBy(rows, (row) => row.id).map((row) => ({
    ...row,
    amount: Number(row.amount ?? 0),
  }));
}

export async function getCurrentFixedDeposits(userId: string) {
  const rows = await db
    .select({
      id: fixedDeposit.id,
      bank: fixedDeposit.bank,
      type: fixedDeposit.depositType,
      last4: fixedDeposit.accountLast4,
      currency: fixedDeposit.currency,
      principal: fixedDepositSnapshot.principal,
      interestRate: fixedDepositSnapshot.interestRate,
      startDate: fixedDepositSnapshot.startDate,
      maturityDate: fixedDepositSnapshot.maturityDate,
      compoundingPerYear: fixedDepositSnapshot.compoundingPerYear,
      status: fixedDepositSnapshot.status,
      notes: fixedDepositSnapshot.notes,
      asOf: fixedDepositSnapshot.asOf,
    })
    .from(fixedDeposit)
    .innerJoin(
      fixedDepositSnapshot,
      and(
        eq(fixedDeposit.id, fixedDepositSnapshot.fixedDepositId),
        eq(fixedDepositSnapshot.userId, userId),
      ),
    )
    .where(and(eq(fixedDeposit.userId, userId), isNull(fixedDeposit.archivedAt)))
    .orderBy(desc(fixedDepositSnapshot.asOf));

  return latestBy(rows, (row) => row.id).map((row) => ({
    ...row,
    principal: Number(row.principal),
    interestRate: Number(row.interestRate),
  }));
}

export async function getCommodityHoldings(userId: string) {
  const rows = await db
    .select({
      id: commodityHolding.id,
      name: commodityHolding.name,
      commodityType: commodityHolding.commodityType,
      location: commodityHolding.location,
      quantityGrams: commoditySnapshot.quantityGrams,
      ownershipShare: commoditySnapshot.ownershipShare,
      pricePerGram: commoditySnapshot.pricePerGram,
      currency: commoditySnapshot.currency,
      asOf: commoditySnapshot.asOf,
    })
    .from(commodityHolding)
    .innerJoin(
      commoditySnapshot,
      and(
        eq(commodityHolding.id, commoditySnapshot.commodityHoldingId),
        eq(commoditySnapshot.userId, userId),
      ),
    )
    .where(and(eq(commodityHolding.userId, userId), isNull(commodityHolding.archivedAt)))
    .orderBy(desc(commoditySnapshot.asOf));

  return latestBy(rows, (row) => row.id).map((row) => {
    const quantityGrams = Number(row.quantityGrams);
    const ownershipShare = Number(row.ownershipShare);
    const pricePerGram = Number(row.pricePerGram);
    return {
      ...row,
      quantityGrams,
      ownershipShare,
      pricePerGram,
      value: quantityGrams * ownershipShare * pricePerGram,
    };
  });
}

export async function getManualAssets(userId: string) {
  const rows = await db
    .select({
      id: manualAsset.id,
      name: manualAsset.name,
      assetType: manualAsset.assetType,
      location: manualAsset.location,
      riskLevel: manualAsset.riskLevel,
      isLiquid: manualAsset.isLiquid,
      notes: manualAsset.notes,
      value: manualAssetSnapshot.value,
      currency: manualAssetSnapshot.currency,
      ownershipShare: manualAssetSnapshot.ownershipShare,
      asOf: manualAssetSnapshot.asOf,
    })
    .from(manualAsset)
    .innerJoin(
      manualAssetSnapshot,
      and(eq(manualAsset.id, manualAssetSnapshot.assetId), eq(manualAssetSnapshot.userId, userId)),
    )
    .where(and(eq(manualAsset.userId, userId), isNull(manualAsset.archivedAt)))
    .orderBy(desc(manualAssetSnapshot.asOf));

  return latestBy(rows, (row) => row.id).map((row) => ({
    ...row,
    value: Number(row.value),
    ownershipShare: Number(row.ownershipShare),
    ownedValue: Number(row.value) * Number(row.ownershipShare),
  }));
}

export type PortfolioAsset = {
  key: string;
  name: string;
  category: string;
  nativeValue: number;
  currency: string;
  baseValue: number | null;
  isLiquid: boolean;
  risk: string;
  location: string;
  asOf: Date | string | null;
};

export async function getPortfolioOverview(userId: string) {
  const [preference, rates, equity, equityHistory, accounts, deposits, commodities, manualAssets] =
    await Promise.all([
      getPortfolioPreference(userId),
      getLatestExchangeRates(userId),
      getLatestZerodhaPortfolio(userId),
      getEquitySnapshotHistory(userId),
      getBankAccounts(userId),
      getCurrentFixedDeposits(userId),
      getCommodityHoldings(userId),
      getManualAssets(userId),
    ]);

  const rateMap = new Map(
    rates
      .filter((rate) => rate.baseCurrency === preference.baseCurrency)
      .map((rate) => [rate.quoteCurrency, rate.rate]),
  );
  rateMap.set(preference.baseCurrency, 1);
  const convert = (value: number, currency: string) => {
    const rate = rateMap.get(currency);
    return rate === undefined ? null : value * rate;
  };

  const assets: PortfolioAsset[] = [];
  if (equity && equity.holdings.length > 0) {
    const marketValue = equity.holdings.reduce((sum, item) => sum + item.marketValue, 0);
    assets.push({
      key: "zerodha-equity",
      name: "Indian equity",
      category: "Marketable securities",
      nativeValue: marketValue,
      currency: "INR",
      baseValue: convert(marketValue, "INR"),
      isLiquid: true,
      risk: "High",
      location: "Zerodha",
      asOf: equity.statementDate ?? equity.createdAt,
    });
  }

  for (const account of accounts) {
    assets.push({
      key: `bank-${account.id}`,
      name: `${account.institution} · ${account.name}`,
      category: "Cash",
      nativeValue: account.amount,
      currency: account.currency,
      baseValue: convert(account.amount, account.currency),
      isLiquid: true,
      risk: "Low",
      location: account.accountType,
      asOf: account.asOf,
    });
  }

  for (const deposit of deposits) {
    assets.push({
      key: `deposit-${deposit.id}`,
      name: `${deposit.bank} fixed deposit`,
      category: "Fixed deposits",
      nativeValue: deposit.principal,
      currency: deposit.currency,
      baseValue: convert(deposit.principal, deposit.currency),
      isLiquid: true,
      risk: "Low",
      location: deposit.type,
      asOf: deposit.asOf,
    });
  }

  for (const commodity of commodities) {
    assets.push({
      key: `commodity-${commodity.id}`,
      name: commodity.name,
      category: "Commodities",
      nativeValue: commodity.value,
      currency: commodity.currency,
      baseValue: convert(commodity.value, commodity.currency),
      isLiquid: true,
      risk: "Moderate",
      location: commodity.location ?? "—",
      asOf: commodity.asOf,
    });
  }

  for (const asset of manualAssets) {
    assets.push({
      key: `manual-${asset.id}`,
      name: asset.name,
      category: asset.assetType,
      nativeValue: asset.ownedValue,
      currency: asset.currency,
      baseValue: convert(asset.ownedValue, asset.currency),
      isLiquid: asset.isLiquid,
      risk: asset.riskLevel,
      location: asset.location ?? "—",
      asOf: asset.asOf,
    });
  }

  const valuedAssets = assets.filter(
    (asset): asset is PortfolioAsset & { baseValue: number } => asset.baseValue !== null,
  );
  const netWorth = valuedAssets.reduce((sum, asset) => sum + asset.baseValue, 0);
  const liquidValue = valuedAssets
    .filter((asset) => asset.isLiquid)
    .reduce((sum, asset) => sum + asset.baseValue, 0);
  const equityInvested = equity?.holdings.reduce((sum, item) => sum + item.investedValue, 0) ?? 0;
  const equityPnl = equity?.holdings.reduce((sum, item) => sum + item.unrealizedPnl, 0) ?? 0;
  const unconvertedCurrencies = [
    ...new Set(assets.filter((asset) => asset.baseValue === null).map((asset) => asset.currency)),
  ];

  const allocation = [...new Set(valuedAssets.map((asset) => asset.category))]
    .map((category) => ({
      category,
      value: valuedAssets
        .filter((asset) => asset.category === category)
        .reduce((sum, asset) => sum + asset.baseValue, 0),
    }))
    .sort((left, right) => right.value - left.value);

  return {
    preference,
    rates,
    assets,
    allocation,
    equityHistory,
    totals: { netWorth, liquidValue, equityInvested, equityPnl },
    unconvertedCurrencies,
    asOf:
      assets
        .map((asset) => asset.asOf)
        .filter(Boolean)
        .map((value) => new Date(value as Date | string))
        .sort((left, right) => right.getTime() - left.getTime())[0] ?? null,
  };
}
