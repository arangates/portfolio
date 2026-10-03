/**
 * Pure annuity-mortgage maths. Payments are modelled on the 1st of each month.
 * Dates are ISO `YYYY-MM-DD` strings; "month index" = year * 12 + zero-based month.
 */

export type MortgageTerms = {
  originalAmount: number;
  currentBalance: number;
  monthlyPayment: number;
  /** Rate printed on the lender overview, e.g. 0.0415. */
  statedRate: number;
  /** Active payment/sustainability discount, e.g. 0.0025. */
  discount: number;
  /** Date the deed was signed. */
  startDate: string;
  firstPaymentDate: string;
  endDate: string;
  fixedRateEndDate: string;
  asOf: string;
  propertyValue: number;
  valuationDate: string;
  freeRepaymentAllowance: number;
  registrationAmount: number;
};

export type RateBasis = "implied" | "stated" | "net";

export type ExtraRepayment = { date: string; amount: number };

export type MortgageSettingsState = {
  terms: MortgageTerms;
  rateBasis: RateBasis;
  extras: ExtraRepayment[];
  /** Assumed annual property growth as a fraction. */
  appreciation: number;
};

export type ScheduleRow = {
  date: string;
  kind: "past" | "future";
  opening: number;
  payment: number;
  interest: number;
  principal: number;
  extra: number;
  closing: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
  rate: number;
};

export type ProjectionOptions = {
  extraMonthly?: number;
  lumpSum?: number;
  /** New annual rate applied from the end of the fixed-rate period. */
  rateAfterFixed?: number;
};

export type Projection = {
  rows: ScheduleRow[];
  totalInterest: number;
  totalPaid: number;
  payoffDate: string | null;
  months: number;
};

export type Insight = {
  id: string;
  tone: "good" | "warn" | "info";
  title: string;
  text: string;
};

export type ActualPayment = {
  date: string;
  amount: number;
  description?: string;
  account?: string;
  joint?: boolean;
};

export type PaymentComparisonRow = {
  date: string;
  scheduled: number;
  actual: number | null;
  difference: number | null;
  status: "match" | "different" | "extra" | "missing" | "no-data";
};

export const ING_MORTGAGE_OVERVIEW: MortgageTerms = {
  originalAmount: 394_000,
  currentBalance: 368_353.25,
  monthlyPayment: 1_870.47,
  statedRate: 0.0415,
  discount: 0.0025,
  startDate: "2024-04-08",
  firstPaymentDate: "2024-06-01",
  endDate: "2054-05-01",
  fixedRateEndDate: "2034-05-01",
  asOf: "2026-10-03",
  propertyValue: 385_000,
  valuationDate: "2023-08-28",
  freeRepaymentAllowance: 39_400,
  registrationAmount: 469_000,
};

const MAX_MONTHS = 720;

export const monthIndex = (iso: string) => {
  const [year, month] = iso.split("-").map(Number);
  return year! * 12 + (month! - 1);
};
export const monthDate = (index: number) =>
  `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}-01`;

export function annuityPayment(principal: number, annualRate: number, months: number) {
  if (months <= 0) return principal;
  const i = annualRate / 12;
  return i === 0 ? principal / months : (principal * i) / (1 - (1 + i) ** -months);
}

/** Annual rate for which an annuity of `months` payments of `payment` repays `principal`. */
export function impliedAnnualRate(principal: number, payment: number, months: number) {
  if (payment * months <= principal) return 0;
  let low = 0;
  let high = 0.5;
  for (let step = 0; step < 80; step++) {
    const mid = (low + high) / 2;
    if (annuityPayment(principal, mid, months) > payment) high = mid;
    else low = mid;
  }
  return (low + high) / 2;
}

export function contractMonths(terms: MortgageTerms) {
  return monthIndex(terms.endDate) - monthIndex(terms.firstPaymentDate) + 1;
}

export function resolveRate(terms: MortgageTerms, basis: RateBasis) {
  if (basis === "stated") return terms.statedRate;
  if (basis === "net") return Math.max(0, terms.statedRate - terms.discount);
  return impliedAnnualRate(terms.originalAmount, terms.monthlyPayment, contractMonths(terms));
}

