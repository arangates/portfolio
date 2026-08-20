import "server-only";

import { db, importBatch, instrument, ledgerEntry, portfolioSource } from "@portfolio/db";
import { and, asc, desc, eq } from "drizzle-orm";

function financialYear(date: Date) {
  const year = date.getUTCFullYear();
  const startYear = date.getUTCMonth() >= 3 ? year : year - 1;
  return `FY ${startYear}–${String(startYear + 1).slice(-2)}`;
}

function inclusiveMonths(from: Date, to: Date) {
  return (
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + to.getUTCMonth() - from.getUTCMonth() + 1
  );
}

export async function getZerodhaTradebookAnalytics(userId: string) {
  const [rows, imports] = await Promise.all([
    db
      .select({
        id: ledgerEntry.id,
        externalId: ledgerEntry.externalId,
        instrumentId: instrument.id,
        name: instrument.name,
        isin: instrument.isin,
        category: instrument.assetClass,
        occurredAt: ledgerEntry.occurredAt,
        entryType: ledgerEntry.entryType,
        quantity: ledgerEntry.quantity,
        price: ledgerEntry.price,
        grossAmount: ledgerEntry.grossAmount,
      })
      .from(ledgerEntry)
      .innerJoin(
        portfolioSource,
        and(
          eq(ledgerEntry.sourceId, portfolioSource.id),
          eq(portfolioSource.userId, userId),
          eq(portfolioSource.provider, "zerodha"),
        ),
      )
      .innerJoin(
        importBatch,
        and(
          eq(ledgerEntry.batchId, importBatch.id),
          eq(importBatch.userId, userId),
          eq(importBatch.kind, "zerodha_tradebook"),
          eq(importBatch.status, "completed"),
        ),
      )
      .innerJoin(
        instrument,
        and(eq(ledgerEntry.instrumentId, instrument.id), eq(instrument.userId, userId)),
      )
      .where(eq(ledgerEntry.userId, userId))
      .orderBy(asc(ledgerEntry.occurredAt), asc(ledgerEntry.createdAt)),
    db
      .select({
        id: importBatch.id,
        fileName: importBatch.fileName,
        statementDate: importBatch.statementDate,
        rowCount: importBatch.rowCount,
        insertedRows: importBatch.insertedRows,
        skippedRows: importBatch.skippedRows,
        summary: importBatch.summary,
        createdAt: importBatch.createdAt,
      })
      .from(importBatch)
      .where(
        and(
          eq(importBatch.userId, userId),
          eq(importBatch.kind, "zerodha_tradebook"),
          eq(importBatch.status, "completed"),
        ),
      )
      .orderBy(desc(importBatch.createdAt))
      .limit(100),
  ]);

  const trades = rows.map((row) => {
    const signedQuantity = Number(row.quantity ?? 0);
    return {
      ...row,
      quantity: Math.abs(signedQuantity),
      signedQuantity,
      price: Number(row.price ?? 0),
      amount: Math.abs(Number(row.grossAmount ?? 0)),
    };
  });

  type Flow = { month: string; buys: number; sells: number; netInvested: number; trades: number };
  const monthly = new Map<string, Flow>();
  const yearly = new Map<
    string,
    {
      financialYear: string;
      buys: number;
      sells: number;
      netInvested: number;
      trades: number;
      months: Set<string>;
    }
  >();
  const fundMap = new Map<
    string,
    {
      instrumentId: string;
      name: string;
      isin: string;
      category: string;
      buyAmount: number;
      sellAmount: number;
      buyQuantity: number;
      sellQuantity: number;
      buyTrades: number;
      sellTrades: number;
      positionQuantity: number;
      costBasis: number;
      realizedPnl: number;
      historyComplete: boolean;
      lastTradeAt: Date;
    }
  >();

  for (const trade of trades) {
    const month = trade.occurredAt.toISOString().slice(0, 7);
    const isBuy = trade.entryType === "buy";
    const currentMonth = monthly.get(month) ?? {
      month,
      buys: 0,
      sells: 0,
      netInvested: 0,
      trades: 0,
    };
    currentMonth[isBuy ? "buys" : "sells"] += trade.amount;
    currentMonth.netInvested += isBuy ? trade.amount : -trade.amount;
    currentMonth.trades += 1;
    monthly.set(month, currentMonth);

    const fy = financialYear(trade.occurredAt);
    const currentYear = yearly.get(fy) ?? {
      financialYear: fy,
      buys: 0,
      sells: 0,
      netInvested: 0,
      trades: 0,
      months: new Set<string>(),
    };
    currentYear[isBuy ? "buys" : "sells"] += trade.amount;
    currentYear.netInvested += isBuy ? trade.amount : -trade.amount;
    currentYear.trades += 1;
    currentYear.months.add(month);
    yearly.set(fy, currentYear);

    const fund = fundMap.get(trade.instrumentId) ?? {
      instrumentId: trade.instrumentId,
      name: trade.name,
      isin: trade.isin,
      category: trade.category,
      buyAmount: 0,
      sellAmount: 0,
      buyQuantity: 0,
      sellQuantity: 0,
      buyTrades: 0,
      sellTrades: 0,
      positionQuantity: 0,
      costBasis: 0,
      realizedPnl: 0,
      historyComplete: true,
      lastTradeAt: trade.occurredAt,
    };
    if (isBuy) {
      fund.buyAmount += trade.amount;
      fund.buyQuantity += trade.quantity;
      fund.buyTrades += 1;
      fund.positionQuantity += trade.quantity;
      fund.costBasis += trade.amount;
    } else {
      fund.sellAmount += trade.amount;
      fund.sellQuantity += trade.quantity;
      fund.sellTrades += 1;
      if (trade.quantity > fund.positionQuantity + 0.00000001) {
        fund.historyComplete = false;
      } else {
        const averageCost = fund.positionQuantity > 0 ? fund.costBasis / fund.positionQuantity : 0;
        fund.realizedPnl += trade.amount - averageCost * trade.quantity;
        fund.positionQuantity -= trade.quantity;
        fund.costBasis = Math.max(fund.costBasis - averageCost * trade.quantity, 0);
      }
    }
    fund.lastTradeAt = trade.occurredAt;
    fundMap.set(trade.instrumentId, fund);
  }

  const totalBuys = trades
    .filter((trade) => trade.entryType === "buy")
    .reduce((sum, trade) => sum + trade.amount, 0);
  const totalSells = trades
    .filter((trade) => trade.entryType === "sell")
    .reduce((sum, trade) => sum + trade.amount, 0);
  const funds = [...fundMap.values()]
    .map((fund) => ({
      ...fund,
      netCashInvested: fund.buyAmount - fund.sellAmount,
      averageBuyPrice: fund.buyQuantity > 0 ? fund.buyAmount / fund.buyQuantity : null,
      averageSellPrice: fund.sellQuantity > 0 ? fund.sellAmount / fund.sellQuantity : null,
      realizedPnl: fund.historyComplete ? fund.realizedPnl : null,
    }))
    .sort((left, right) => right.buyAmount - left.buyAmount);
  const incompleteFunds = funds.filter((fund) => !fund.historyComplete);
  const firstTradeAt = trades[0]?.occurredAt ?? null;
  const lastTradeAt = trades.at(-1)?.occurredAt ?? null;
  const monthsWithBuys = [...monthly.values()].filter((item) => item.buys > 0).length;
  const coveredMonths =
    firstTradeAt && lastTradeAt ? inclusiveMonths(firstTradeAt, lastTradeAt) : 0;

  return {
    imports,
    monthly: [...monthly.values()].sort((left, right) => left.month.localeCompare(right.month)),
    financialYears: [...yearly.values()]
      .map((year) => ({ ...year, activeMonths: year.months.size, months: undefined }))
      .sort((left, right) => left.financialYear.localeCompare(right.financialYear)),
    funds,
    trades,
    recentTrades: [...trades].reverse().slice(0, 25),
    summary: {
      trades: trades.length,
      instruments: funds.length,
      totalBuys,
      totalSells,
      netInvested: totalBuys - totalSells,
      firstTradeAt,
      lastTradeAt,
      importFiles: imports.length,
      fullyOverlappingFiles: imports.filter((item) => item.insertedRows === 0).length,
      monthsWithBuys,
      coveredMonths,
      contributionConsistency: coveredMonths > 0 ? monthsWithBuys / coveredMonths : 0,
      averageMonthlyBuy: monthsWithBuys > 0 ? totalBuys / monthsWithBuys : 0,
      sellToBuyRatio: totalBuys > 0 ? totalSells / totalBuys : 0,
      largestFundContributionShare: totalBuys > 0 ? (funds[0]?.buyAmount ?? 0) / totalBuys : 0,
      performanceReady: incompleteFunds.length === 0 && trades.length > 0,
      incompleteInstrumentCount: incompleteFunds.length,
      realizedPnl:
        incompleteFunds.length === 0
          ? funds.reduce((sum, fund) => sum + (fund.realizedPnl ?? 0), 0)
          : null,
    },
  };
}

export async function getZerodhaTradebookExport(userId: string) {
  return getZerodhaTradebookAnalytics(userId);
}
