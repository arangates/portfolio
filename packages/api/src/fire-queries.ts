import "server-only";

import {
  db,
  familyMember,
  fireExpense,
  fireIncomeStream,
  fireOneTimeCost,
  fireProfile,
  fireScenario,
} from "@portfolio/db";
import { and, asc, eq, isNull } from "drizzle-orm";

import { calculateFirePlan } from "./fire-engine";
import { getLatestExchangeRates, getPortfolioOverview } from "./portfolio-queries";

function conversionRate(
  currency: string,
  baseCurrency: string,
  rates: Awaited<ReturnType<typeof getLatestExchangeRates>>,
) {
  if (currency === baseCurrency) return 1;
  const direct = rates.find(
    (rate) => rate.baseCurrency === baseCurrency && rate.quoteCurrency === currency,
  );
  if (direct) return direct.rate;
  const inverse = rates.find(
    (rate) => rate.baseCurrency === currency && rate.quoteCurrency === baseCurrency,
  );
  return inverse && inverse.rate !== 0 ? 1 / inverse.rate : null;
}

export async function getFirePlan(userId: string) {
  const [portfolio, rates, profiles, members, expenseRows, costRows, incomeRows, scenarioRows] =
    await Promise.all([
      getPortfolioOverview(userId),
      getLatestExchangeRates(userId),
      db.select().from(fireProfile).where(eq(fireProfile.userId, userId)).limit(1),
      db
        .select()
        .from(familyMember)
        .where(and(eq(familyMember.userId, userId), isNull(familyMember.archivedAt)))
        .orderBy(asc(familyMember.createdAt)),
      db
        .select()
        .from(fireExpense)
        .where(and(eq(fireExpense.userId, userId), isNull(fireExpense.archivedAt)))
        .orderBy(asc(fireExpense.category), asc(fireExpense.name)),
      db
        .select()
        .from(fireOneTimeCost)
        .where(and(eq(fireOneTimeCost.userId, userId), isNull(fireOneTimeCost.archivedAt)))
        .orderBy(asc(fireOneTimeCost.plannedYear), asc(fireOneTimeCost.name)),
      db
        .select()
        .from(fireIncomeStream)
        .where(and(eq(fireIncomeStream.userId, userId), isNull(fireIncomeStream.archivedAt)))
        .orderBy(asc(fireIncomeStream.startYear), asc(fireIncomeStream.name)),
      db
        .select()
        .from(fireScenario)
        .where(and(eq(fireScenario.userId, userId), eq(fireScenario.enabled, true)))
        .orderBy(asc(fireScenario.createdAt)),
    ]);

  const profileRow = profiles[0];
  const baseCurrency = portfolio.preference.baseCurrency;
  const currenciesMissing = new Set<string>();
  const convert = (amount: number, currency: string) => {
    const rate = conversionRate(currency, baseCurrency, rates);
    if (rate === null) {
      currenciesMissing.add(currency);
      return null;
    }
    return amount * rate;
  };

  const family = members.map((member) => ({
    id: member.id,
    name: member.name,
    relationship: member.relationship,
    birthDate: member.birthDate,
    linkedToPortfolio: member.linkedToPortfolio,
    netWorth: Number(member.netWorth),
    investableAssets: Number(member.investableAssets),
    annualNetIncome: Number(member.annualNetIncome),
    currency: member.currency,
    includedInPlan: member.includedInPlan,
  }));
  const memberNames = new Map(family.map((member) => [member.id, member.name]));
  const manualFamilyInvestableAssets = family.reduce((total, member) => {
    if (!member.includedInPlan || member.linkedToPortfolio) return total;
    return total + (convert(member.investableAssets, member.currency) ?? 0);
  }, 0);
  const manualFamilyNetWorth = family.reduce((total, member) => {
    if (!member.includedInPlan || member.linkedToPortfolio) return total;
    return total + (convert(member.netWorth, member.currency) ?? 0);
  }, 0);
  const currentInvestableAssets = portfolio.totals.liquidValue + manualFamilyInvestableAssets;
  const familyNetWorth = portfolio.totals.netWorth + manualFamilyNetWorth;

  const expenses = expenseRows.map((expense) => {
    const monthlyAmount = Number(expense.monthlyAmount);
    return {
      id: expense.id,
      memberId: expense.memberId,
      memberName: expense.memberId ? (memberNames.get(expense.memberId) ?? null) : null,
      name: expense.name,
      category: expense.category,
      monthlyAmount,
      baseMonthlyAmount: convert(monthlyAmount, expense.currency),
      currency: expense.currency,
      essential: expense.essential,
      startYear: expense.startYear,
      endYear: expense.endYear,
      inflationRateOverride:
        expense.inflationRateOverride === null ? null : Number(expense.inflationRateOverride),
      notes: expense.notes,
    };
  });
  const oneTimeCosts = costRows.map((cost) => {
    const amount = Number(cost.amount);
    return {
      id: cost.id,
      memberId: cost.memberId,
      memberName: cost.memberId ? (memberNames.get(cost.memberId) ?? null) : null,
      name: cost.name,
      amount,
      baseAmount: convert(amount, cost.currency),
      currency: cost.currency,
      plannedYear: cost.plannedYear,
      priority: cost.priority,
      inflationLinked: cost.inflationLinked,
      notes: cost.notes,
    };
  });
  const incomeStreams = incomeRows.map((income) => {
    const annualAmount = Number(income.annualAmount);
    return {
      id: income.id,
      memberId: income.memberId,
      memberName: income.memberId ? (memberNames.get(income.memberId) ?? null) : null,
      name: income.name,
      incomeType: income.incomeType,
      annualAmount,
      baseAnnualAmount: convert(annualAmount, income.currency),
      currency: income.currency,
      startYear: income.startYear,
      endYear: income.endYear,
      inflationLinked: income.inflationLinked,
      notes: income.notes,
    };
  });
  const scenarios = scenarioRows.map((scenario) => ({
    id: scenario.id,
    name: scenario.name,
    spendingMultiplier: Number(scenario.spendingMultiplier),
    bufferRate: Number(scenario.bufferRate),
    returnRateOverride:
      scenario.returnRateOverride === null ? null : Number(scenario.returnRateOverride),
    inflationRateOverride:
      scenario.inflationRateOverride === null ? null : Number(scenario.inflationRateOverride),
    retirementYearOverride: scenario.retirementYearOverride,
    enabled: scenario.enabled,
  }));

  if (!profileRow) {
    return {
      configured: false as const,
      baseCurrency,
      family,
      expenses,
      oneTimeCosts,
      incomeStreams,
      scenarios,
      portfolio,
      currentInvestableAssets,
      familyNetWorth,
      unconvertedCurrencies: [...currenciesMissing],
    };
  }

  const annualSavings = convert(Number(profileRow.annualSavings), profileRow.savingsCurrency) ?? 0;
  const targetLegacy = convert(Number(profileRow.targetLegacy), profileRow.savingsCurrency) ?? 0;
  const profile = {
    birthDate: profileRow.birthDate,
    plannedRetirementYear: profileRow.plannedRetirementYear,
    planEndAge: profileRow.planEndAge,
    inflationRate: Number(profileRow.inflationRate),
    expectedReturnRate: Number(profileRow.expectedReturnRate),
    returnVolatility: Number(profileRow.returnVolatility),
    safeWithdrawalRate: Number(profileRow.safeWithdrawalRate),
    safetyBuffer: Number(profileRow.safetyBuffer),
    annualSavings,
    annualSavingsInput: Number(profileRow.annualSavings),
    savingsCurrency: profileRow.savingsCurrency,
    targetLegacy,
    targetLegacyInput: Number(profileRow.targetLegacy),
    spendingPolicy: profileRow.spendingPolicy as "fixed_real" | "essential_floor",
  };
  const calculationExpenses = expenses.flatMap((expense) =>
    expense.baseMonthlyAmount === null
      ? []
      : [{ ...expense, monthlyAmount: expense.baseMonthlyAmount }],
  );
  const calculationCosts = oneTimeCosts.flatMap((cost) =>
    cost.baseAmount === null ? [] : [{ ...cost, amount: cost.baseAmount }],
  );
  const calculationIncome = incomeStreams.flatMap((income) =>
    income.baseAnnualAmount === null ? [] : [{ ...income, annualAmount: income.baseAnnualAmount }],
  );
  const results = calculateFirePlan({
    currentYear: new Date().getUTCFullYear(),
    currentInvestableAssets,
    profile,
    expenses: calculationExpenses,
    oneTimeCosts: calculationCosts,
    incomeStreams: calculationIncome,
    scenarios,
  });

  return {
    configured: true as const,
    baseCurrency,
    profile,
    family,
    expenses,
    oneTimeCosts,
    incomeStreams,
    scenarios,
    results,
    portfolio,
    currentInvestableAssets,
    familyNetWorth,
    monthlyExpenses: calculationExpenses.reduce(
      (total, expense) => total + expense.monthlyAmount,
      0,
    ),
    monthlyEssentialExpenses: calculationExpenses.reduce(
      (total, expense) => total + (expense.essential ? expense.monthlyAmount : 0),
      0,
    ),
    oneTimeCostTotal: calculationCosts.reduce((total, cost) => total + cost.amount, 0),
    annualIncomeStreams: calculationIncome.reduce(
      (total, income) => total + income.annualAmount,
      0,
    ),
    unconvertedCurrencies: [...currenciesMissing],
  };
}