/** Month-by-month payments from the first instalment up to the as-of date. */
export function buildHistory(
  terms: MortgageTerms,
  rate: number,
  extras: ExtraRepayment[] = [],
): ScheduleRow[] {
  const first = monthIndex(terms.firstPaymentDate);
  const last = monthIndex(terms.asOf);
  const extraByMonth = new Map<number, number>();
  for (const extra of extras) {
    const key = monthIndex(extra.date);
    extraByMonth.set(key, (extraByMonth.get(key) ?? 0) + extra.amount);
  }
  const rows: ScheduleRow[] = [];
  let balance = terms.originalAmount;
  let cumulativeInterest = 0;
  let cumulativePrincipal = 0;
  for (let index = first; index <= last && balance > 0.005; index++) {
    const interest = balance * (rate / 12);
    const payment = Math.min(terms.monthlyPayment, balance + interest);
    const scheduledPrincipal = payment - interest;
    const extra = Math.min(extraByMonth.get(index) ?? 0, balance - scheduledPrincipal);
    const closing = Math.max(0, balance - scheduledPrincipal - extra);
    cumulativeInterest += interest;
    cumulativePrincipal += scheduledPrincipal + extra;
    rows.push({
      date: monthDate(index),
      kind: "past",
      opening: balance,
      payment,
      interest,
      principal: scheduledPrincipal,
      extra,
      closing,
      cumulativeInterest,
      cumulativePrincipal,
      rate,
    });
    balance = closing;
  }
  return rows;
}

/** Forward schedule from the actual outstanding balance. */
export function projectSchedule(
  terms: MortgageTerms,
  startingBalance: number,
  rate: number,
  options: ProjectionOptions = {},
  carry: { interest: number; principal: number } = { interest: 0, principal: 0 },
): Projection {
  const startIndex = monthIndex(terms.asOf) + 1;
  const endIndex = monthIndex(terms.endDate);
  const fixedEndIndex = monthIndex(terms.fixedRateEndDate);
  let balance = Math.max(0, startingBalance - (options.lumpSum ?? 0));
  let activeRate = rate;
  let payment = terms.monthlyPayment;
  let cumulativeInterest = carry.interest;
  let cumulativePrincipal = carry.principal + (options.lumpSum ?? 0);
  const rows: ScheduleRow[] = [];
  let totalInterest = 0;
  let totalPaid = options.lumpSum ?? 0;
  for (let index = startIndex; balance > 0.005 && index < startIndex + MAX_MONTHS; index++) {
    if (options.rateAfterFixed !== undefined && index === fixedEndIndex) {
      activeRate = options.rateAfterFixed;
      payment = annuityPayment(balance, activeRate, Math.max(1, endIndex - index + 1));
    }
    const interest = balance * (activeRate / 12);
    const due = Math.min(payment, balance + interest);
    const scheduledPrincipal = due - interest;
    const extra = Math.min(options.extraMonthly ?? 0, Math.max(0, balance - scheduledPrincipal));
    const closing = Math.max(0, balance - scheduledPrincipal - extra);
    cumulativeInterest += interest;
    cumulativePrincipal += scheduledPrincipal + extra;
    totalInterest += interest;
    totalPaid += due + extra;
    rows.push({
      date: monthDate(index),
      kind: "future",
      opening: balance,
      payment: due,
      interest,
      principal: scheduledPrincipal,
      extra,
      closing,
      cumulativeInterest,
      cumulativePrincipal,
      rate: activeRate,
    });
    balance = closing;
  }
  return {
    rows,
    totalInterest,
    totalPaid,
    payoffDate: balance <= 0.005 && rows.length > 0 ? rows.at(-1)!.date : null,
    months: rows.length,
  };
}

