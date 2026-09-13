import "server-only";

import { bankAccount, bankTransaction, db, salaryPayslip } from "@portfolio/db";
import { and, asc, eq } from "drizzle-orm";

export type CashFlowScope = "all" | "personal" | "joint";

export async function getCashFlowDashboard(userId: string, scope: CashFlowScope = "all") {
  const [rows, payslips] = await Promise.all([
    db
      .select({
        id: bankTransaction.id,
        accountId: bankTransaction.accountId,
        bookedAt: bankTransaction.bookedAt,
        amount: bankTransaction.amount,
        currency: bankTransaction.currency,
        name: bankTransaction.name,
        description: bankTransaction.description,
        transactionType: bankTransaction.transactionType,
        counterpartyAccountLast4: bankTransaction.counterpartyAccountLast4,
        category: bankTransaction.category,
        categorySource: bankTransaction.categorySource,
        categoryConfidence: bankTransaction.categoryConfidence,
        institution: bankAccount.institution,
        accountName: bankAccount.name,
        accountLast4: bankAccount.accountLast4,
        ownershipType: bankAccount.ownershipType,
      })
      .from(bankTransaction)
      .innerJoin(
        bankAccount,
        and(eq(bankTransaction.accountId, bankAccount.id), eq(bankAccount.userId, userId)),
      )
      .where(eq(bankTransaction.userId, userId))
      .orderBy(asc(bankTransaction.bookedAt)),
    db
      .select({ payPeriod: salaryPayslip.payPeriod, netPay: salaryPayslip.netPay })
      .from(salaryPayslip)
      .where(eq(salaryPayslip.userId, userId)),
  ]);
  const ownedSuffixes = new Set(rows.map((row) => row.accountLast4).filter(Boolean));
  const allTransactions = rows.map((row) => {
    const isOwnedTransfer =
      row.counterpartyAccountLast4 !== null &&
      ownedSuffixes.has(row.counterpartyAccountLast4) &&
      row.counterpartyAccountLast4 !== row.accountLast4;
    return {
      ...row,
      amount: Number(row.amount),
      category: isOwnedTransfer ? "internal_transfer" : row.category,
      categoryConfidence: isOwnedTransfer ? 1 : Number(row.categoryConfidence),
      bookedAt: row.bookedAt.toISOString().slice(0, 10),
    };
  });
  const transactions = allTransactions.filter(
    (row) => scope === "all" || row.ownershipType === scope,
  );
  const external = transactions.filter((row) => row.category !== "internal_transfer");
  const expenses = external.filter((row) => row.amount < 0 && row.category !== "investment");
  const income = external.filter((row) => row.amount > 0);
  const investments = external.filter((row) => row.amount < 0 && row.category === "investment");
  const internalTransfersOut = transactions.filter(
    (row) => row.amount < 0 && row.category === "internal_transfer",
  );
  const internalTransfersIn = transactions.filter(
    (row) => row.amount > 0 && row.category === "internal_transfer",
  );
  const monthlyMap = new Map<
    string,
    { month: string; income: number; spending: number; invested: number; net: number }
  >();
  for (const row of external) {
    const key = row.bookedAt.slice(0, 7);
    const current = monthlyMap.get(key) ?? {
      month: key,
      income: 0,
      spending: 0,
      invested: 0,
      net: 0,
    };
    if (row.amount > 0) current.income += row.amount;
    else if (row.category === "investment") current.invested += -row.amount;
    else current.spending += -row.amount;
    current.net += row.amount;
    monthlyMap.set(key, current);
  }
  const categoryMap = new Map<string, number>();
  for (const row of expenses)
    categoryMap.set(row.category, (categoryMap.get(row.category) ?? 0) - row.amount);
  const merchantMap = new Map<string, number>();
  for (const row of expenses)
    merchantMap.set(row.name, (merchantMap.get(row.name) ?? 0) - row.amount);
  const accountMap = new Map<
    string,
    {
      name: string;
      institution: string;
      ownershipType: string;
      inflow: number;
      outflow: number;
      net: number;
    }
  >();
  for (const row of transactions) {
    const item = accountMap.get(row.accountId) ?? {
      name: row.accountName,
      institution: row.institution,
      ownershipType: row.ownershipType,
      inflow: 0,
      outflow: 0,
      net: 0,
    };
    if (row.amount > 0) item.inflow += row.amount;
    else item.outflow += -row.amount;
    item.net += row.amount;
    accountMap.set(row.accountId, item);
  }
  const salaryCredits = transactions.filter((row) => row.category === "salary");
  const salaryMatches = salaryCredits.filter((credit) =>
    payslips.some(
      (slip) =>
        slip.payPeriod.slice(0, 7) === credit.bookedAt.slice(0, 7) &&
        Math.abs(Number(slip.netPay) - credit.amount) <= 0.02,
    ),
  ).length;
  const completeMonths = [...monthlyMap.values()].filter(
    (item) => item.income > 0 || item.spending > 0,
  );
  const totalIncome = income.reduce((sum, row) => sum + row.amount, 0);
  const totalSpending = expenses.reduce((sum, row) => sum - row.amount, 0);
  return {
    configured: transactions.length > 0,
    currency: "EUR",
    metrics: {
      totalIncome,
      totalSpending,
      totalInvested: investments.reduce((sum, row) => sum - row.amount, 0),
      netCashFlow:
        totalIncome - totalSpending - investments.reduce((sum, row) => sum - row.amount, 0),
      averageMonthlySpending: completeMonths.length ? totalSpending / completeMonths.length : 0,
      savingsRate: totalIncome ? (totalIncome - totalSpending) / totalIncome : 0,
      salaryMatches,
      salaryCredits: salaryCredits.length,
      salaryReceived: salaryCredits.reduce((sum, row) => sum + row.amount, 0),
      lowConfidenceRows: transactions.filter((row) => row.categoryConfidence < 0.8).length,
      internalTransfersOut: internalTransfersOut.reduce((sum, row) => sum - row.amount, 0),
      internalTransfersIn: internalTransfersIn.reduce((sum, row) => sum + row.amount, 0),
      transactionCount: transactions.length,
    },
    monthly: [...monthlyMap.values()],
    categories: [...categoryMap]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
    merchants: [...merchantMap]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12),
    accounts: [...accountMap.values()],
    transactions: [...transactions].reverse(),
  };
}

export async function updateBankTransactionCategory(
  userId: string,
  transactionId: string,
  category: string,
) {
  const [updated] = await db
    .update(bankTransaction)
    .set({ category, categorySource: "manual", categoryConfidence: "1" })
    .where(and(eq(bankTransaction.id, transactionId), eq(bankTransaction.userId, userId)))
    .returning({ id: bankTransaction.id });
  if (!updated) throw new Error("Transaction not found.");
  return updated;
}
