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
  importRow,
  instrument,
  ledgerEntry,
  manualAsset,
  manualAssetSnapshot,
  portfolioPreference,
  portfolioSource,
  positionSnapshot,
  realEstateProperty,
  realEstateSnapshot,
} from "@portfolio/db";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";

import { getCommodityInventoryDashboard } from "./commodity-inventory";

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
      instrumentId: instrument.id,
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
      instrumentId: row.instrumentId,
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
      portfolioSource,
      and(
        eq(ledgerEntry.sourceId, portfolioSource.id),
        eq(portfolioSource.userId, userId),
        eq(portfolioSource.provider, "degiro"),
      ),
    )
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
      portfolioSource,
      and(
        eq(ledgerEntry.sourceId, portfolioSource.id),
        eq(portfolioSource.userId, userId),
        eq(portfolioSource.provider, "degiro"),
      ),
    )
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
      portfolioSource,
      and(
        eq(ledgerEntry.sourceId, portfolioSource.id),
        eq(portfolioSource.userId, userId),
        eq(portfolioSource.provider, "degiro"),
      ),
    )
    .innerJoin(
      importBatch,
      and(
        eq(ledgerEntry.batchId, importBatch.id),
        eq(importBatch.userId, userId),
        eq(importBatch.status, "completed"),
      ),
    )
    .innerJoin(
      importRow,
      and(
        eq(importRow.userId, userId),
        eq(importRow.batchId, ledgerEntry.batchId),
        eq(importRow.rowHash, ledgerEntry.rawRowHash),
      ),
    )
    .where(and(eq(ledgerEntry.userId, userId), sql`${ledgerEntry.balance} is not null`))
    .orderBy(desc(ledgerEntry.occurredAt), asc(importRow.rowNumber));

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

