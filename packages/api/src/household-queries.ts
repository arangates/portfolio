import { unstable_cache } from "next/cache";
import "server-only";

import {
  db,
  householdBudgetItem,
  householdBudgetSnapshot,
  householdProfile,
  householdPurchase,
  householdScenario,
  householdScenarioLine,
  householdServiceContract,
  householdServiceContractSnapshot,
} from "@portfolio/db";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { buildMortgageModel } from "./mortgage-calculations";
import { getMortgageBankPayments, getMortgageRecord } from "./mortgage-queries";

function latestBy<T>(rows: T[], key: (row: T) => string) {
  const latest = new Map<string, T>();
  for (const row of rows) {
    const id = key(row);
    if (!latest.has(id)) latest.set(id, row);
  }
  return latest;
}

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function totals(lines: Array<{ flowType: string; monthlyAmount: number }>, adultsCount: number) {
  const grossExpenses = money(
    lines.reduce((sum, line) => sum + (line.flowType === "expense" ? line.monthlyAmount : 0), 0),
  );
  const refunds = money(
    lines.reduce((sum, line) => sum + (line.flowType === "refund" ? line.monthlyAmount : 0), 0),
  );
  const netMonthly = money(grossExpenses - refunds);
  return {
    grossExpenses,
    refunds,
    netMonthly,
    annualNet: money(netMonthly * 12),
    perAdult: money(netMonthly / Math.max(1, adultsCount)),
    refundCoverage: grossExpenses === 0 ? 0 : refunds / grossExpenses,
  };
}

