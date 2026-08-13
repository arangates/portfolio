export type DatedCashFlow = { date: Date; amount: number };

function xnpv(rate: number, cashFlows: DatedCashFlow[]) {
  const firstDate = cashFlows[0]?.date;
  if (!firstDate) return Number.NaN;
  return cashFlows.reduce((total, cashFlow) => {
    const years = (cashFlow.date.getTime() - firstDate.getTime()) / 31_557_600_000;
    return total + cashFlow.amount / (1 + rate) ** years;
  }, 0);
}

export function calculateXirr(cashFlows: DatedCashFlow[]) {
  const ordered = cashFlows.toSorted((left, right) => left.date.getTime() - right.date.getTime());
  if (
    ordered.length < 2 ||
    !ordered.some((flow) => flow.amount < 0) ||
    !ordered.some((flow) => flow.amount > 0)
  ) {
    return null;
  }

  let low = -0.9999;
  let high = 10;
  let lowValue = xnpv(low, ordered);
  let highValue = xnpv(high, ordered);
  while (Math.sign(lowValue) === Math.sign(highValue) && high < 1_000_000) {
    high *= 10;
    highValue = xnpv(high, ordered);
  }
  if (Math.sign(lowValue) === Math.sign(highValue)) return null;

  for (let iteration = 0; iteration < 200; iteration += 1) {
    const midpoint = (low + high) / 2;
    const value = xnpv(midpoint, ordered);
    if (Math.abs(value) < 1e-7) return midpoint;
    if (Math.sign(value) === Math.sign(lowValue)) {
      low = midpoint;
      lowValue = value;
    } else {
      high = midpoint;
      highValue = value;
    }
  }
  return (low + high) / 2;
}

export function calculateCagr(startValue: number, endValue: number, years: number) {
  if (startValue <= 0 || endValue < 0 || years <= 0) return null;
  return (endValue / startValue) ** (1 / years) - 1;
}