export async function getGlobalEquityPortfolio(userId: string) {
  const rows = await db
    .select({
      instrumentId: instrument.id,
      name: instrument.name,
      isin: instrument.isin,
      category: instrument.assetClass,
      occurredAt: ledgerEntry.occurredAt,
      quantity: ledgerEntry.quantity,
      price: ledgerEntry.price,
      grossAmount: ledgerEntry.grossAmount,
      fees: ledgerEntry.fees,
      netAmount: ledgerEntry.netAmount,
    })
    .from(ledgerEntry)
    .innerJoin(
      portfolioSource,
      and(
        eq(ledgerEntry.sourceId, portfolioSource.id),
        eq(portfolioSource.userId, userId),
        eq(portfolioSource.provider, "degiro"),
      ),
    )
    .innerJoin(
      importBatch,
      and(
        eq(ledgerEntry.batchId, importBatch.id),
        eq(importBatch.userId, userId),
        eq(importBatch.status, "completed"),
      ),
    )
    .innerJoin(
      instrument,
      and(eq(ledgerEntry.instrumentId, instrument.id), eq(instrument.userId, userId)),
    )
    .where(and(eq(ledgerEntry.userId, userId), sql`${ledgerEntry.entryType} in ('buy', 'sell')`))
    .orderBy(asc(ledgerEntry.occurredAt), asc(ledgerEntry.createdAt));

  type Position = {
    instrumentId: string;
    name: string;
    isin: string;
    category: string;
    quantity: number;
    costBasis: number;
    latestPrice: number;
    realizedPnl: number;
    lastTradeAt: Date;
  };
  const positions = new Map<string, Position>();
  const historyByMonth = new Map<
    string,
    { date: string; investedValue: number; marketValue: number }
  >();

  for (const row of rows) {
    const quantity = Number(row.quantity ?? 0);
    if (!Number.isFinite(quantity) || quantity === 0) continue;
    const gross = Math.abs(Number(row.grossAmount ?? 0));
    const net = Math.abs(Number(row.netAmount ?? 0));
    const fees = Math.abs(Number(row.fees ?? 0));
    const effectivePrice =
      gross > 0 ? gross / Math.abs(quantity) : Math.abs(Number(row.price ?? 0));
    const current = positions.get(row.instrumentId) ?? {
      instrumentId: row.instrumentId,
      name: row.name,
      isin: row.isin,
      category: row.category,
      quantity: 0,
      costBasis: 0,
      latestPrice: effectivePrice,
      realizedPnl: 0,
      lastTradeAt: row.occurredAt,
    };

    if (quantity > 0) {
      current.quantity += quantity;
      current.costBasis += net > 0 ? net : gross + fees;
    } else {
      const soldQuantity = Math.min(Math.abs(quantity), Math.max(current.quantity, 0));
      const averageCost = current.quantity > 0 ? current.costBasis / current.quantity : 0;
      const proceeds = net > 0 ? net : Math.max(gross - fees, 0);
      current.realizedPnl += proceeds - averageCost * soldQuantity;
      current.quantity += quantity;
      current.costBasis = Math.max(current.costBasis - averageCost * soldQuantity, 0);
      if (Math.abs(current.quantity) < 0.00000001) current.quantity = 0;
    }
    current.latestPrice = effectivePrice;
    current.lastTradeAt = row.occurredAt;
    positions.set(row.instrumentId, current);

    const date = row.occurredAt.toISOString().slice(0, 10);
    historyByMonth.set(date.slice(0, 7), {
      date,
      investedValue: [...positions.values()].reduce(
        (sum, position) => sum + Math.max(position.costBasis, 0),
        0,
      ),
      marketValue: [...positions.values()].reduce(
        (sum, position) => sum + Math.max(position.quantity, 0) * position.latestPrice,
        0,
      ),
    });
  }

  const holdings = [...positions.values()]
    .filter((position) => position.quantity > 0.00000001)
    .map((position) => ({
      ...position,
      averagePrice: position.quantity > 0 ? position.costBasis / position.quantity : 0,
      marketValue: position.quantity * position.latestPrice,
      unrealizedPnl: position.quantity * position.latestPrice - position.costBasis,
    }))
    .sort((left, right) => right.marketValue - left.marketValue);

  return {
    holdings,
    history: [...historyByMonth.values()],
    realizedPnl: [...positions.values()].reduce((sum, position) => sum + position.realizedPnl, 0),
    lastTradeAt: rows.at(-1)?.occurredAt ?? null,
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
      minimumBalance: bankAccount.minimumBalance,
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
    minimumBalance: row.minimumBalance == null ? null : Number(row.minimumBalance),
    amount: Number(row.amount ?? 0),
  }));
}

