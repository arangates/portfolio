export type DatedCashFlow = {
  date: Date | string | number;
  amount: number;
};

export type XirrResult = {
  status: "ok" | "invalid" | "no_root" | "ambiguous";
  rate: number | null;
  roots: number[];
};

const DAYS_PER_YEAR = 365.2425;
const MILLIS_PER_DAY = 86_400_000;

function dateValue(value: Date | string | number) {
  const parsed = value instanceof Date ? value : new Date(value);
  return parsed.getTime();
}

function normalizedFlows(flows: DatedCashFlow[]) {
  const byDate = new Map<number, number>();
  for (const flow of flows) {
    const date = dateValue(flow.date);
    if (!Number.isFinite(date) || !Number.isFinite(flow.amount)) continue;
    byDate.set(date, (byDate.get(date) ?? 0) + flow.amount);
  }
  return [...byDate.entries()]
    .filter(([, amount]) => Math.abs(amount) > 0.00000001)
    .map(([date, amount]) => ({ date, amount }))
    .sort((left, right) => left.date - right.date);
}

export function xnpv(rate: number, flows: DatedCashFlow[]) {
  if (!Number.isFinite(rate) || rate <= -1) return Number.NaN;
  const normalized = normalizedFlows(flows);
  const firstDate = normalized[0]?.date;
  if (firstDate === undefined) return Number.NaN;

  return normalized.reduce((sum, flow) => {
    const years = (flow.date - firstDate) / MILLIS_PER_DAY / DAYS_PER_YEAR;
    return sum + flow.amount / (1 + rate) ** years;
  }, 0);
}

function bisectRoot(flows: DatedCashFlow[], lowerX: number, upperX: number) {
  let left = lowerX;
  let right = upperX;
  let leftValue = xnpv(Math.exp(left) - 1, flows);

  for (let iteration = 0; iteration < 120; iteration += 1) {
    const middle = (left + right) / 2;
    const middleValue = xnpv(Math.exp(middle) - 1, flows);
    if (!Number.isFinite(middleValue)) return null;
    if (Math.abs(middleValue) < 0.0000001) return Math.exp(middle) - 1;
    if (Math.sign(leftValue) === Math.sign(middleValue)) {
      left = middle;
      leftValue = middleValue;
    } else {
      right = middle;
    }
  }

  return Math.exp((left + right) / 2) - 1;
}

/**
 * Solves XIRR without assuming a single Newton starting point. Multiple roots are
 * reported as ambiguous rather than silently selecting a financially misleading result.
 */
export function calculateXirr(flows: DatedCashFlow[]): XirrResult {
  const normalized = normalizedFlows(flows);
  const hasNegative = normalized.some((flow) => flow.amount < 0);
  const hasPositive = normalized.some((flow) => flow.amount > 0);
  const firstDate = normalized[0]?.date;
  const lastDate = normalized.at(-1)?.date;
  if (
    !hasNegative ||
    !hasPositive ||
    firstDate === undefined ||
    lastDate === undefined ||
    lastDate - firstDate < MILLIS_PER_DAY
  ) {
    return { status: "invalid", rate: null, roots: [] };
  }

  const minimumX = Math.log(0.0001);
  const maximumX = Math.log(1001);
  const samples = 800;
  const roots: number[] = [];
  let previousX = minimumX;
  let previousValue = xnpv(Math.exp(previousX) - 1, normalized);

  for (let index = 1; index <= samples; index += 1) {
    const currentX = minimumX + ((maximumX - minimumX) * index) / samples;
    const currentValue = xnpv(Math.exp(currentX) - 1, normalized);
    if (Number.isFinite(previousValue) && Number.isFinite(currentValue)) {
      if (Math.abs(currentValue) < 0.0000001) roots.push(Math.exp(currentX) - 1);
      if (Math.sign(previousValue) !== Math.sign(currentValue)) {
        const root = bisectRoot(normalized, previousX, currentX);
        if (root !== null) roots.push(root);
      }
    }
    previousX = currentX;
    previousValue = currentValue;
  }

  const distinctRoots = roots
    .sort((left, right) => left - right)
    .filter((root, index, values) => index === 0 || Math.abs(root - values[index - 1]!) > 0.000001);
  if (distinctRoots.length === 0) return { status: "no_root", rate: null, roots: [] };
  if (distinctRoots.length > 1) {
    return { status: "ambiguous", rate: null, roots: distinctRoots };
  }
  return { status: "ok", rate: distinctRoots[0]!, roots: distinctRoots };
}

export function calculateAverageCostPosition(
  trades: Array<{ quantity: number; cashAmount: number }>,
) {
  let quantity = 0;
  let costBasis = 0;
  let realizedPnl = 0;
  let complete = true;
  let purchases = 0;
  let sales = 0;

  for (const trade of trades) {
    if (!Number.isFinite(trade.quantity) || !Number.isFinite(trade.cashAmount)) continue;
    if (trade.quantity > 0) {
      const cost = Math.abs(trade.cashAmount);
      quantity += trade.quantity;
      costBasis += cost;
      purchases += cost;
      continue;
    }
    if (trade.quantity >= 0) continue;

    const soldQuantity = Math.abs(trade.quantity);
    const proceeds = Math.abs(trade.cashAmount);
    sales += proceeds;
    if (soldQuantity > quantity + 0.00000001) {
      complete = false;
      continue;
    }
    const averageCost = quantity > 0 ? costBasis / quantity : 0;
    realizedPnl += proceeds - averageCost * soldQuantity;
    quantity -= soldQuantity;
    costBasis = Math.max(costBasis - averageCost * soldQuantity, 0);
    if (Math.abs(quantity) < 0.00000001) quantity = 0;
  }

  return { quantity, costBasis, realizedPnl, complete, purchases, sales };
}

export function calculateModifiedDietz(input: {
  startDate: Date | string;
  endDate: Date | string;
  startValue: number;
  endValue: number;
  flows: DatedCashFlow[];
}) {
  const start = dateValue(input.startDate);
  const end = dateValue(input.endDate);
  const duration = end - start;
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    duration <= 0 ||
    !Number.isFinite(input.startValue) ||
    !Number.isFinite(input.endValue)
  ) {
    return null;
  }

  let netFlow = 0;
  let weightedFlow = 0;
  for (const flow of normalizedFlows(input.flows)) {
    if (flow.date <= start || flow.date > end) continue;
    const weight = (end - flow.date) / duration;
    netFlow += flow.amount;
    weightedFlow += weight * flow.amount;
  }
  const denominator = input.startValue + weightedFlow;
  if (denominator <= 0) return null;
  return (input.endValue - input.startValue - netFlow) / denominator;
}

export function chainReturns(returns: number[]) {
  if (returns.length === 0 || returns.some((value) => !Number.isFinite(value) || value <= -1)) {
    return null;
  }
  return returns.reduce((growth, value) => growth * (1 + value), 1) - 1;
}

export function annualizeReturn(
  totalReturn: number,
  startDate: Date | string,
  endDate: Date | string,
) {
  const years = (dateValue(endDate) - dateValue(startDate)) / MILLIS_PER_DAY / DAYS_PER_YEAR;
  if (!Number.isFinite(totalReturn) || totalReturn <= -1 || years <= 0) return null;
  return (1 + totalReturn) ** (1 / years) - 1;
}
