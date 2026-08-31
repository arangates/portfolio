import "server-only";

import {
  capitalAllocationTarget,
  capitalDeploymentPolicy,
  db,
  importBatch,
  instrument,
  ledgerEntry,
  portfolioSource,
} from "@portfolio/db";
import { and, asc, eq, sql } from "drizzle-orm";

import {
  allocateNextContribution,
  classifyIndianHolding,
  deploymentBucketLabels,
  deploymentBuckets,
  differenceInCalendarDays,
  fixedDepositMaturityValue,
  type DeploymentBucket,
} from "./capital-deployment-calculations";
import {
  getBankAccounts,
  getCurrentFixedDeposits,
  getDegiroAnalytics,
  getGlobalEquityPortfolio,
  getLatestExchangeRates,
  getLatestZerodhaPortfolio,
  getPortfolioPreference,
} from "./portfolio-queries";

type Confidence = "reconciled" | "exact" | "derived" | "inferred";

const emptyBucketValues = () =>
  Object.fromEntries(deploymentBuckets.map((bucket) => [bucket, 0])) as Record<
    DeploymentBucket,
    number
  >;

function maxDate(values: Array<Date | string | null | undefined>) {
  return values
    .filter((value): value is Date | string => Boolean(value))
    .map((value) => new Date(value))
    .sort((left, right) => right.getTime() - left.getTime())[0];
}

