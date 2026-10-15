export type DegiroRawTrade = {
  orderId?: string | null;
  occurredAt: Date;
  isin: string;
  name: string;
  category?: string;
  quantity: number;
  price: number;
  grossAmount: number;
  fees: number;
  netAmount: number;
  venue?: string;
};

export type ConsolidatedTrade = {
  orderId: string;
  occurredAt: Date;
  isin: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  grossAmount: number;
  fees: number;
  netAmount: number;
  entryType: "buy" | "sell";
};

export type GlobalEquityPosition = {
  instrumentId?: string;
  name: string;
  isin: string;
  category: string;
  quantity: number;
  costBasis: number;
  averagePrice: number;
  latestPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  realizedPnl: number;
  lastTradeAt: Date;
};

export type MonthlyEquityHistory = {
  date: string;
  month: string;
  investedValue: number;
  marketValue: number;
  unrealizedPnl: number;
};

export type GlobalEquityPortfolioResult = {
  holdings: GlobalEquityPosition[];
  history: MonthlyEquityHistory[];
  realizedPnl: number;
  lastTradeAt: Date | null;
};

/**
 * Consolidates partial fills sharing the same Degiro Order ID.
 * Degiro may export orders across venues as separate rows (e.g. MESI and XAMS)
 * or as a single rolled-up execution. Consolidating by Order ID guarantees
 * consistent, idempotent representation.
 */
export function consolidateDegiroTrades(trades: DegiroRawTrade[]): ConsolidatedTrade[] {
  const byOrder = new Map<string, DegiroRawTrade[]>();
  let fallbackCounter = 0;

  for (const trade of trades) {
    if (!Number.isFinite(trade.quantity) || trade.quantity === 0) continue;
    const key =
      trade.orderId && trade.orderId.trim()
        ? trade.orderId.trim()
        : `fallback_${trade.isin}_${trade.occurredAt.getTime()}_${++fallbackCounter}`;
    const list = byOrder.get(key) ?? [];
    list.push(trade);
    byOrder.set(key, list);
  }

  const consolidated: ConsolidatedTrade[] = [];
  for (const [orderId, fills] of byOrder.entries()) {
    const first = fills[0]!;
    let totalQuantity = 0;
    let totalGrossAmount = 0;
    let totalFees = 0;
    let totalNetAmount = 0;

    for (const fill of fills) {
      totalQuantity += fill.quantity;
      totalGrossAmount += Math.abs(fill.grossAmount);
      totalFees += fill.fees;
      totalNetAmount += fill.netAmount;
    }

    if (Math.abs(totalQuantity) < 0.00000001) continue;

    const price =
      totalGrossAmount > 0 && Math.abs(totalQuantity) > 0
        ? totalGrossAmount / Math.abs(totalQuantity)
        : Math.abs(first.price);

    consolidated.push({
      orderId,
      occurredAt: first.occurredAt,
      isin: first.isin,
      name: first.name,
      category: first.category ?? "Global equity",
      quantity: totalQuantity,
      price,
      grossAmount: totalGrossAmount,
      fees: totalFees,
      netAmount: totalNetAmount,
      entryType: totalQuantity < 0 ? "sell" : "buy",
    });
  }

  // Sort chronologically (oldest first). If same second, buys before sells.
  return consolidated.sort((left, right) => {
    const timeDiff = left.occurredAt.getTime() - right.occurredAt.getTime();
    if (timeDiff !== 0) return timeDiff;
    return right.quantity - left.quantity;
  });
}

/**
 * Calculates global equity holdings, BEP cost basis, and realized P&L
 * according to Degiro's exact moving-average formula.
 */
export function calculateGlobalEquityPortfolio(
  trades: Array<{
    instrumentId?: string;
    name: string;
    isin: string;
    category?: string;
    occurredAt: Date;
    quantity: number;
    price: number;
    grossAmount: number;
    fees?: number;
    netAmount?: number;
  }>,
): GlobalEquityPortfolioResult {
  // Sort trades chronologically, buys before sells at same timestamp
  const sorted = [...trades].sort((left, right) => {
    const timeDiff = left.occurredAt.getTime() - right.occurredAt.getTime();
    if (timeDiff !== 0) return timeDiff;
    return right.quantity - left.quantity;
  });

  type PositionState = {
    instrumentId?: string;
    name: string;
    isin: string;
    category: string;
    quantity: number;
    costBasis: number;
    latestPrice: number;
    realizedPnl: number;
    lastTradeAt: Date;
  };

  const positions = new Map<string, PositionState>();
  const historyByMonth = new Map<string, MonthlyEquityHistory>();

  for (const trade of sorted) {
    const quantity = Number(trade.quantity ?? 0);
    if (!Number.isFinite(quantity) || quantity === 0) continue;

    const gross = Math.abs(Number(trade.grossAmount ?? 0));
    const effectivePrice =
      gross > 0 ? gross / Math.abs(quantity) : Math.abs(Number(trade.price ?? 0));
    const key = trade.isin;

    const current = positions.get(key) ?? {
      instrumentId: trade.instrumentId,
      name: trade.name,
      isin: trade.isin,
      category: trade.category ?? "Global equity",
      quantity: 0,
      costBasis: 0,
      latestPrice: effectivePrice,
      realizedPnl: 0,
      lastTradeAt: trade.occurredAt,
    };

    if (quantity > 0) {
      // Degiro BEP (Break-Even Price) is strictly based on the gross purchase amount
      current.quantity += quantity;
      current.costBasis += gross;
    } else {
      const soldQuantity = Math.min(Math.abs(quantity), Math.max(current.quantity, 0));
      const averageCost = current.quantity > 0 ? current.costBasis / current.quantity : 0;
      const proceeds = gross;
      current.realizedPnl += proceeds - averageCost * soldQuantity;
      current.quantity += quantity;
      current.costBasis = Math.max(current.costBasis - averageCost * soldQuantity, 0);

      // Reset when position is fully closed to prevent floating-point dust
      if (Math.abs(current.quantity) < 0.00000001) {
        current.quantity = 0;
        current.costBasis = 0;
      }
    }

    current.latestPrice = effectivePrice;
    current.lastTradeAt = trade.occurredAt;
    if (trade.instrumentId && !current.instrumentId) {
      current.instrumentId = trade.instrumentId;
    }
    positions.set(key, current);

    const monthKey = trade.occurredAt.toISOString().slice(0, 7);
    const date = trade.occurredAt.toISOString().slice(0, 10);
    const investedValue = [...positions.values()].reduce(
      (sum, position) => sum + Math.max(position.costBasis, 0),
      0,
    );
    const marketValue = [...positions.values()].reduce(
      (sum, position) => sum + Math.max(position.quantity, 0) * position.latestPrice,
      0,
    );

    historyByMonth.set(monthKey, {
      date,
      month: monthKey,
      investedValue: Math.round(investedValue),
      marketValue: Math.round(marketValue),
      unrealizedPnl: Math.round(marketValue - investedValue),
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
    lastTradeAt: sorted.at(-1)?.occurredAt ?? null,
  };
}