export async function getBankBalanceHistory(userId: string, currency: string) {
  const rows = await db
    .select({
      accountId: bankAccount.id,
      asOf: bankBalanceSnapshot.asOf,
      amount: bankBalanceSnapshot.amount,
    })
    .from(bankAccount)
    .innerJoin(
      bankBalanceSnapshot,
      and(
        eq(bankBalanceSnapshot.accountId, bankAccount.id),
        eq(bankBalanceSnapshot.userId, userId),
      ),
    )
    .where(
      and(
        eq(bankAccount.userId, userId),
        eq(bankAccount.currency, currency),
        isNull(bankAccount.archivedAt),
      ),
    )
    .orderBy(asc(bankBalanceSnapshot.asOf), asc(bankAccount.id));

  const latestByAccount = new Map<string, number>();
  const history: Array<{ date: string; value: number }> = [];
  let currentDate: string | null = null;

  for (const row of rows) {
    const date = row.asOf.toISOString().slice(0, 10);
    if (currentDate && date !== currentDate) {
      history.push({
        date: currentDate,
        value: [...latestByAccount.values()].reduce((sum, amount) => sum + amount, 0),
      });
    }
    latestByAccount.set(row.accountId, Number(row.amount));
    currentDate = date;
  }

  if (currentDate) {
    history.push({
      date: currentDate,
      value: [...latestByAccount.values()].reduce((sum, amount) => sum + amount, 0),
    });
  }

  return history;
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

export async function getRealEstatePortfolio(userId: string) {
  const rows = await db
    .select({
      id: realEstateProperty.id,
      name: realEstateProperty.name,
      owner: realEstateProperty.owner,
      propertyType: realEstateProperty.propertyType,
      location: realEstateProperty.location,
      notes: realEstateProperty.notes,
      areaCents: realEstateSnapshot.areaCents,
      areaSquareFeet: realEstateSnapshot.areaSquareFeet,
      ownershipShare: realEstateSnapshot.ownershipShare,
      legalStatus: realEstateSnapshot.legalStatus,
      pricePerSquareFoot: realEstateSnapshot.pricePerSquareFoot,
      marketValue: realEstateSnapshot.marketValue,
      currency: realEstateSnapshot.currency,
      asOf: realEstateSnapshot.asOf,
    })
    .from(realEstateProperty)
    .innerJoin(
      realEstateSnapshot,
      and(
        eq(realEstateProperty.id, realEstateSnapshot.propertyId),
        eq(realEstateSnapshot.userId, userId),
      ),
    )
    .where(and(eq(realEstateProperty.userId, userId), isNull(realEstateProperty.archivedAt)))
    .orderBy(desc(realEstateSnapshot.asOf));

  return latestBy(rows, (row) => row.id).map((row) => {
    const ownershipShare = Number(row.ownershipShare);
    const marketValue = Number(row.marketValue);
    return {
      ...row,
      areaCents: Number(row.areaCents),
      areaSquareFeet: Number(row.areaSquareFeet),
      ownershipShare,
      pricePerSquareFoot: Number(row.pricePerSquareFoot),
      marketValue,
      ownedValue: marketValue * ownershipShare,
    };
  });
}

export async function getRealEstateHistory(userId: string) {
  const rows = await db
    .select({
      propertyId: realEstateProperty.id,
      asOf: realEstateSnapshot.asOf,
      marketValue: realEstateSnapshot.marketValue,
      ownershipShare: realEstateSnapshot.ownershipShare,
      currency: realEstateSnapshot.currency,
    })
    .from(realEstateSnapshot)
    .innerJoin(
      realEstateProperty,
      and(
        eq(realEstateSnapshot.propertyId, realEstateProperty.id),
        eq(realEstateProperty.userId, userId),
      ),
    )
    .where(and(eq(realEstateSnapshot.userId, userId), isNull(realEstateProperty.archivedAt)))
    .orderBy(asc(realEstateSnapshot.asOf));

  const latest = new Map<string, { ownedValue: number; currency: string }>();
  const history = new Map<string, { date: string; value: number; currency: string }>();
  for (const row of rows) {
    latest.set(row.propertyId, {
      ownedValue: Number(row.marketValue) * Number(row.ownershipShare),
      currency: row.currency,
    });
    const date = row.asOf.toISOString().slice(0, 10);
    history.set(`${date}:${row.currency}`, {
      date,
      currency: row.currency,
      value: [...latest.values()]
        .filter((snapshot) => snapshot.currency === row.currency)
        .reduce((sum, snapshot) => sum + snapshot.ownedValue, 0),
    });
  }
  return [...history.values()];
}

export async function getRealEstateDashboard(userId: string) {
  const [preference, rates, properties, historyRows] = await Promise.all([
    getPortfolioPreference(userId),
    getLatestExchangeRates(userId),
    getRealEstatePortfolio(userId),
    db
      .select({
        propertyId: realEstateProperty.id,
        asOf: realEstateSnapshot.asOf,
        createdAt: realEstateSnapshot.createdAt,
        marketValue: realEstateSnapshot.marketValue,
        ownershipShare: realEstateSnapshot.ownershipShare,
        currency: realEstateSnapshot.currency,
      })
      .from(realEstateSnapshot)
      .innerJoin(
        realEstateProperty,
        and(
          eq(realEstateSnapshot.propertyId, realEstateProperty.id),
          eq(realEstateProperty.userId, userId),
        ),
      )
      .where(and(eq(realEstateSnapshot.userId, userId), isNull(realEstateProperty.archivedAt)))
      .orderBy(asc(realEstateSnapshot.asOf), asc(realEstateSnapshot.createdAt)),
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

  const valuedProperties = properties.map((property) => ({
    ...property,
    baseMarketValue: convert(property.marketValue, property.currency),
    baseOwnedValue: convert(property.ownedValue, property.currency),
  }));
  const currencies = [...new Set(properties.map((property) => property.currency))].toSorted();
  const missingCurrencies = currencies.filter((currency) => !rateMap.has(currency));
  const grossValue = valuedProperties.reduce(
    (sum, property) => sum + (property.baseMarketValue ?? 0),
    0,
  );
  const ownedValue = valuedProperties.reduce(
    (sum, property) => sum + (property.baseOwnedValue ?? 0),
    0,
  );
  const ownedAreaSquareFeet = properties.reduce(
    (sum, property) => sum + property.areaSquareFeet * property.ownershipShare,
    0,
  );
  const ownedAreaCents = properties.reduce(
    (sum, property) => sum + property.areaCents * property.ownershipShare,
    0,
  );

  const allocationByProperty = new Map<string, number>();
  for (const property of valuedProperties) {
    if (property.baseOwnedValue === null) continue;
    allocationByProperty.set(
      property.name,
      (allocationByProperty.get(property.name) ?? 0) + property.baseOwnedValue,
    );
  }

  const latestSnapshots = new Map<
    string,
    { marketValue: number; ownershipShare: number; currency: string }
  >();
  const history: Array<{ date: string; value: number; currency: string }> = [];
  let currentDate: string | null = null;
  const appendHistoryPoint = (date: string) => {
    const value = [...latestSnapshots.values()].reduce((sum, snapshot) => {
      const ownedSnapshotValue = snapshot.marketValue * snapshot.ownershipShare;
      return sum + (convert(ownedSnapshotValue, snapshot.currency) ?? 0);
    }, 0);
    history.push({ date, value, currency: preference.baseCurrency });
  };

  for (const row of historyRows) {
    const date = row.asOf.toISOString().slice(0, 10);
    if (currentDate && date !== currentDate) appendHistoryPoint(currentDate);
    latestSnapshots.set(row.propertyId, {
      marketValue: Number(row.marketValue),
      ownershipShare: Number(row.ownershipShare),
      currency: row.currency,
    });
    currentDate = date;
  }
  if (currentDate) appendHistoryPoint(currentDate);

  return {
    preference,
    properties: valuedProperties,
    currencies,
    missingCurrencies,
    totals: {
      grossValue,
      ownedValue,
      ownedAreaSquareFeet,
      ownedAreaCents,
      verified: properties.filter((property) => property.legalStatus === "verified").length,
      pending: properties.filter((property) => property.legalStatus === "pending").length,
      unknown: properties.filter((property) => property.legalStatus === "unknown").length,
    },
    allocation: [...allocationByProperty].map(([category, value]) => ({ category, value })),
    history,
  };
}

export type PortfolioAsset = {
  key: string;
  name: string;
  category: string;
  nativeValue: number;
  currency: string;
  baseValue: number | null;
  liquidBaseValue?: number | null;
  isLiquid: boolean;
  risk: string;
  location: string;
  asOf: Date | string | null;
};

export async function getPortfolioOverview(userId: string) {
  const [
    preference,
    rates,
    equity,
    equityHistory,
    globalEquity,
    degiroAnalytics,
    accounts,
    deposits,
    commodities,
    commodityInventory,
    realEstate,
    manualAssets,
  ] = await Promise.all([
    getPortfolioPreference(userId),
    getLatestExchangeRates(userId),
    getLatestZerodhaPortfolio(userId),
    getEquitySnapshotHistory(userId),
    getGlobalEquityPortfolio(userId),
    getDegiroAnalytics(userId),
    getBankAccounts(userId),
    getCurrentFixedDeposits(userId),
    getCommodityHoldings(userId),
    getCommodityInventoryDashboard(userId),
    getRealEstatePortfolio(userId),
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

  if (globalEquity.holdings.length > 0) {
    const marketValue = globalEquity.holdings.reduce((sum, item) => sum + item.marketValue, 0);
    assets.push({
      key: "degiro-equity",
      name: "Global equity",
      category: "Marketable securities",
      nativeValue: marketValue,
      currency: "EUR",
      baseValue: convert(marketValue, "EUR"),
      isLiquid: true,
      risk: "High",
      location: "Degiro",
      asOf: globalEquity.lastTradeAt,
    });
  }

  for (const balance of degiroAnalytics.balances) {
    if (Math.abs(balance.balance) < 0.00000001) continue;
    assets.push({
      key: `degiro-cash-${balance.currency.toLowerCase()}`,
      name: `DEGIRO cash · ${balance.currency}`,
      category: "DEGIRO cash",
      nativeValue: balance.balance,
      currency: balance.currency,
      baseValue: convert(balance.balance, balance.currency),
      isLiquid: true,
      risk: "Low",
      location: "DEGIRO broker account",
      asOf: balance.occurredAt,
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
    const itemizedLiquidValue = commodityInventory.items
      .filter(
        (item) =>
          item.commodityHoldingId === commodity.id &&
          item.valuationCurrency === commodity.currency &&
          item.fireEligibleValue != null,
      )
      .reduce((sum, item) => sum + (item.fireEligibleValue ?? 0), 0);
    assets.push({
      key: `commodity-${commodity.id}`,
      name: commodity.name,
      category: "Commodities",
      nativeValue: commodity.value,
      currency: commodity.currency,
      baseValue: convert(commodity.value, commodity.currency),
      liquidBaseValue: convert(Math.min(commodity.value, itemizedLiquidValue), commodity.currency),
      isLiquid: itemizedLiquidValue > 0,
      risk: "Moderate",
      location: commodity.location ?? "—",
      asOf: commodity.asOf,
    });
  }

  for (const property of realEstate) {
    assets.push({
      key: `real-estate-${property.id}`,
      name: property.name,
      category: "Real estate",
      nativeValue: property.ownedValue,
      currency: property.currency,
      baseValue: convert(property.ownedValue, property.currency),
      isLiquid: false,
      risk: "Moderate",
      location: property.location ?? "—",
      asOf: property.asOf,
    });
  }

  for (const asset of manualAssets) {
    if (realEstate.length > 0 && asset.assetType.toLowerCase().includes("real estate")) continue;
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
  const liquidValueFor = (asset: (typeof valuedAssets)[number]) =>
    asset.liquidBaseValue !== undefined
      ? (asset.liquidBaseValue ?? 0)
      : asset.isLiquid
        ? asset.baseValue
        : 0;
  const liquidValue = valuedAssets.reduce((sum, asset) => sum + liquidValueFor(asset), 0);
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

  const liquidBucketFor = (asset: (typeof valuedAssets)[number]) => {
    if (asset.key === "zerodha-equity") return "Indian equity";
    if (asset.key === "degiro-equity") return "Global equity";
    if (asset.category === "Commodities") return "Liquid commodities";
    return asset.category;
  };
  const liquidBuckets = new Map<string, number>();
  for (const asset of valuedAssets) {
    const value = liquidValueFor(asset);
    if (value <= 0) continue;
    const bucket = liquidBucketFor(asset);
    liquidBuckets.set(bucket, (liquidBuckets.get(bucket) ?? 0) + value);
  }
  const liquidAllocation = [...liquidBuckets.entries()]
    .map(([category, value]) => ({ category, value }))
    .sort((left, right) => right.value - left.value);

  return {
    preference,
    rates,
    assets,
    allocation,
    liquidAllocation,
    equityHistory,
    equityBreakdown:
      equity?.holdings.map((holding) => ({
        name: holding.name,
        investedValue: holding.investedValue,
        marketValue: holding.marketValue,
        unrealizedPnl: holding.unrealizedPnl,
      })) ?? [],
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