export async function getCapitalDeploymentEngine(userId: string) {
  const [
    preference,
    rates,
    indianPortfolio,
    globalPortfolio,
    degiro,
    accounts,
    fixedDeposits,
    policyRow,
    targetRows,
    tradeRows,
  ] = await Promise.all([
    getPortfolioPreference(userId),
    getLatestExchangeRates(userId),
    getLatestZerodhaPortfolio(userId),
    getGlobalEquityPortfolio(userId),
    getDegiroAnalytics(userId),
    getBankAccounts(userId),
    getCurrentFixedDeposits(userId),
    db
      .select()
      .from(capitalDeploymentPolicy)
      .where(eq(capitalDeploymentPolicy.userId, userId))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    db.select().from(capitalAllocationTarget).where(eq(capitalAllocationTarget.userId, userId)),
    db
      .select({
        id: ledgerEntry.id,
        provider: portfolioSource.provider,
        instrumentId: ledgerEntry.instrumentId,
        instrumentName: instrument.name,
        occurredAt: ledgerEntry.occurredAt,
        entryType: ledgerEntry.entryType,
        quantity: ledgerEntry.quantity,
        grossAmount: ledgerEntry.grossAmount,
        netAmount: ledgerEntry.netAmount,
        currency: ledgerEntry.currency,
      })
      .from(ledgerEntry)
      .innerJoin(
        portfolioSource,
        and(eq(ledgerEntry.sourceId, portfolioSource.id), eq(portfolioSource.userId, userId)),
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
      .where(and(eq(ledgerEntry.userId, userId), sql`${ledgerEntry.entryType} in ('buy', 'sell')`))
      .orderBy(asc(ledgerEntry.occurredAt), asc(ledgerEntry.createdAt)),
  ]);

  const rateMap = new Map(
    rates
      .filter((rate) => rate.baseCurrency === preference.baseCurrency)
      .map((rate) => [rate.quoteCurrency, rate.rate]),
  );
  rateMap.set(preference.baseCurrency, 1);
  const missingCurrencies = new Set<string>();
  const convert = (value: number, currency: string) => {
    const rate = rateMap.get(currency);
    if (rate === undefined) {
      missingCurrencies.add(currency);
      return null;
    }
    return value * rate;
  };

  const current = emptyBucketValues();
  const indianHoldings = indianPortfolio?.holdings ?? [];
  for (const holding of indianHoldings) {
    const value = convert(holding.marketValue, "INR");
    if (value !== null) current[classifyIndianHolding(holding.category)] += value;
  }

  const globalValue = globalPortfolio.holdings.reduce(
    (sum, holding) => sum + holding.marketValue,
    0,
  );
  current.global_equity += convert(globalValue, "EUR") ?? 0;

  for (const deposit of fixedDeposits.filter((item) => item.status === "active")) {
    current.fixed_income += convert(deposit.principal, deposit.currency) ?? 0;
  }
  const includeBankCash = policyRow?.includeBankCash ?? false;
  if (includeBankCash) {
    for (const account of accounts) current.cash += convert(account.amount, account.currency) ?? 0;
  }
  for (const balance of degiro.balances) {
    current.cash += convert(balance.balance, balance.currency) ?? 0;
  }

  const investmentTotal = deploymentBuckets.reduce((sum, bucket) => sum + current[bucket], 0);
  const stagingCandidates = indianHoldings
    .filter((holding) => classifyIndianHolding(holding.category) === "fixed_income")
    .map((holding) => ({
      instrumentId: holding.instrumentId,
      name: holding.name,
      category: holding.category,
      nativeValue: holding.marketValue,
      baseValue: convert(holding.marketValue, "INR") ?? 0,
    }))
    .sort((left, right) => right.baseValue - left.baseValue);
  const selectedStaging =
    stagingCandidates.find((item) => item.instrumentId === policyRow?.stagingInstrumentId) ??
    stagingCandidates[0] ??
    null;

  const policy = {
    configured: Boolean(policyRow),
    stagingInstrumentId: selectedStaging?.instrumentId ?? null,
    stagingSelection: policyRow?.stagingInstrumentId ? ("user" as const) : ("auto" as const),
    monthlyDeploymentAmount: Number(policyRow?.monthlyDeploymentAmount ?? 0),
    deploymentCurrency: policyRow?.deploymentCurrency ?? preference.baseCurrency,
    reserveFloor: Number(policyRow?.reserveFloor ?? 0),
    fixedDepositHorizonDays: policyRow?.fixedDepositHorizonDays ?? 365,
    transferMatchWindowDays: policyRow?.transferMatchWindowDays ?? 7,
    transferMatchTolerance: Number(policyRow?.transferMatchTolerance ?? 0.15),
    includeBankCash,
    enabled: policyRow?.enabled ?? true,
  };
  const monthlyDeploymentBase = policy.enabled
    ? (convert(policy.monthlyDeploymentAmount, policy.deploymentCurrency) ?? 0)
    : 0;
  const reserveFloorBase = convert(policy.reserveFloor, policy.deploymentCurrency) ?? 0;

  const targetByBucket = new Map(targetRows.map((row) => [row.bucket, row]));
  const targetWeight = emptyBucketValues();
  for (const bucket of deploymentBuckets) {
    targetWeight[bucket] = Number(targetByBucket.get(bucket)?.targetWeight ?? 0);
  }
  const targetSum = deploymentBuckets.reduce((sum, bucket) => sum + targetWeight[bucket], 0);
  const targetsConfigured =
    targetRows.length === deploymentBuckets.length && Math.abs(targetSum - 1) < 0.0001;
  const contributionPlan = allocateNextContribution(current, targetWeight, monthlyDeploymentBase);
  const allocation = deploymentBuckets.map((bucket) => {
    const row = targetByBucket.get(bucket);
    const currentWeight = investmentTotal > 0 ? current[bucket] / investmentTotal : 0;
    const minimumWeight = row ? Number(row.minimumWeight) : null;
    const maximumWeight = row ? Number(row.maximumWeight) : null;
    const status: "unconfigured" | "below" | "above" | "within" =
      minimumWeight === null || maximumWeight === null
        ? "unconfigured"
        : currentWeight < minimumWeight - 0.0001
          ? "below"
          : currentWeight > maximumWeight + 0.0001
            ? "above"
            : "within";
    return {
      bucket,
      label: deploymentBucketLabels[bucket],
      currentValue: current[bucket],
      currentWeight,
      targetWeight: row ? Number(row.targetWeight) : null,
      minimumWeight,
      maximumWeight,
      status,
      targetGap: row ? Number(row.targetWeight) * investmentTotal - current[bucket] : null,
      nextContribution: targetsConfigured ? contributionPlan[bucket] : 0,
    };
  });

  const now = new Date();
  const maturities = fixedDeposits
    .filter((deposit) => deposit.status === "active")
    .map((deposit) => {
      const maturityValue = fixedDepositMaturityValue(deposit);
      const daysUntil = differenceInCalendarDays(
        new Date(`${deposit.maturityDate}T00:00:00Z`),
        now,
      );
      return {
        id: deposit.id,
        bank: deposit.bank,
        maturityDate: deposit.maturityDate,
        daysUntil,
        principal: deposit.principal,
        maturityValue,
        currency: deposit.currency,
        baseValue: convert(maturityValue, deposit.currency),
      };
    })
    .sort((left, right) => left.daysUntil - right.daysUntil);
  const maturityWindows = [30, 90, 180, policy.fixedDepositHorizonDays]
    .filter((value, index, values) => values.indexOf(value) === index)
    .sort((left, right) => left - right)
    .map((days) => ({
      days,
      value: maturities
        .filter((item) => item.daysUntil >= 0 && item.daysUntil <= days)
        .reduce((sum, item) => sum + (item.baseValue ?? 0), 0),
      deposits: maturities.filter((item) => item.daysUntil >= 0 && item.daysUntil <= days).length,
    }));
  const scheduledLiquidity = maturities
    .filter((item) => item.daysUntil >= 0 && item.daysUntil <= policy.fixedDepositHorizonDays)
    .reduce((sum, item) => sum + (item.baseValue ?? 0), 0);

  const bankSurplus = accounts.reduce((sum, account) => {
    const surplus = Math.max(account.amount - (account.minimumBalance ?? 0), 0);
    return sum + (convert(surplus, account.currency) ?? 0);
  }, 0);
  const brokerCash = degiro.balances.reduce(
    (sum, balance) => sum + Math.max(convert(balance.balance, balance.currency) ?? 0, 0),
    0,
  );
  const stagingAvailable = Math.max((selectedStaging?.baseValue ?? 0) - reserveFloorBase, 0);
  const availableCapital = stagingAvailable + brokerCash + (includeBankCash ? bankSurplus : 0);

  type MonthlyFlow = {
    month: string;
    purchases: number;
    redemptions: number;
    netPurchases: number;
    zerodha: number;
    degiro: number;
  };
  const monthlyFlows = new Map<string, MonthlyFlow>();
  for (const trade of tradeRows) {
    const nativeAmount = Math.abs(Number(trade.grossAmount ?? trade.netAmount ?? 0));
    const amount = convert(nativeAmount, trade.currency);
    if (amount === null) continue;
    const month = trade.occurredAt.toISOString().slice(0, 7);
    const entry = monthlyFlows.get(month) ?? {
      month,
      purchases: 0,
      redemptions: 0,
      netPurchases: 0,
      zerodha: 0,
      degiro: 0,
    };
    const signed = trade.entryType === "buy" ? amount : -amount;
    if (trade.entryType === "buy") entry.purchases += amount;
    else entry.redemptions += amount;
    entry.netPurchases += signed;
    if (trade.provider === "zerodha") entry.zerodha += signed;
    if (trade.provider === "degiro") entry.degiro += signed;
    monthlyFlows.set(month, entry);
  }
  const flows = [...monthlyFlows.values()].sort((left, right) =>
    left.month.localeCompare(right.month),
  );

  const stagingTrades = selectedStaging
    ? tradeRows.filter(
        (trade) =>
          trade.provider === "zerodha" && trade.instrumentId === selectedStaging.instrumentId,
      )
    : [];
  const eligibleBuys = tradeRows.filter(
    (trade) =>
      trade.provider === "zerodha" &&
      trade.entryType === "buy" &&
      trade.instrumentId !== selectedStaging?.instrumentId,
  );
  const usedBuys = new Set<string>();
  const inferredTransfers = stagingTrades
    .filter((trade) => trade.entryType === "sell")
    .map((sale) => {
      const saleAmount = Math.abs(Number(sale.grossAmount ?? sale.netAmount ?? 0));
      const matches = eligibleBuys.filter((buy) => {
        if (usedBuys.has(buy.id)) return false;
        const days = differenceInCalendarDays(buy.occurredAt, sale.occurredAt);
        return days >= 0 && days <= policy.transferMatchWindowDays;
      });
      const selected: typeof matches = [];
      let purchaseAmount = 0;
      for (const buy of matches) {
        if (purchaseAmount >= saleAmount * (1 + policy.transferMatchTolerance)) break;
        selected.push(buy);
        purchaseAmount += Math.abs(Number(buy.grossAmount ?? buy.netAmount ?? 0));
      }
      for (const buy of selected) usedBuys.add(buy.id);
      const differenceRate =
        saleAmount > 0 ? Math.abs(purchaseAmount - saleAmount) / saleAmount : 1;
      const matchConfidence =
        differenceRate <= policy.transferMatchTolerance
          ? "high"
          : differenceRate <= policy.transferMatchTolerance * 2
            ? "medium"
            : "low";
      return {
        id: sale.id,
        soldAt: sale.occurredAt,
        sourceName: selectedStaging?.name ?? "Staging reserve",
        saleAmount: convert(saleAmount, sale.currency) ?? 0,
        purchaseAmount: selected.reduce(
          (sum, buy) =>
            sum +
            (convert(Math.abs(Number(buy.grossAmount ?? buy.netAmount ?? 0)), buy.currency) ?? 0),
          0,
        ),
        destinations: [
          ...new Set(selected.map((buy) => buy.instrumentName ?? "Unknown instrument")),
        ],
        matchConfidence,
        differenceRate,
      };
    })
    .filter(
      (item) =>
        item.destinations.length > 0 && item.differenceRate <= policy.transferMatchTolerance * 2,
    )
    .sort((left, right) => right.soldAt.getTime() - left.soldAt.getTime())
    .slice(0, 20);

  const zerodhaTrades = tradeRows.filter((trade) => trade.provider === "zerodha");
  const tradeQuantity = new Map<string, number>();
  for (const trade of zerodhaTrades) {
    if (!trade.instrumentId) continue;
    tradeQuantity.set(
      trade.instrumentId,
      (tradeQuantity.get(trade.instrumentId) ?? 0) + Number(trade.quantity ?? 0),
    );
  }
  const reconciledHoldings = indianHoldings.filter((holding) => {
    const difference = Math.abs(holding.quantity - (tradeQuantity.get(holding.instrumentId) ?? 0));
    return difference <= Math.max(0.000001, Math.abs(holding.quantity) * 0.00000001);
  });
  const totalIndianValue = indianHoldings.reduce((sum, holding) => sum + holding.marketValue, 0);
  const reconciledIndianValue = reconciledHoldings.reduce(
    (sum, holding) => sum + holding.marketValue,
    0,
  );
  const zerodhaCoverage = {
    positions: indianHoldings.length,
    reconciledPositions: reconciledHoldings.length,
    valueCoverage: totalIndianValue > 0 ? reconciledIndianValue / totalIndianValue : 0,
    firstTradeAt: zerodhaTrades[0]?.occurredAt ?? null,
    lastTradeAt: zerodhaTrades.at(-1)?.occurredAt ?? null,
  };
  const degiroTrades = tradeRows.filter((trade) => trade.provider === "degiro");

  const evidence: Array<{
    key: string;
    label: string;
    grade: Confidence;
    value: string;
    detail: string;
  }> = [
    {
      key: "trade-flows",
      label: "Imported trade flows",
      grade: "exact",
      value: `${zerodhaTrades.length + degiroTrades.length} trades`,
      detail: "Purchase and redemption amounts come directly from deduplicated broker exports.",
    },
    {
      key: "zerodha",
      label: "Zerodha holdings",
      grade: "reconciled",
      value: `${zerodhaCoverage.reconciledPositions}/${zerodhaCoverage.positions} positions`,
      detail: `${(zerodhaCoverage.valueCoverage * 100).toFixed(2)}% of latest value reconciles to imported trade units.`,
    },
    {
      key: "degiro",
      label: "Degiro positions",
      grade: "derived",
      value: `${degiroTrades.length} trades`,
      detail:
        "Open quantities and cost basis are reconstructed; market value uses the last imported trade price.",
    },
    {
      key: "fixed-deposits",
      label: "Fixed-deposit schedule",
      grade: "derived",
      value: `${maturities.length} active deposits`,
      detail:
        "Maturity proceeds are formula-derived from stored principal, rate, term and compounding frequency.",
    },
    {
      key: "transfers",
      label: "Staging transfers",
      grade: "inferred",
      value: `${inferredTransfers.length} candidates`,
      detail: `A sale followed by purchases within ${policy.transferMatchWindowDays} days is a candidate, not a confirmed STP.`,
    },
  ];

  const actions: Array<{
    key: string;
    severity: "attention" | "opportunity" | "info";
    title: string;
    description: string;
    amount: number | null;
    bucket: DeploymentBucket | null;
    confidence: Confidence;
  }> = [];
  if (!policy.enabled) {
    actions.push({
      key: "policy-paused",
      severity: "info",
      title: "Deployment policy is paused",
      description:
        "Observed flows and evidence remain visible, but recommendation amounts are disabled.",
      amount: null,
      bucket: null,
      confidence: "exact",
    });
  } else if (!targetsConfigured) {
    actions.push({
      key: "configure-targets",
      severity: "attention",
      title: "Set an allocation policy",
      description:
        "Recommendations remain disabled until target weights and acceptable ranges total 100%.",
      amount: null,
      bucket: null,
      confidence: "derived",
    });
  } else {
    for (const item of allocation.filter((row) => row.status === "below")) {
      actions.push({
        key: `underweight-${item.bucket}`,
        severity: "opportunity",
        title: `${item.label} is below its policy range`,
        description:
          item.nextContribution > 0
            ? "The next planned deployment is directed here without requiring a sale."
            : "Future contributions can close this gap without selling another holding.",
        amount:
          item.nextContribution > 0 ? item.nextContribution : Math.max(item.targetGap ?? 0, 0),
        bucket: item.bucket,
        confidence: "derived",
      });
    }
    for (const item of allocation.filter((row) => row.status === "above")) {
      actions.push({
        key: `overweight-${item.bucket}`,
        severity: "info",
        title: `${item.label} is above its policy range`,
        description:
          "Pause new contributions here while contribution-only rebalancing closes other gaps.",
        amount: null,
        bucket: item.bucket,
        confidence: "derived",
      });
    }
  }
  const dueDeposits = maturities.filter((item) => item.daysUntil <= 30);
  if (dueDeposits.length > 0) {
    actions.push({
      key: "fd-due",
      severity: "attention",
      title: `${dueDeposits.length} fixed deposit${dueDeposits.length === 1 ? "" : "s"} due within 30 days`,
      description:
        "Confirm maturity credit or renewal; active status is never changed automatically.",
      amount: dueDeposits.reduce((sum, item) => sum + (item.baseValue ?? 0), 0),
      bucket: "fixed_income",
      confidence: "derived",
    });
  }
  if (zerodhaCoverage.reconciledPositions < zerodhaCoverage.positions) {
    actions.push({
      key: "zerodha-gap",
      severity: "attention",
      title: "One or more holdings have opening-unit history",
      description:
        "Current value is valid, but return analytics should exclude unreconciled units until earlier tradebooks are imported.",
      amount: null,
      bucket: "indian_equity",
      confidence: "reconciled",
    });
  }

  return {
    preference,
    policy,
    targetsConfigured,
    targetSum,
    stagingCandidates,
    selectedStaging,
    summary: {
      investmentTotal,
      availableCapital,
      stagingAvailable,
      brokerCash,
      bankSurplus,
      scheduledLiquidity,
      monthlyDeploymentBase,
      inferredTransferCount: inferredTransfers.length,
      zerodhaValueCoverage: zerodhaCoverage.valueCoverage,
      zerodhaReconciledPositions: zerodhaCoverage.reconciledPositions,
      zerodhaPositions: zerodhaCoverage.positions,
    },
    allocation,
    flows,
    maturities,
    maturityWindows,
    inferredTransfers,
    evidence,
    actions,
    missingCurrencies: [...missingCurrencies],
    asOf:
      maxDate([
        indianPortfolio?.statementDate,
        globalPortfolio.lastTradeAt,
        ...accounts.map((account) => account.asOf),
        ...degiro.balances.map((balance) => balance.occurredAt),
      ]) ?? null,
  };
}