export function rateSensitivity(
  terms: MortgageTerms,
  balanceAtFixedEnd: number,
  currentRate: number,
  deltas = [-0.01, -0.005, 0, 0.005, 0.01, 0.02, 0.03],
) {
  const months = Math.max(1, monthIndex(terms.endDate) - monthIndex(terms.fixedRateEndDate) + 1);
  return deltas.map((delta) => {
    const rate = Math.max(0, currentRate + delta);
    const payment = annuityPayment(balanceAtFixedEnd, rate, months);
    return {
      delta,
      rate,
      payment,
      change: payment - terms.monthlyPayment,
      remainingInterest: payment * months - balanceAtFixedEnd,
    };
  });
}

/** Match bank debits to scheduled months. Debits booked in the last days of a month belong to the next. */
export function comparePayments(
  history: ScheduleRow[],
  actual: ActualPayment[],
  coverageStart: string | null,
  coverageEnd: string | null = null,
): PaymentComparisonRow[] {
  const byMonth = new Map<number, number>();
  for (const payment of actual) {
    const shifted = new Date(`${payment.date}T12:00:00Z`);
    shifted.setUTCDate(shifted.getUTCDate() + 7);
    const key = shifted.getUTCFullYear() * 12 + shifted.getUTCMonth();
    byMonth.set(key, (byMonth.get(key) ?? 0) + Math.abs(payment.amount));
  }
  const coverageIndex = coverageStart ? monthIndex(coverageStart) : null;
  // A statement ending on the 1st does not yet show that month's instalment.
  const coverageEndIndex = coverageEnd
    ? monthIndex(coverageEnd) - (Number(coverageEnd.slice(8, 10)) < 2 ? 1 : 0)
    : null;
  return history.map((row) => {
    const index = monthIndex(row.date);
    const paid = byMonth.get(index) ?? null;
    if (paid === null) {
      const covered =
        coverageIndex !== null &&
        index >= coverageIndex + 1 &&
        (coverageEndIndex === null || index <= coverageEndIndex);
      return {
        date: row.date,
        scheduled: row.payment,
        actual: null,
        difference: null,
        status: covered ? "missing" : "no-data",
      };
    }
    const difference = paid - row.payment;
    const status =
      Math.abs(difference) <= Math.max(0.5, row.payment * 0.005)
        ? "match"
        : difference > row.payment * 0.5
          ? "extra"
          : "different";
    return { date: row.date, scheduled: row.payment, actual: paid, difference, status };
  });
}

const eur = (value: number) =>
  new Intl.NumberFormat("en", { style: "currency", currency: "EUR" }).format(value);
