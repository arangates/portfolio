import "server-only";

import {
  db,
  importBatch,
  importRow,
  instrument,
  ledgerEntry,
  portfolioSource,
} from "@portfolio/db";
import { and, asc, desc, eq } from "drizzle-orm";

import {
  annualizeReturn,
  calculateAverageCostPosition,
  calculateModifiedDietz,
  calculateXirr,
  chainReturns,
  type DatedCashFlow,
} from "./verified-returns-calculations";
import {
  getEquitySnapshotHistory,
  getLatestZerodhaPortfolio,
  getPortfolioPreference,
} from "./portfolio-queries";

export type ReturnEvidenceGrade = "reconciled" | "exact" | "derived" | "unavailable";

type TradeRow = {
  id: string;
  externalId: string | null;
  instrumentId: string;
  name: string;
  isin: string;
  category: string;
  occurredAt: Date;
  entryType: string;
  quantity: number;
  grossAmount: number;
  netAmount: number;
  fees: number;
  currency: string;
};

function dateIso(value: Date | string) {
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

function monthKey(value: Date) {
  return value.toISOString().slice(0, 7);
}

function tolerance(quantity: number) {
  return Math.max(0.000001, Math.abs(quantity) * 0.00000001);
}

function flowSeries(
  flows: Array<{
    occurredAt: Date;
    contribution: number;
    withdrawal: number;
    included?: boolean;
  }>,
) {
  const months = new Map<
    string,
    {
      month: string;
      contributions: number;
      withdrawals: number;
      netContributions: number;
      excluded: number;
    }
  >();
  for (const flow of flows) {
    const month = monthKey(flow.occurredAt);
    const current = months.get(month) ?? {
      month,
      contributions: 0,
      withdrawals: 0,
      netContributions: 0,
      excluded: 0,
    };
    if (flow.included === false) {
      current.excluded += flow.contribution - flow.withdrawal;
    } else {
      current.contributions += flow.contribution;
      current.withdrawals += flow.withdrawal;
      current.netContributions += flow.contribution - flow.withdrawal;
    }
    months.set(month, current);
  }

  let cumulative = 0;
  return [...months.values()]
    .sort((left, right) => left.month.localeCompare(right.month))
    .map((item) => {
      cumulative += item.netContributions;
      return { ...item, cumulativeNetContributions: cumulative };
    });
}

async function getBrokerTrades(userId: string, provider: "zerodha" | "degiro") {
  const kind = provider === "zerodha" ? "zerodha_tradebook" : "degiro_transactions";
  const rows = await db
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
      grossAmount: ledgerEntry.grossAmount,
      netAmount: ledgerEntry.netAmount,
      fees: ledgerEntry.fees,
      currency: ledgerEntry.currency,
    })
    .from(ledgerEntry)
    .innerJoin(
      portfolioSource,
      and(
        eq(ledgerEntry.sourceId, portfolioSource.id),
        eq(portfolioSource.userId, userId),
        eq(portfolioSource.provider, provider),
      ),
    )
    .innerJoin(
      importBatch,
      and(
        eq(ledgerEntry.batchId, importBatch.id),
        eq(importBatch.userId, userId),
        eq(importBatch.kind, kind),
        eq(importBatch.status, "completed"),
      ),
    )
    .innerJoin(
      instrument,
      and(eq(ledgerEntry.instrumentId, instrument.id), eq(instrument.userId, userId)),
    )
    .where(eq(ledgerEntry.userId, userId))
    .orderBy(asc(ledgerEntry.occurredAt), asc(ledgerEntry.createdAt));

  return rows.map(
    (row): TradeRow => ({
      ...row,
      quantity: Number(row.quantity ?? 0),
      grossAmount: Math.abs(Number(row.grossAmount ?? 0)),
      netAmount: Number(row.netAmount ?? 0),
      fees: Number(row.fees ?? 0),
    }),
  );
}

