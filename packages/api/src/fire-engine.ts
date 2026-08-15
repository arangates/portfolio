export type FireProfileModel = {
  birthDate: string | null;
  plannedRetirementYear: number;
  planEndAge: number;
  inflationRate: number;
  expectedReturnRate: number;
  returnVolatility: number;
  safeWithdrawalRate: number;
  safetyBuffer: number;
  annualSavings: number;
  targetLegacy: number;
  spendingPolicy: "fixed_real" | "essential_floor";
};

export type FireExpenseModel = {
  id: string;
  name: string;
  category: string;
  monthlyAmount: number;
  essential: boolean;
  startYear: number | null;
  endYear: number | null;
  inflationRateOverride: number | null;
};

export type FireOneTimeCostModel = {
  id: string;
  name: string;
  amount: number;
  plannedYear: number;
  priority: string;
  inflationLinked: boolean;
};

export type FireIncomeModel = {
  id: string;
  name: string;
  annualAmount: number;
  startYear: number;
  endYear: number | null;
  inflationLinked: boolean;
};

export type FireScenarioModel = {
  id: string;
  name: string;
  spendingMultiplier: number;
  bufferRate: number;
  returnRateOverride: number | null;
  inflationRateOverride: number | null;
  retirementYearOverride: number | null;
};

export type FireProjectionRow = {
  year: number;
  age: number | null;
  phase: "accumulation" | "retirement";
  openingBalance: number;
  contributions: number;
  investmentReturn: number;
  expenses: number;
  essentialExpenses: number;
  flexibleExpenses: number;
  income: number;
  oneTimeCosts: number;
  closingBalance: number;
};

export type FireMonteCarloPoint = {
  year: number;
  p10: number;
  median: number;
  p90: number;
};