export async function getFireExport(userId: string) {
  const plan = await getFirePlan(userId);
  return {
    profile: plan.configured ? plan.profile : null,
    family: plan.family,
    expenses: plan.expenses,
    oneTimeCosts: plan.oneTimeCosts,
    incomeStreams: plan.incomeStreams,
    scenarios: plan.scenarios,
  };
}

export async function getFireSettings(userId: string) {
  const [profiles, members] = await Promise.all([
    db.select().from(fireProfile).where(eq(fireProfile.userId, userId)).limit(1),
    db
      .select()
      .from(familyMember)
      .where(and(eq(familyMember.userId, userId), isNull(familyMember.archivedAt)))
      .orderBy(asc(familyMember.createdAt)),
  ]);
  const profile = profiles[0];
  return {
    profile: profile
      ? {
          birthDate: profile.birthDate,
          plannedRetirementYear: profile.plannedRetirementYear,
          planEndAge: profile.planEndAge,
          inflationRate: Number(profile.inflationRate),
          expectedReturnRate: Number(profile.expectedReturnRate),
          returnVolatility: Number(profile.returnVolatility),
          safeWithdrawalRate: Number(profile.safeWithdrawalRate),
          safetyBuffer: Number(profile.safetyBuffer),
          annualSavings: Number(profile.annualSavings),
          savingsCurrency: profile.savingsCurrency,
          targetLegacy: Number(profile.targetLegacy),
          spendingPolicy: profile.spendingPolicy,
        }
      : null,
    family: members.map((member) => ({
      id: member.id,
      name: member.name,
      relationship: member.relationship,
      birthDate: member.birthDate,
      linkedToPortfolio: member.linkedToPortfolio,
      netWorth: Number(member.netWorth),
      investableAssets: Number(member.investableAssets),
      annualNetIncome: Number(member.annualNetIncome),
      currency: member.currency,
      includedInPlan: member.includedInPlan,
    })),
  };
}