async function getDegiroAccountRows(userId: string) {
  const rows = await db
    .select({
      id: ledgerEntry.id,
      externalId: ledgerEntry.externalId,
      occurredAt: ledgerEntry.occurredAt,
      entryType: ledgerEntry.entryType,
      description: ledgerEntry.description,
      netAmount: ledgerEntry.netAmount,
      balance: ledgerEntry.balance,
      currency: ledgerEntry.currency,
      payload: importRow.payload,
      rowNumber: importRow.rowNumber,
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
        eq(importBatch.kind, "degiro_account"),
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
    .where(eq(ledgerEntry.userId, userId))
    .orderBy(asc(ledgerEntry.occurredAt), desc(importRow.rowNumber));

  const unique = new Map<string, (typeof rows)[number]>();
  for (const row of rows) unique.set(row.id, row);
  return [...unique.values()];
}

function buildZerodhaScope(
  trades: TradeRow[],
  portfolio: NonNullable<Awaited<ReturnType<typeof getLatestZerodhaPortfolio>>>,
  snapshots: Awaited<ReturnType<typeof getEquitySnapshotHistory>>,
) {
  const valuationDate = portfolio.statementDate
    ? new Date(`${portfolio.statementDate}T12:00:00Z`)
    : portfolio.createdAt;
  const holdingByInstrument = new Map(
    portfolio.holdings.map((holding) => [holding.instrumentId, holding]),
  );
  const tradesByInstrument = new Map<string, TradeRow[]>();
  for (const trade of trades) {
    const current = tradesByInstrument.get(trade.instrumentId) ?? [];
    current.push(trade);
    tradesByInstrument.set(trade.instrumentId, current);
  }
  const instrumentIds = new Set([...holdingByInstrument.keys(), ...tradesByInstrument.keys()]);
  const positions = [...instrumentIds].map((instrumentId) => {
    const instrumentTrades = tradesByInstrument.get(instrumentId) ?? [];
    const holding = holdingByInstrument.get(instrumentId);
    const averageCost = calculateAverageCostPosition(
      instrumentTrades.map((trade) => ({
        quantity: trade.quantity,
        cashAmount: trade.grossAmount,
      })),
    );
    const latestTrade = instrumentTrades.at(-1);
    const holdingQuantity = holding?.quantity ?? 0;
    const unitDifference = holdingQuantity - averageCost.quantity;
    const reconciled =
      averageCost.complete && Math.abs(unitDifference) <= tolerance(holdingQuantity);
    const purchases = instrumentTrades
      .filter((trade) => trade.entryType === "buy")
      .reduce((sum, trade) => sum + trade.grossAmount, 0);
    const sales = instrumentTrades
      .filter((trade) => trade.entryType === "sell")
      .reduce((sum, trade) => sum + trade.grossAmount, 0);
    const terminalValue = holding?.marketValue ?? 0;
    const datedFlows: DatedCashFlow[] = instrumentTrades.map((trade) => ({
      date: trade.occurredAt,
      amount: trade.entryType === "buy" ? -trade.grossAmount : trade.grossAmount,
    }));
    if (terminalValue > 0) datedFlows.push({ date: valuationDate, amount: terminalValue });
    const xirr = reconciled ? calculateXirr(datedFlows) : null;

    return {
      instrumentId,
      name: holding?.name ?? latestTrade?.name ?? "Unknown instrument",
      isin: holding?.isin ?? latestTrade?.isin ?? "—",
      category: holding?.category ?? latestTrade?.category ?? "Unknown",
      quantity: holdingQuantity,
      tradeQuantity: averageCost.quantity,
      unitDifference,
      purchases,
      sales,
      currentValue: terminalValue,
      cashFlowGain: reconciled ? terminalValue + sales - purchases : null,
      realizedPnl: reconciled ? averageCost.realizedPnl : null,
      unrealizedPnl: holding?.unrealizedPnl ?? null,
      xirr: xirr?.rate ?? null,
      xirrStatus: reconciled ? (xirr?.status ?? "invalid") : "unreconciled",
      reconciled,
      valuationBasis: holding ? "Broker holdings snapshot" : "Closed from imported trades",
      lastActivityAt: latestTrade ? dateIso(latestTrade.occurredAt) : null,
    };
  });

  const includedIds = new Set(
    positions.filter((position) => position.reconciled).map((position) => position.instrumentId),
  );
  const includedTrades = trades.filter((trade) => includedIds.has(trade.instrumentId));
  const includedHoldings = portfolio.holdings.filter((holding) =>
    includedIds.has(holding.instrumentId),
  );
  const cashFlows: DatedCashFlow[] = includedTrades.map((trade) => ({
    date: trade.occurredAt,
    amount: trade.entryType === "buy" ? -trade.grossAmount : trade.grossAmount,
  }));
  const closingValue = includedHoldings.reduce((sum, holding) => sum + holding.marketValue, 0);
  if (closingValue > 0) cashFlows.push({ date: valuationDate, amount: closingValue });
  const xirr = calculateXirr(cashFlows);
  const purchases = includedTrades
    .filter((trade) => trade.entryType === "buy")
    .reduce((sum, trade) => sum + trade.grossAmount, 0);
  const sales = includedTrades
    .filter((trade) => trade.entryType === "sell")
    .reduce((sum, trade) => sum + trade.grossAmount, 0);
  const reportedClosingValue = portfolio.holdings.reduce(
    (sum, holding) => sum + holding.marketValue,
    0,
  );
  const reconciledHoldingCount = portfolio.holdings.filter((holding) =>
    includedIds.has(holding.instrumentId),
  ).length;

  const intervals = snapshots.slice(1).map((endSnapshot, index) => {
    const startSnapshot = snapshots[index]!;
    const startDate = new Date(`${startSnapshot.date}T12:00:00Z`);
    const endDate = new Date(`${endSnapshot.date}T12:00:00Z`);
    const intervalFlows = trades
      .filter((trade) => trade.occurredAt > startDate && trade.occurredAt <= endDate)
      .map((trade) => ({
        date: trade.occurredAt,
        amount: trade.entryType === "buy" ? trade.grossAmount : -trade.grossAmount,
      }));
    return {
      from: startSnapshot.date,
      to: endSnapshot.date,
      startValue: startSnapshot.marketValue,
      endValue: endSnapshot.marketValue,
      netFlow: intervalFlows.reduce((sum, flow) => sum + flow.amount, 0),
      return: calculateModifiedDietz({
        startDate,
        endDate,
        startValue: startSnapshot.marketValue,
        endValue: endSnapshot.marketValue,
        flows: intervalFlows,
      }),
    };
  });
  const validIntervalReturns = intervals
    .map((interval) => interval.return)
    .filter((value): value is number => value !== null);
  const linkedModifiedDietz =
    intervals.length > 0 && validIntervalReturns.length === intervals.length
      ? chainReturns(validIntervalReturns)
      : null;
  const snapshotSpanDays =
    snapshots[0] && snapshots.at(-1)
      ? (new Date(`${snapshots.at(-1)!.date}T12:00:00Z`).getTime() -
          new Date(`${snapshots[0].date}T12:00:00Z`).getTime()) /
        86_400_000
      : 0;
  const linkedAnnualized =
    linkedModifiedDietz !== null && snapshots[0] && snapshots.at(-1) && snapshotSpanDays >= 365
      ? annualizeReturn(linkedModifiedDietz, snapshots[0].date, snapshots.at(-1)!.date)
      : null;

  const monthly = flowSeries(
    trades.map((trade) => ({
      occurredAt: trade.occurredAt,
      contribution: trade.entryType === "buy" ? trade.grossAmount : 0,
      withdrawal: trade.entryType === "sell" ? trade.grossAmount : 0,
      included: includedIds.has(trade.instrumentId),
    })),
  );

  return {
    id: "zerodha" as const,
    label: "Indian equity · Zerodha",
    currency: "INR",
    evidenceGrade: "reconciled" as const,
    valuationDate: dateIso(valuationDate),
    valuationBasis: "Latest imported Zerodha holdings snapshot",
    metrics: {
      moneyWeightedReturn: xirr.rate,
      moneyWeightedStatus: xirr.status,
      linkedModifiedDietz,
      linkedAnnualized,
      trueTimeWeightedReturn: null,
      purchases,
      sales,
      netContributions: purchases - sales,
      closingValue,
      reportedClosingValue,
      excludedClosingValue: Math.max(reportedClosingValue - closingValue, 0),
      cashFlowGain: closingValue + sales - purchases,
      realizedPnl: positions.reduce((sum, position) => sum + (position.realizedPnl ?? 0), 0),
      unrealizedPnl: includedHoldings.reduce((sum, holding) => sum + holding.unrealizedPnl, 0),
      attributionResidual:
        closingValue +
        sales -
        purchases -
        positions.reduce((sum, position) => sum + (position.realizedPnl ?? 0), 0) -
        includedHoldings.reduce((sum, holding) => sum + holding.unrealizedPnl, 0),
      dividends: null,
      fees: null,
    },
    coverage: {
      holdings: portfolio.holdings.length,
      reconciledHoldings: reconciledHoldingCount,
      valueCoverage: reportedClosingValue > 0 ? closingValue / reportedClosingValue : 0,
      includedInstruments: includedIds.size,
      excludedInstruments: positions.filter((position) => !position.reconciled).length,
      firstFlowAt: includedTrades[0] ? dateIso(includedTrades[0].occurredAt) : null,
      lastFlowAt: includedTrades.at(-1) ? dateIso(includedTrades.at(-1)!.occurredAt) : null,
    },
    monthly,
    intervals,
    positions: positions.sort((left, right) => right.currentValue - left.currentValue),
  };
}

function externalDegiroFlow(description: string | null, amount: number) {
  const value = (description ?? "").toLowerCase();
  if (amount > 0 && (value.includes("ideal deposit") || value.includes("bank deposit"))) {
    return { contribution: amount, withdrawal: 0 };
  }
  if (
    amount < 0 &&
    (value.includes("sepa instant terugstorting") ||
      value.includes("flatex terugstorting") ||
      value.includes("bank withdrawal"))
  ) {
    return { contribution: 0, withdrawal: Math.abs(amount) };
  }
  return null;
}

function buildDegiroScope(
  trades: TradeRow[],
  accountRows: Awaited<ReturnType<typeof getDegiroAccountRows>>,
) {
  const latestDataDate =
    [...trades.map((trade) => trade.occurredAt), ...accountRows.map((row) => row.occurredAt)].sort(
      (left, right) => right.getTime() - left.getTime(),
    )[0] ?? new Date();
  const tradesByInstrument = new Map<string, TradeRow[]>();
  for (const trade of trades) {
    const current = tradesByInstrument.get(trade.instrumentId) ?? [];
    current.push(trade);
    tradesByInstrument.set(trade.instrumentId, current);
  }

  const positions = [...tradesByInstrument.entries()].map(([instrumentId, instrumentTrades]) => {
    const averageCost = calculateAverageCostPosition(
      instrumentTrades.map((trade) => ({
        quantity: trade.quantity,
        cashAmount: Math.abs(trade.netAmount) || trade.grossAmount + Math.abs(trade.fees),
      })),
    );
    const latestTrade = instrumentTrades.at(-1)!;
    const latestUnitValue =
      latestTrade.grossAmount > 0 && Math.abs(latestTrade.quantity) > 0
        ? latestTrade.grossAmount / Math.abs(latestTrade.quantity)
        : 0;
    const currentValue = Math.max(averageCost.quantity, 0) * latestUnitValue;
    const purchases = instrumentTrades
      .filter((trade) => trade.entryType === "buy")
      .reduce((sum, trade) => sum + (Math.abs(trade.netAmount) || trade.grossAmount), 0);
    const sales = instrumentTrades
      .filter((trade) => trade.entryType === "sell")
      .reduce((sum, trade) => sum + (Math.abs(trade.netAmount) || trade.grossAmount), 0);
    const flows: DatedCashFlow[] = instrumentTrades.map((trade) => ({
      date: trade.occurredAt,
      amount:
        trade.entryType === "buy"
          ? -(Math.abs(trade.netAmount) || trade.grossAmount)
          : Math.abs(trade.netAmount) || trade.grossAmount,
    }));
    if (currentValue > 0) flows.push({ date: latestTrade.occurredAt, amount: currentValue });
    const xirr = averageCost.complete ? calculateXirr(flows) : null;
    return {
      instrumentId,
      name: latestTrade.name,
      isin: latestTrade.isin,
      category: latestTrade.category,
      quantity: averageCost.quantity,
      tradeQuantity: averageCost.quantity,
      unitDifference: 0,
      purchases,
      sales,
      currentValue,
      cashFlowGain: averageCost.complete ? currentValue + sales - purchases : null,
      realizedPnl: averageCost.complete ? averageCost.realizedPnl : null,
      unrealizedPnl: averageCost.complete ? currentValue - averageCost.costBasis : null,
      xirr: xirr?.rate ?? null,
      xirrStatus: averageCost.complete ? (xirr?.status ?? "invalid") : "unreconciled",
      reconciled: averageCost.complete,
      valuationBasis: "Last imported trade price in EUR",
      lastActivityAt: dateIso(latestTrade.occurredAt),
    };
  });

  const balances = new Map<string, { amount: number; asOf: Date }>();
  for (const row of accountRows) {
    const balanceCurrency = String(row.payload.Balance ?? "")
      .trim()
      .toUpperCase();
    const amount = Number(row.balance ?? 0);
    if (balanceCurrency && Number.isFinite(amount)) {
      balances.set(balanceCurrency, { amount, asOf: row.occurredAt });
    }
  }
  const eurCash = balances.get("EUR")?.amount ?? 0;
  const excludedCash = [...balances.entries()]
    .filter(([currency]) => currency !== "EUR")
    .map(([currency, balance]) => ({ currency, ...balance, asOf: dateIso(balance.asOf) }));
  const externalFlows = accountRows
    .map((row) => {
      const amount = Number(row.netAmount ?? 0);
      const classified = externalDegiroFlow(row.description, amount);
      return classified ? { ...classified, occurredAt: row.occurredAt } : null;
    })
    .filter((flow): flow is NonNullable<typeof flow> => flow !== null);
  const contributions = externalFlows.reduce((sum, flow) => sum + flow.contribution, 0);
  const withdrawals = externalFlows.reduce((sum, flow) => sum + flow.withdrawal, 0);
  const holdingsValue = positions.reduce((sum, position) => sum + position.currentValue, 0);
  const terminalValue = holdingsValue + eurCash;
  const accountCashFlows: DatedCashFlow[] = externalFlows.map((flow) => ({
    date: flow.occurredAt,
    amount: flow.contribution > 0 ? -flow.contribution : flow.withdrawal,
  }));
  if (terminalValue > 0) accountCashFlows.push({ date: latestDataDate, amount: terminalValue });
  const xirr = calculateXirr(accountCashFlows);

  const transactionFeeByExternalId = new Map<string, number>();
  for (const trade of trades) {
    if (trade.externalId) {
      transactionFeeByExternalId.set(
        trade.externalId,
        (transactionFeeByExternalId.get(trade.externalId) ?? 0) + Math.abs(trade.fees),
      );
    }
  }
  const transactionFees = trades.reduce((sum, trade) => sum + Math.abs(trade.fees), 0);
  const standaloneFees = accountRows
    .filter((row) => {
      if (row.entryType !== "fee") return false;
      return !row.externalId || (transactionFeeByExternalId.get(row.externalId) ?? 0) === 0;
    })
    .reduce((sum, row) => sum + Math.abs(Number(row.netAmount ?? 0)), 0);
  const dividendByCurrency = new Map<string, number>();
  for (const row of accountRows.filter((item) => item.entryType === "dividend")) {
    dividendByCurrency.set(
      row.currency,
      (dividendByCurrency.get(row.currency) ?? 0) + Number(row.netAmount ?? 0),
    );
  }
  const dividends = [...dividendByCurrency.entries()].map(([currency, amount]) => ({
    currency,
    amount,
  }));
  const eurDividends = dividendByCurrency.get("EUR") ?? 0;
  const realizedPnl = positions.reduce((sum, position) => sum + (position.realizedPnl ?? 0), 0);
  const unrealizedPnl = positions.reduce((sum, position) => sum + (position.unrealizedPnl ?? 0), 0);
  const cashFlowGain = terminalValue + withdrawals - contributions;

  return {
    id: "degiro" as const,
    label: "Global equity · Degiro",
    currency: "EUR",
    evidenceGrade: "derived" as const,
    valuationDate: dateIso(latestDataDate),
    valuationBasis: "Last imported trade prices plus latest account-statement cash",
    metrics: {
      moneyWeightedReturn: xirr.rate,
      moneyWeightedStatus: xirr.status,
      linkedModifiedDietz: null,
      linkedAnnualized: null,
      trueTimeWeightedReturn: null,
      purchases: trades
        .filter((trade) => trade.entryType === "buy")
        .reduce((sum, trade) => sum + Math.abs(trade.netAmount), 0),
      sales: trades
        .filter((trade) => trade.entryType === "sell")
        .reduce((sum, trade) => sum + Math.abs(trade.netAmount), 0),
      netContributions: contributions - withdrawals,
      closingValue: terminalValue,
      reportedClosingValue: terminalValue,
      excludedClosingValue: 0,
      cashFlowGain,
      realizedPnl,
      unrealizedPnl,
      attributionResidual:
        cashFlowGain - realizedPnl - unrealizedPnl - eurDividends + standaloneFees,
      dividends,
      fees: transactionFees + standaloneFees,
    },
    coverage: {
      holdings: positions.filter((position) => position.quantity > tolerance(position.quantity))
        .length,
      reconciledHoldings: 0,
      valueCoverage: excludedCash.length === 0 ? 1 : null,
      includedInstruments: positions.filter((position) => position.reconciled).length,
      excludedInstruments: positions.filter((position) => !position.reconciled).length,
      firstFlowAt: externalFlows[0] ? dateIso(externalFlows[0].occurredAt) : null,
      lastFlowAt: externalFlows.at(-1) ? dateIso(externalFlows.at(-1)!.occurredAt) : null,
    },
    monthly: flowSeries(externalFlows),
    intervals: [],
    positions: positions.sort((left, right) => right.currentValue - left.currentValue),
    cashBalances: [...balances.entries()].map(([currency, balance]) => ({
      currency,
      amount: balance.amount,
      asOf: dateIso(balance.asOf),
      included: currency === "EUR",
    })),
    excludedCash,
    feeReconciliation: {
      transactionFees,
      standaloneFees,
      matchedAccountFeeRows: accountRows.filter(
        (row) =>
          row.entryType === "fee" &&
          Boolean(row.externalId) &&
          (transactionFeeByExternalId.get(row.externalId!) ?? 0) > 0,
      ).length,
    },
  };
}

export async function getVerifiedReturnsEngine(userId: string) {
  const [preference, zerodhaPortfolio, zerodhaSnapshots, zerodhaTrades, degiroTrades, accountRows] =
    await Promise.all([
      getPortfolioPreference(userId),
      getLatestZerodhaPortfolio(userId),
      getEquitySnapshotHistory(userId),
      getBrokerTrades(userId, "zerodha"),
      getBrokerTrades(userId, "degiro"),
      getDegiroAccountRows(userId),
    ]);

  const zerodha = zerodhaPortfolio
    ? buildZerodhaScope(zerodhaTrades, zerodhaPortfolio, zerodhaSnapshots)
    : null;
  const degiro =
    degiroTrades.length > 0 || accountRows.length > 0
      ? buildDegiroScope(degiroTrades, accountRows)
      : null;
  const scopes = [zerodha, degiro].filter(
    (scope): scope is NonNullable<typeof scope> => scope !== null,
  );

  return {
    preference,
    scopes,
    summary: {
      zerodhaXirr: zerodha?.metrics.moneyWeightedReturn ?? null,
      degiroXirr: degiro?.metrics.moneyWeightedReturn ?? null,
      verifiedValueCoverage: zerodha?.coverage.valueCoverage ?? 0,
      verifiedClosingValue: zerodha?.metrics.closingValue ?? 0,
      excludedClosingValue: zerodha?.metrics.excludedClosingValue ?? 0,
      excludedCashCurrencies:
        degiro?.excludedCash
          .filter((balance) => Math.abs(balance.amount) > 0.00000001)
          .map((balance) => balance.currency) ?? [],
      combinedReturnAvailable: false,
    },
    evidence: [
      {
        key: "zerodha-cash-flows",
        label: "Zerodha transaction cash flows",
        grade: "exact" as const,
        status: zerodhaTrades.length > 0 ? ("available" as const) : ("blocked" as const),
        detail: `${zerodhaTrades.length} deduplicated buy and sell executions. The tradebook does not include charges or cash dividends.`,
      },
      {
        key: "zerodha-reconciliation",
        label: "Zerodha terminal units",
        grade: "reconciled" as const,
        status:
          (zerodha?.coverage.excludedInstruments ?? 0) === 0
            ? ("available" as const)
            : ("limited" as const),
        detail: zerodha
          ? `${zerodha.coverage.reconciledHoldings}/${zerodha.coverage.holdings} open holdings reconcile to imported trade units; only reconciled instruments enter XIRR.`
          : "Import a holdings statement and tradebooks to reconcile terminal units.",
      },
      {
        key: "zerodha-twr",
        label: "True time-weighted return",
        grade: "unavailable" as const,
        status: "blocked" as const,
        detail:
          "True TWR needs a valuation immediately around every external flow. Snapshot intervals are shown only as linked Modified Dietz estimates.",
      },
      {
        key: "degiro-account-flows",
        label: "Degiro external cash flows",
        grade: "exact" as const,
        status: degiro ? ("available" as const) : ("blocked" as const),
        detail:
          "Deposits and withdrawals come from account-statement descriptions; trades, cash sweeps and FX conversions remain internal.",
      },
      {
        key: "degiro-fees",
        label: "Degiro fees",
        grade: "reconciled" as const,
        status: degiro ? ("available" as const) : ("blocked" as const),
        detail: degiro
          ? `${degiro.feeReconciliation.matchedAccountFeeRows} account-statement fee rows match transaction IDs and are counted once; standalone fees remain included.`
          : "Import Transactions and Account CSV files to reconcile fees.",
      },
      {
        key: "degiro-valuation",
        label: "Degiro terminal valuation",
        grade: "derived" as const,
        status: degiro ? ("limited" as const) : ("blocked" as const),
        detail:
          "Open holdings use the last imported trade price, not a current market quote. Degiro XIRR is therefore an estimate, never labelled verified.",
      },
      {
        key: "combined-return",
        label: "Combined cross-currency return",
        grade: "unavailable" as const,
        status: "blocked" as const,
        detail:
          "A combined return is withheld until historical FX exists for every dated cash flow. Latest FX is not substituted for historical rates.",
      },
    ],
  };
}

export async function getVerifiedReturnsExport(userId: string) {
  return getVerifiedReturnsEngine(userId);
}