export type FireScenarioResult = {
  id: string;
  name: string;
  retirementYear: number;
  annualExpensesAtRetirement: number;
  annualEssentialAtRetirement: number;
  requiredCorpus: number;
  withdrawalRate: number;
  progress: number;
  gap: number;
  coastNumberToday: number;
  yearsToTarget: number | null;
  successProbability: number;
  deterministic: FireProjectionRow[];
  monteCarlo: FireMonteCarloPoint[];
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function birthYear(date: string | null) {
  if (!date) return null;
  const year = Number(date.slice(0, 4));
  return Number.isInteger(year) ? year : null;
}

function activeInYear(item: { startYear: number | null; endYear: number | null }, year: number) {
  return (
    (item.startYear === null || year >= item.startYear) &&
    (item.endYear === null || year <= item.endYear)
  );
}

function inflationFactor(rate: number, currentYear: number, year: number) {
  return (1 + rate) ** Math.max(0, year - currentYear);
}

function expensesForYear(
  expenses: FireExpenseModel[],
  year: number,
  currentYear: number,
  inflationRate: number,
  multiplier: number,
  generalInflationFactor?: number,
) {
  let essential = 0;
  let flexible = 0;
  for (const expense of expenses) {
    if (!activeInYear(expense, year)) continue;
    const factor =
      expense.inflationRateOverride === null
        ? (generalInflationFactor ?? inflationFactor(inflationRate, currentYear, year))
        : inflationFactor(expense.inflationRateOverride, currentYear, year);
    const amount = expense.monthlyAmount * 12 * factor * multiplier;
    if (expense.essential) essential += amount;
    else flexible += amount;
  }
  return { essential, flexible, total: essential + flexible };
}

function incomeForYear(
  incomeStreams: FireIncomeModel[],
  year: number,
  currentYear: number,
  inflationRate: number,
  generalInflationFactor?: number,
) {
  return incomeStreams.reduce((total, income) => {
    if (year < income.startYear || (income.endYear !== null && year > income.endYear)) return total;
    const factor = income.inflationLinked
      ? (generalInflationFactor ?? inflationFactor(inflationRate, currentYear, year))
      : 1;
    return total + income.annualAmount * factor;
  }, 0);
}

function oneTimeCostsForYear(
  costs: FireOneTimeCostModel[],
  year: number,
  currentYear: number,
  inflationRate: number,
  generalInflationFactor?: number,
  bufferMultiplier = 1,
) {
  return costs.reduce((total, cost) => {
    if (cost.plannedYear !== year) return total;
    return (
      total +
      cost.amount *
        (cost.inflationLinked
          ? (generalInflationFactor ?? inflationFactor(inflationRate, currentYear, year))
          : 1) *
        bufferMultiplier
    );
  }, 0);
}

function endYearFor(profile: FireProfileModel) {
  const year = birthYear(profile.birthDate);
  return Math.max(
    profile.plannedRetirementYear,
    year ? year + profile.planEndAge : profile.plannedRetirementYear + 60,
  );
}

type ProjectionInput = {
  currentYear: number;
  valuationYear?: number;
  startingBalance: number;
  profile: FireProfileModel;
  expenses: FireExpenseModel[];
  oneTimeCosts: FireOneTimeCostModel[];
  incomeStreams: FireIncomeModel[];
  scenario: FireScenarioModel;
  returnForYear?: (year: number, index: number, balance: number) => number;
  inflationForYear?: (year: number, index: number) => number;
};

function project(input: ProjectionInput) {
  const retirementYear =
    input.scenario.retirementYearOverride ?? input.profile.plannedRetirementYear;
  const defaultReturn = input.scenario.returnRateOverride ?? input.profile.expectedReturnRate;
  const defaultInflation = input.scenario.inflationRateOverride ?? input.profile.inflationRate;
  const expenseMultiplier = input.scenario.spendingMultiplier * (1 + input.scenario.bufferRate);
  const birth = birthYear(input.profile.birthDate);
  const endYear = endYearFor(input.profile);
  const valuationYear = input.valuationYear ?? input.currentYear;
  const rows: FireProjectionRow[] = [];
  let balance = input.startingBalance;
  let cumulativeInflation = inflationFactor(defaultInflation, valuationYear, input.currentYear);

  for (let year = input.currentYear, index = 0; year <= endYear; year += 1, index += 1) {
    const phase = year < retirementYear ? "accumulation" : "retirement";
    const openingBalance = balance;
    const returnRate = clamp(
      input.returnForYear?.(year, index, balance) ?? defaultReturn,
      -0.85,
      1.5,
    );
    const inflationRate = clamp(
      input.inflationForYear?.(year, index) ?? defaultInflation,
      -0.02,
      0.2,
    );
    if (index > 0) cumulativeInflation *= 1 + inflationRate;

    const rawExpenses = expensesForYear(
      input.expenses,
      year,
      valuationYear,
      defaultInflation,
      expenseMultiplier,
      cumulativeInflation,
    );
    let flexibleExpenses = rawExpenses.flexible;
    if (
      phase === "retirement" &&
      input.profile.spendingPolicy === "essential_floor" &&
      balance > 0 &&
      rawExpenses.total / balance > input.profile.safeWithdrawalRate * 1.2
    ) {
      flexibleExpenses *= 0.8;
    }
    const essentialExpenses = phase === "retirement" ? rawExpenses.essential : 0;
    flexibleExpenses = phase === "retirement" ? flexibleExpenses : 0;
    const annualExpenses = essentialExpenses + flexibleExpenses;
    const income =
      phase === "retirement"
        ? incomeForYear(
            input.incomeStreams,
            year,
            valuationYear,
            defaultInflation,
            cumulativeInflation,
          )
        : 0;
    const oneTimeCosts = oneTimeCostsForYear(
      input.oneTimeCosts,
      year,
      valuationYear,
      defaultInflation,
      cumulativeInflation,
      1 + input.scenario.bufferRate,
    );
    const contributions = phase === "accumulation" ? input.profile.annualSavings : 0;
    const investmentReturn = Math.max(0, openingBalance) * returnRate;
    balance = Math.max(
      0,
      openingBalance + investmentReturn + contributions + income - annualExpenses - oneTimeCosts,
    );
    rows.push({
      year,
      age: birth === null ? null : year - birth,
      phase,
      openingBalance,
      contributions,
      investmentReturn,
      expenses: annualExpenses,
      essentialExpenses,
      flexibleExpenses,
      income,
      oneTimeCosts,
      closingBalance: balance,
    });
  }
  return rows;
}

function requiredCorpus(input: Omit<ProjectionInput, "startingBalance">) {
  const retirementYear =
    input.scenario.retirementYearOverride ?? input.profile.plannedRetirementYear;
  const retirementInput = {
    ...input,
    currentYear: retirementYear,
    valuationYear: input.currentYear,
  };
  const succeeds = (balance: number) => {
    const rows = project({ ...retirementInput, startingBalance: balance });
    return (
      rows.every(
        (row) => row.closingBalance > 0 || row.expenses + row.oneTimeCosts <= row.income,
      ) && (rows.at(-1)?.closingBalance ?? 0) >= input.profile.targetLegacy
    );
  };
  let high = 1;
  while (!succeeds(high) && high < 1e16) high *= 2;
  let low = 0;
  for (let iteration = 0; iteration < 80; iteration += 1) {
    const midpoint = (low + high) / 2;
    if (succeeds(midpoint)) high = midpoint;
    else low = midpoint;
  }
  return high;
}

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function normal(random: () => number) {
  const u1 = Math.max(random(), Number.EPSILON);
  const u2 = random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function percentile(values: number[], fraction: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * fraction))] ?? 0;
}