const monthLabel = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T12:00:00Z`),
  );
const pct = (value: number, digits = 1) => `${(value * 100).toFixed(digits)}%`;

export type MortgageModelInput = {
  terms: MortgageTerms;
  rateBasis?: RateBasis;
  extras?: ExtraRepayment[];
};

export function buildMortgageModel({
  terms,
  rateBasis = "implied",
  extras = [],
}: MortgageModelInput) {
  const rate = resolveRate(terms, rateBasis);
  const history = buildHistory(terms, rate, extras);
  const last = history.at(-1);
  const modelledBalance = last?.closing ?? terms.originalAmount;
  const balanceGap = modelledBalance - terms.currentBalance;
  const carry = {
    interest: last?.cumulativeInterest ?? 0,
    principal: terms.originalAmount - terms.currentBalance,
  };
  const baseline = projectSchedule(terms, terms.currentBalance, rate, {}, carry);
  const timeline = [...history, ...baseline.rows];

  const interestPaid = last?.cumulativeInterest ?? 0;
  const paymentsMade = history.reduce((sum, row) => sum + row.payment + row.extra, 0);
  const repaid = terms.originalAmount - terms.currentBalance;
  const contractEnd = monthIndex(terms.endDate);
  const asOfIndex = monthIndex(terms.asOf);
  const payoffIndex = baseline.payoffDate ? monthIndex(baseline.payoffDate) : contractEnd;
  const currentInterest = terms.currentBalance * (rate / 12);
  const crossover = timeline.find((row) => row.principal + row.extra >= row.interest);
  const fixedIndex = monthIndex(terms.fixedRateEndDate);
  const balanceAtFixedEnd =
    baseline.rows.find((row) => monthIndex(row.date) === fixedIndex - 1)?.closing ??
    terms.currentBalance;
  const ltv = terms.propertyValue > 0 ? terms.currentBalance / terms.propertyValue : 0;
  const originalLtv = terms.propertyValue > 0 ? terms.originalAmount / terms.propertyValue : 0;
  const sensitivity = rateSensitivity(terms, balanceAtFixedEnd, rate);

  const yearly = new Map<
    number,
    {
      year: number;
      interest: number;
      principal: number;
      payments: number;
      closing: number;
      projected: boolean;
    }
  >();
  for (const row of timeline) {
    const year = Number(row.date.slice(0, 4));
    const entry = yearly.get(year) ?? {
      year,
      interest: 0,
      principal: 0,
      payments: 0,
      closing: 0,
      projected: false,
    };
    entry.interest += row.interest;
    entry.principal += row.principal + row.extra;
    entry.payments += row.payment + row.extra;
    entry.closing = row.closing;
    entry.projected ||= row.kind === "future";
    yearly.set(year, entry);
  }

  const summary = {
    rate,
    termMonths: contractMonths(terms),
    paymentsMade: history.length,
    paymentsRemaining: baseline.months,
    modelledBalance,
    balanceGap,
    repaid,
    repaidShare: terms.originalAmount > 0 ? repaid / terms.originalAmount : 0,
    paidToDate: paymentsMade,
    interestPaid,
    principalPaid: repaid,
    remainingInterest: baseline.totalInterest,
    lifetimeInterest: interestPaid + baseline.totalInterest,
    remainingPayments: baseline.totalPaid,
    payoffDate: baseline.payoffDate,
    monthsAheadOfContract: Math.max(0, contractEnd - payoffIndex),
    currentInterest,
    currentPrincipal: terms.monthlyPayment - currentInterest,
    interestShare: terms.monthlyPayment > 0 ? currentInterest / terms.monthlyPayment : 0,
    crossoverDate: crossover?.date ?? null,
    ltv,
    originalLtv,
    equity: terms.propertyValue - terms.currentBalance,
    balanceAtFixedEnd,
    monthsToFixedEnd: Math.max(0, fixedIndex - asOfIndex),
    shareRepaidAtFixedEnd:
      terms.originalAmount > 0 ? 1 - balanceAtFixedEnd / terms.originalAmount : 0,
    netRate: Math.max(0, terms.statedRate - terms.discount),
    impliedRate: impliedAnnualRate(
      terms.originalAmount,
      terms.monthlyPayment,
      contractMonths(terms),
    ),
    freeAllowanceShare:
      terms.originalAmount > 0 ? terms.freeRepaymentAllowance / terms.originalAmount : 0,
  };

  const insights: Insight[] = [];
  insights.push({
    id: "progress",
    tone: "info",
    title: `${pct(summary.repaidShare)} of the loan is repaid`,
    text: `${eur(repaid)} of ${eur(terms.originalAmount)} has been repaid after ${history.length} monthly instalments. ${eur(terms.currentBalance)} remains.`,
  });
  insights.push({
    id: "interest-split",
    tone: summary.interestShare > 0.7 ? "warn" : "info",
    title: `${pct(summary.interestShare, 0)} of this month's payment is interest`,
    text: `Of ${eur(terms.monthlyPayment)}, about ${eur(currentInterest)} is interest and ${eur(summary.currentPrincipal)} reduces the debt.${crossover ? ` Principal overtakes interest from ${monthLabel(crossover.date)}.` : ""}`,
  });
  if (balanceGap > 250) {
    insights.push({
      id: "ahead-of-schedule",
      tone: "good",
      title: `${eur(balanceGap)} ahead of the modelled schedule`,
      text: `A plain annuity at ${pct(rate, 2)} would leave ${eur(modelledBalance)} today, but the lender reports ${eur(terms.currentBalance)}. The gap suggests extra repayments, a lower earlier rate or interest corrections — add known extra repayments to reconcile.`,
    });
  } else if (balanceGap < -250) {
    insights.push({
      id: "behind-schedule",
      tone: "warn",
      title: `${eur(-balanceGap)} behind the modelled schedule`,
      text: `The reported balance is higher than a plain annuity at ${pct(rate, 2)} predicts. Check the rate basis or confirm that no payments were skipped.`,
    });
  } else {
    insights.push({
      id: "on-schedule",
      tone: "good",
      title: "Balance matches the modelled schedule",
      text: `The reported balance is within ${eur(250)} of a standard annuity at ${pct(rate, 2)}.`,
    });
  }
  insights.push({
    id: "lifetime-interest",
    tone: "info",
    title: `${eur(summary.lifetimeInterest)} total interest over the life of the loan`,
    text: `${eur(interestPaid)} already paid and ${eur(baseline.totalInterest)} still to come — ${pct(summary.lifetimeInterest / terms.originalAmount, 0)} of the amount borrowed.`,
  });
  if (summary.monthsToFixedEnd > 0) {
    const worst = sensitivity.find((item) => item.delta === 0.02);
    insights.push({
      id: "fixed-rate",
      tone: "warn",
      title: `Rate reset in ${Math.floor(summary.monthsToFixedEnd / 12)}y ${summary.monthsToFixedEnd % 12}m`,
      text: `On ${monthLabel(terms.fixedRateEndDate)} the fixed period ends with about ${eur(balanceAtFixedEnd)} outstanding (${pct(summary.shareRepaidAtFixedEnd, 0)} repaid).${worst ? ` At ${pct(worst.rate, 2)} the payment would become ${eur(worst.payment)} (${worst.change >= 0 ? "+" : ""}${eur(worst.change)}).` : ""}`,
    });
  }
  const valuationAge = (asOfIndex - monthIndex(terms.valuationDate)) / 12;
  insights.push({
    id: "ltv",
    tone: valuationAge > 2 ? "warn" : "info",
    title: `Loan-to-value is ${pct(ltv, 1)}`,
    text: `${eur(terms.currentBalance)} against a property valued at ${eur(terms.propertyValue)}${valuationAge > 2 ? ` — that valuation is ${valuationAge.toFixed(1)} years old, so real equity is likely different` : ""}. Equity on paper: ${eur(summary.equity)}.`,
  });
  if (rate < terms.statedRate) {
    insights.push({
      id: "discount",
      tone: "info",
      title: `Discounts of ${pct(terms.discount, 2)} are active`,
      text: `Stated rate ${pct(terms.statedRate, 2)}, net ${pct(summary.netRate, 2)}. The rate implied by your payment is ${pct(summary.impliedRate, 2)}.`,
    });
  }
  insights.push({
    id: "free-repayment",
    tone: "good",
    title: `${eur(terms.freeRepaymentAllowance)} can be repaid without penalty`,
    text: `That is ${pct(summary.freeAllowanceShare, 0)} of the original loan. Use the simulator to see what a lump sum would save.`,
  });

  return {
    terms,
    rateBasis,
    rate,
    history,
    baseline,
    timeline,
    summary,
    sensitivity,
    yearly: [...yearly.values()],
    insights,
  };
}

export type MortgageModel = ReturnType<typeof buildMortgageModel>;

/** Compare a what-if against the baseline using the same starting balance. */
export function simulateScenario(model: MortgageModel, options: ProjectionOptions) {
  const { terms, rate, baseline, summary } = model;
  const carry = {
    interest: model.history.at(-1)?.cumulativeInterest ?? 0,
    principal: terms.originalAmount - terms.currentBalance,
  };
  const scenario = projectSchedule(terms, terms.currentBalance, rate, options, carry);
  const baselineEnd = baseline.rows.length;
  return {
    scenario,
    interestSaved: baseline.totalInterest - scenario.totalInterest,
    monthsSaved: baselineEnd - scenario.months,
    payoffDate: scenario.payoffDate,
    totalPaid: scenario.totalPaid,
    extraOutlay: (options.lumpSum ?? 0) + (options.extraMonthly ?? 0) * scenario.months,
    withinFreeAllowance: (options.lumpSum ?? 0) <= terms.freeRepaymentAllowance,
    baselineInterest: baseline.totalInterest,
    baselineMonths: baselineEnd,
    lifetimeInterest: summary.interestPaid + scenario.totalInterest,
  };
}