function contractHealth(status: string, contractEndDate: string | null) {
  if (status === "ended" || status === "cancelled") return status;
  if (!contractEndDate) return "active";
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const end = new Date(`${contractEndDate}T00:00:00.000Z`);
  const days = Math.ceil((end.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return "needs_review";
  if (days <= 90) return "renewal_due";
  return "active";
}

export type HouseSetupCategory =
  | "Notary"
  | "Broker commission"
  | "Mortgage advisor"
  | "Taxes"
  | "Other expenses";

export type HouseSetupGroup = {
  category: HouseSetupCategory;
  amount: number;
  itemCount: number;
  percentageOfTotal: number;
  percentageOfMortgage: number;
  items: Array<{
    id: string;
    name: string;
    amount: number;
    purchasedOn: string | null;
    vendor: string | null;
  }>;
};

export type HouseAcquisitionCosts = {
  currency: string;
  mortgagePaidSoFar: number;
  mortgagePaymentsCount: number;
  mortgageMonthlyPayment: number | null;
  purchasePrice: number | null;
  propertyValue: number | null;
  oneTimeSetupTotal: number;
  totalCosts: number;
  totalAcquisitionCosts: number;
  groups: HouseSetupGroup[];
};

export function classifyHouseSetupExpense(purchase: {
  name: string;
  category: string;
  vendor?: string | null;
  notes?: string | null;
}): HouseSetupCategory {
  const cat = purchase.category?.trim();
  if (
    cat === "Notary" ||
    cat === "Broker commission" ||
    cat === "Mortgage advisor" ||
    cat === "Taxes" ||
    cat === "Other expenses"
  ) {
    return cat as HouseSetupCategory;
  }
  const text =
    `${purchase.category || ""} ${purchase.name || ""} ${purchase.vendor ?? ""} ${purchase.notes ?? ""}`.toLowerCase();
  if (text.includes("notar")) return "Notary";
  if (
    text.includes("makelaar") ||
    text.includes("broker") ||
    text.includes("brokage") ||
    text.includes("real estate advisor") ||
    text.includes("real estate agent")
  ) {
    return "Broker commission";
  }
  if (
    text.includes("mortgage advisor") ||
    text.includes("financieel fit") ||
    text.includes("hypotheekadv") ||
    text.includes("loan advisor")
  ) {
    return "Mortgage advisor";
  }
  if (
    text.includes("tax") ||
    text.includes("belasting") ||
    text.includes("overdracht") ||
    text.includes("kadaster")
  ) {
    return "Taxes";
  }
  return "Other expenses";
}

async function getHouseholdDashboardUncached(userId: string) {
  const [
    profiles,
    itemRows,
    snapshotRows,
    scenarioRows,
    lineRows,
    contractRows,
    termRows,
    purchases,
    mortgageRecord,
  ] = await Promise.all([
    db.select().from(householdProfile).where(eq(householdProfile.userId, userId)).limit(1),
    db
      .select()
      .from(householdBudgetItem)
      .where(and(eq(householdBudgetItem.userId, userId), isNull(householdBudgetItem.archivedAt)))
      .orderBy(asc(householdBudgetItem.category), asc(householdBudgetItem.name)),
    db
      .select()
      .from(householdBudgetSnapshot)
      .where(eq(householdBudgetSnapshot.userId, userId))
      .orderBy(
        desc(householdBudgetSnapshot.effectiveFrom),
        desc(householdBudgetSnapshot.createdAt),
      ),
    db
      .select()
      .from(householdScenario)
      .where(and(eq(householdScenario.userId, userId), isNull(householdScenario.archivedAt)))
      .orderBy(desc(householdScenario.isDefault), asc(householdScenario.createdAt)),
    db
      .select()
      .from(householdScenarioLine)
      .where(
        and(eq(householdScenarioLine.userId, userId), isNull(householdScenarioLine.archivedAt)),
      )
      .orderBy(asc(householdScenarioLine.sortOrder), asc(householdScenarioLine.name)),
    db
      .select()
      .from(householdServiceContract)
      .where(
        and(
          eq(householdServiceContract.userId, userId),
          isNull(householdServiceContract.archivedAt),
        ),
      )
      .orderBy(asc(householdServiceContract.service)),
    db
      .select()
      .from(householdServiceContractSnapshot)
      .where(eq(householdServiceContractSnapshot.userId, userId))
      .orderBy(
        desc(householdServiceContractSnapshot.effectiveFrom),
        desc(householdServiceContractSnapshot.createdAt),
      ),
    db
      .select()
      .from(householdPurchase)
      .where(and(eq(householdPurchase.userId, userId), isNull(householdPurchase.archivedAt)))
      .orderBy(desc(householdPurchase.purchasedOn), desc(householdPurchase.createdAt)),
    getMortgageRecord(userId),
  ]);

  const profileRow = profiles[0];
  const currency = profileRow?.currency ?? "EUR";
  const adultsCount = profileRow?.adultsCount ?? 1;
  const today = new Date().toISOString().slice(0, 10);
  const currentSnapshotRows = snapshotRows.filter((row) => row.effectiveFrom <= today);
  const currentTermRows = termRows.filter((row) => row.effectiveFrom <= today);
  const latestSnapshots = latestBy(currentSnapshotRows, (row) => row.itemId);
  const budget = itemRows.flatMap((item) => {
    const snapshot = latestSnapshots.get(item.id);
    if (!snapshot) return [];
    return [
      {
        id: item.id,
        name: item.name,
        category: item.category,
        flowType: item.flowType as "expense" | "refund",
        essential: item.essential,
        notes: item.notes,
        monthlyAmount: Number(snapshot.monthlyAmount),
        effectiveFrom: snapshot.effectiveFrom,
        source: snapshot.source,
      },
    ];
  });
  const budgetById = new Map(budget.map((item) => [item.id, item]));
  const currentTotals = totals(budget, adultsCount);

  const linesByScenario = new Map<string, typeof lineRows>();
  for (const line of lineRows) {
    const lines = linesByScenario.get(line.scenarioId) ?? [];
    lines.push(line);
    linesByScenario.set(line.scenarioId, lines);
  }
  const scenarios = scenarioRows.map((scenario) => {
    const lines = scenario.usesCurrentBudget
      ? budget
      : (linesByScenario.get(scenario.id) ?? []).map((line) => ({
          id: line.id,
          name: line.name,
          category: line.category,
          flowType: line.flowType as "expense" | "refund",
          monthlyAmount: Number(line.monthlyAmount),
          essential: line.essential,
          notes: line.notes,
          sortOrder: line.sortOrder,
        }));
    return {
      id: scenario.id,
      name: scenario.name,
      scenarioType: scenario.scenarioType,
      description: scenario.description,
      adultsCount: scenario.adultsCount,
      usesCurrentBudget: scenario.usesCurrentBudget,
      isDefault: scenario.isDefault,
      lines,
      ...totals(lines, scenario.adultsCount),
    };
  });

  const latestTerms = latestBy(currentTermRows, (row) => row.contractId);
  const contracts = contractRows.map((contract) => {
    const term = latestTerms.get(contract.id);
    const linkedBudget = contract.budgetItemId
      ? (budgetById.get(contract.budgetItemId) ?? null)
      : null;
    const monthlyCost =
      term?.monthlyCost === null || term?.monthlyCost === undefined
        ? null
        : Number(term.monthlyCost);
    const difference =
      monthlyCost === null || !linkedBudget
        ? null
        : money(monthlyCost - linkedBudget.monthlyAmount);
    return {
      id: contract.id,
      budgetItemId: contract.budgetItemId,
      budgetItemName: linkedBudget?.name ?? null,
      budgetAmount: linkedBudget?.monthlyAmount ?? null,
      service: contract.service,
      provider: contract.provider,
      effectiveFrom: term?.effectiveFrom ?? null,
      monthlyCost,
      billingDay: term?.billingDay ?? null,
      contractEndDate: term?.contractEndDate ?? null,
      durationMonths: term?.durationMonths ?? null,
      renewalType: term?.renewalType ?? "unknown",
      status: term?.status ?? "unknown",
      health: contractHealth(term?.status ?? "unknown", term?.contractEndDate ?? null),
      notes: term?.notes ?? null,
      difference,
      hasBudgetMismatch: difference !== null && Math.abs(difference) >= 1,
    };
  });

  const categoryMap = new Map<string, number>();
  for (const item of budget) {
    if (item.flowType !== "expense") continue;
    categoryMap.set(item.category, (categoryMap.get(item.category) ?? 0) + item.monthlyAmount);
  }
  const categoryBreakdown = [...categoryMap.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
  const oneTimeExpenses = purchases.map((purchase) => ({
    id: purchase.id,
    name: purchase.name,
    scope: purchase.scope,
    category: purchase.category,
    vendor: purchase.vendor,
    amount: Number(purchase.amount),
    currency: purchase.currency,
    purchasedOn: purchase.purchasedOn,
    paymentSource: purchase.paymentSource,
    notes: purchase.notes,
  }));
  const purchaseTotals = [...new Set(oneTimeExpenses.map((purchase) => purchase.scope))].map(
    (scope) => ({
      scope,
      amount: money(
        oneTimeExpenses
          .filter((purchase) => purchase.scope === scope)
          .reduce((sum, purchase) => sum + purchase.amount, 0),
      ),
    }),
  );

  let totalMortgagePaid = 0;
  let mortgagePaymentsCount = 0;
  if (mortgageRecord) {
    const bank = await getMortgageBankPayments(
      userId,
      mortgageRecord.settings.terms.monthlyPayment,
    );
    if (bank.payments.length > 0) {
      totalMortgagePaid = money(bank.payments.reduce((sum, p) => sum + Math.abs(p.amount), 0));
      mortgagePaymentsCount = bank.payments.length;
    } else {
      const model = buildMortgageModel({
        terms: mortgageRecord.settings.terms,
        rateBasis: mortgageRecord.settings.rateBasis,
        extras: mortgageRecord.settings.extras,
      });
      totalMortgagePaid = money(model.summary.paidToDate);
      mortgagePaymentsCount = model.history.length;
    }
  }

  const houseSetupPurchases = oneTimeExpenses.filter((p) => p.scope === "house_setup");
  const categoriesList: HouseSetupCategory[] = [
    "Notary",
    "Broker commission",
    "Mortgage advisor",
    "Taxes",
    "Other expenses",
  ];

  const houseSetupGroups: HouseSetupGroup[] = categoriesList.map((category) => {
    const items = houseSetupPurchases.filter((p) => classifyHouseSetupExpense(p) === category);
    const amount = money(items.reduce((sum, item) => sum + item.amount, 0));
    return {
      category,
      amount,
      itemCount: items.length,
      percentageOfTotal: 0,
      percentageOfMortgage: totalMortgagePaid > 0 ? (amount / totalMortgagePaid) * 100 : 0,
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        amount: item.amount,
        purchasedOn: item.purchasedOn,
        vendor: item.vendor,
      })),
    };
  });

  const houseSetupTotal = money(houseSetupGroups.reduce((sum, group) => sum + group.amount, 0));
  const totalCosts = money(totalMortgagePaid + houseSetupTotal);
  for (const group of houseSetupGroups) {
    group.percentageOfTotal = totalCosts > 0 ? (group.amount / totalCosts) * 100 : 0;
  }

  const purchasePrice = mortgageRecord?.settings.terms.originalAmount ?? null;
  const propertyValue = mortgageRecord?.settings.terms.propertyValue ?? null;
  const totalAcquisitionCosts = money((purchasePrice ?? 0) + houseSetupTotal);

  const houseAcquisitionCosts: HouseAcquisitionCosts = {
    currency,
    mortgagePaidSoFar: totalMortgagePaid,
    mortgagePaymentsCount,
    mortgageMonthlyPayment: mortgageRecord?.settings.terms.monthlyPayment ?? null,
    purchasePrice,
    propertyValue,
    oneTimeSetupTotal: houseSetupTotal,
    totalCosts,
    totalAcquisitionCosts,
    groups: houseSetupGroups,
  };

  return {
    configured: Boolean(profileRow),
    profile: profileRow
      ? {
          name: profileRow.name,
          currency: profileRow.currency,
          adultsCount: profileRow.adultsCount,
        }
      : null,
    currency,
    adultsCount,
    budget,
    scenarios,
    contracts,
    oneTimeExpenses,
    budgetHistory: snapshotRows.map((snapshot) => ({
      ...snapshot,
      monthlyAmount: Number(snapshot.monthlyAmount),
    })),
    contractHistory: termRows.map((term) => ({
      ...term,
      monthlyCost: term.monthlyCost === null ? null : Number(term.monthlyCost),
    })),
    categoryBreakdown,
    purchaseTotals,
    houseAcquisitionCosts,
    metrics: {
      ...currentTotals,
      essentialExpenses: money(
        budget.reduce(
          (sum, item) =>
            sum + (item.flowType === "expense" && item.essential ? item.monthlyAmount : 0),
          0,
        ),
      ),
      flexibleExpenses: money(
        budget.reduce(
          (sum, item) =>
            sum + (item.flowType === "expense" && !item.essential ? item.monthlyAmount : 0),
          0,
        ),
      ),
      contractMonthlyCost: money(
        contracts.reduce((sum, contract) => sum + (contract.monthlyCost ?? 0), 0),
      ),
      contractsNeedingReview: contracts.filter(
        (contract) => contract.health === "needs_review" || contract.health === "renewal_due",
      ).length,
      budgetMismatches: contracts.filter((contract) => contract.hasBudgetMismatch).length,
      oneTimeTotal: money(oneTimeExpenses.reduce((sum, purchase) => sum + purchase.amount, 0)),
    },
  };
}

export async function getHouseholdExport(userId: string) {
  const dashboard = await getHouseholdDashboard(userId);
  return {
    profile: dashboard.profile,
    budget: dashboard.budget,
    scenarios: dashboard.scenarios,
    contracts: dashboard.contracts,
    purchases: dashboard.oneTimeExpenses,
    houseAcquisitionCosts: dashboard.houseAcquisitionCosts,
    budgetHistory: dashboard.budgetHistory,
    contractHistory: dashboard.contractHistory,
  };
}

export const getHouseholdDashboard = unstable_cache(
  async (userId: string) => {
    return getHouseholdDashboardUncached(userId);
  },
  ["household-dashboard"],
  { tags: ["household", "portfolio"], revalidate: 3600 },
);