function monteCarlo(input: ProjectionInput, runs = 1000) {
  const balancesByYear = new Map<number, number[]>();
  let successes = 0;
  for (let run = 0; run < runs; run += 1) {
    const random = seededRandom(7919 + run * 104729);
    const rows = project({
      ...input,
      returnForYear: () =>
        (input.scenario.returnRateOverride ?? input.profile.expectedReturnRate) +
        normal(random) * input.profile.returnVolatility,
      inflationForYear: () =>
        (input.scenario.inflationRateOverride ?? input.profile.inflationRate) +
        normal(random) * 0.015,
    });
    for (const row of rows) {
      const values = balancesByYear.get(row.year) ?? [];
      values.push(row.closingBalance);
      balancesByYear.set(row.year, values);
    }
    const sustainable = rows.every(
      (row) => row.closingBalance > 0 || row.expenses + row.oneTimeCosts <= row.income,
    );
    if (sustainable && (rows.at(-1)?.closingBalance ?? 0) >= input.profile.targetLegacy) {
      successes += 1;
    }
  }
  return {
    successProbability: successes / runs,
    points: [...balancesByYear.entries()].map(([year, values]) => ({
      year,
      p10: percentile(values, 0.1),
      median: percentile(values, 0.5),
      p90: percentile(values, 0.9),
    })),
  };
}

function yearsToTarget(
  startingBalance: number,
  target: number,
  annualSavings: number,
  expectedReturn: number,
) {
  if (startingBalance >= target) return 0;
  if (annualSavings <= 0 && expectedReturn <= 0) return null;
  let balance = startingBalance;
  for (let years = 1; years <= 100; years += 1) {
    balance = balance * (1 + expectedReturn) + annualSavings;
    if (balance >= target) return years;
  }
  return null;
}

export function calculateFirePlan(input: {
  currentYear: number;
  currentInvestableAssets: number;
  profile: FireProfileModel;
  expenses: FireExpenseModel[];
  oneTimeCosts: FireOneTimeCostModel[];
  incomeStreams: FireIncomeModel[];
  scenarios: FireScenarioModel[];
}) {
  return input.scenarios.map((scenario): FireScenarioResult => {
    const inflationRate = scenario.inflationRateOverride ?? input.profile.inflationRate;
    const retirementYear = scenario.retirementYearOverride ?? input.profile.plannedRetirementYear;
    const multiplier = scenario.spendingMultiplier * (1 + scenario.bufferRate);
    const retirementExpenses = expensesForYear(
      input.expenses,
      retirementYear,
      input.currentYear,
      inflationRate,
      multiplier,
    );
    const required = requiredCorpus({
      currentYear: input.currentYear,
      profile: input.profile,
      expenses: input.expenses,
      oneTimeCosts: input.oneTimeCosts,
      incomeStreams: input.incomeStreams,
      scenario,
    });
    const deterministic = project({
      currentYear: input.currentYear,
      startingBalance: input.currentInvestableAssets,
      profile: input.profile,
      expenses: input.expenses,
      oneTimeCosts: input.oneTimeCosts,
      incomeStreams: input.incomeStreams,
      scenario,
    });
    const simulated = monteCarlo({
      currentYear: input.currentYear,
      startingBalance: input.currentInvestableAssets,
      profile: input.profile,
      expenses: input.expenses,
      oneTimeCosts: input.oneTimeCosts,
      incomeStreams: input.incomeStreams,
      scenario,
    });
    const returnRate = scenario.returnRateOverride ?? input.profile.expectedReturnRate;
    const yearsUntilRetirement = Math.max(0, retirementYear - input.currentYear);
    return {
      id: scenario.id,
      name: scenario.name,
      retirementYear,
      annualExpensesAtRetirement: retirementExpenses.total,
      annualEssentialAtRetirement: retirementExpenses.essential,
      requiredCorpus: required,
      withdrawalRate: required === 0 ? 0 : retirementExpenses.total / required,
      progress: required === 0 ? 1 : input.currentInvestableAssets / required,
      gap: Math.max(0, required - input.currentInvestableAssets),
      coastNumberToday: required / (1 + returnRate) ** yearsUntilRetirement,
      yearsToTarget: yearsToTarget(
        input.currentInvestableAssets,
        required,
        input.profile.annualSavings,
        returnRate,
      ),
      successProbability: simulated.successProbability,
      deterministic,
      monteCarlo: simulated.points,
    };
  });
}
