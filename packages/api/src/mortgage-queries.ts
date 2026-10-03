import "server-only";

import {
  bankAccount,
  bankTransaction,
  db,
  mortgageExtraRepayment,
  mortgageImport,
  mortgageLoan,
  mortgageOverview,
} from "@portfolio/db";
import { and, asc, desc, eq, lt } from "drizzle-orm";

import type { ActualPayment, MortgageSettingsState } from "./mortgage-calculations";

const MORTGAGE_TEXT = /hypotheek|hypotheken|mortgage|r\s?106[-\s]?784564/i;
const day = (value: Date) => value.toISOString().slice(0, 10);
const num = (value: string | null) => (value === null ? 0 : Number(value));
const nullableNum = (value: string | null) => (value === null ? null : Number(value));

export type MortgageRecord = {
  loanId: string;
  lender: string;
  loanNumber: string;
  overviewId: string;
  source: string;
  importId: string | null;
  repaymentType: string;
  sustainabilityDiscount: boolean;
  energyLabel: string | null;
  nhg: boolean;
  bouwdepotOriginal: number | null;
  bouwdepotRemaining: number | null;
  validationStatus: string;
  validationIssues: string[];
  updatedAt: string;
  settings: MortgageSettingsState;
};

export type MortgageSnapshot = {
  id: string;
  asOf: string;
  source: string;
  currentBalance: number;
  monthlyPayment: number;
  statedRate: number;
  discount: number;
  propertyValue: number | null;
};

/** The user's current mortgage: the latest dated overview of the most recently used loan. */
export async function getMortgageRecord(userId: string): Promise<MortgageRecord | null> {
  const [loan] = await db
    .select()
    .from(mortgageLoan)
    .where(eq(mortgageLoan.userId, userId))
    .orderBy(desc(mortgageLoan.updatedAt))
    .limit(1);
  if (!loan) return null;
  const [overview] = await db
    .select()
    .from(mortgageOverview)
    .where(and(eq(mortgageOverview.userId, userId), eq(mortgageOverview.loanId, loan.id)))
    .orderBy(desc(mortgageOverview.asOf))
    .limit(1);
  if (!overview) return null;
  const extras = await db
    .select({ date: mortgageExtraRepayment.paidOn, amount: mortgageExtraRepayment.amount })
    .from(mortgageExtraRepayment)
    .where(
      and(eq(mortgageExtraRepayment.userId, userId), eq(mortgageExtraRepayment.loanId, loan.id)),
    )
    .orderBy(asc(mortgageExtraRepayment.paidOn));
  return {
    loanId: loan.id,
    lender: loan.lender,
    loanNumber: loan.loanNumber,
    overviewId: overview.id,
    source: overview.source,
    importId: overview.importId,
    repaymentType: overview.repaymentType,
    sustainabilityDiscount: overview.sustainabilityDiscount,
    energyLabel: overview.energyLabel,
    nhg: overview.nhg,
    bouwdepotOriginal: nullableNum(overview.bouwdepotOriginal),
    bouwdepotRemaining: nullableNum(overview.bouwdepotRemaining),
    validationStatus: overview.validationStatus,
    validationIssues: overview.validationIssues,
    updatedAt: overview.updatedAt.toISOString(),
    settings: {
      rateBasis:
        (["implied", "stated", "net"] as const).find((item) => item === loan.rateBasis) ??
        "implied",
      appreciation: num(loan.propertyAppreciation),
      extras: extras.map((extra) => ({ date: extra.date, amount: num(extra.amount) })),
      terms: {
        originalAmount: num(overview.originalAmount),
        currentBalance: num(overview.currentBalance),
        monthlyPayment: num(overview.monthlyPayment),
        statedRate: num(overview.statedRate),
        discount: num(overview.discount),
        startDate: overview.startDate,
        firstPaymentDate: overview.firstPaymentDate,
        endDate: overview.endDate,
        fixedRateEndDate: overview.fixedRateEndDate,
        asOf: overview.asOf,
        propertyValue: num(overview.propertyValue),
        valuationDate: overview.valuationDate ?? overview.asOf,
        freeRepaymentAllowance: num(overview.freeRepaymentAllowance),
        registrationAmount: num(overview.registrationAmount),
      },
    },
  };
}

/** Every dated overview for a loan, oldest first, to show how the debt moved between them. */
export async function getMortgageSnapshots(
  userId: string,
  loanId: string,
): Promise<MortgageSnapshot[]> {
  const rows = await db
    .select()
    .from(mortgageOverview)
    .where(and(eq(mortgageOverview.userId, userId), eq(mortgageOverview.loanId, loanId)))
    .orderBy(asc(mortgageOverview.asOf));
  return rows.map((row) => ({
    id: row.id,
    asOf: row.asOf,
    source: row.source,
    currentBalance: num(row.currentBalance),
    monthlyPayment: num(row.monthlyPayment),
    statedRate: num(row.statedRate),
    discount: num(row.discount),
    propertyValue: nullableNum(row.propertyValue),
  }));
}

export async function getRecentMortgageImports(userId: string) {
  return db
    .select({
      id: mortgageImport.id,
      fileName: mortgageImport.fileName,
      status: mortgageImport.status,
      errorMessage: mortgageImport.errorMessage,
      createdAt: mortgageImport.createdAt,
    })
    .from(mortgageImport)
    .where(eq(mortgageImport.userId, userId))
    .orderBy(desc(mortgageImport.createdAt))
    .limit(10);
}

/**
 * Bank debits that look like mortgage instalments across every imported account, including the
 * joint account, plus the date range of the statements that carry them.
 */
export async function getMortgageBankPayments(userId: string, monthlyPayment: number) {
  const rows = await db
    .select({
      bookedAt: bankTransaction.bookedAt,
      amount: bankTransaction.amount,
      name: bankTransaction.name,
      description: bankTransaction.description,
      category: bankTransaction.category,
      accountId: bankTransaction.accountId,
      accountName: bankAccount.name,
      ownership: bankAccount.ownershipType,
    })
    .from(bankTransaction)
    .innerJoin(bankAccount, eq(bankAccount.id, bankTransaction.accountId))
    .where(
      and(
        eq(bankTransaction.userId, userId),
        eq(bankTransaction.currency, "EUR"),
        lt(bankTransaction.amount, "0"),
      ),
    )
    .orderBy(asc(bankTransaction.bookedAt));

  const matched = rows.filter((row) => {
    const amount = Math.abs(Number(row.amount));
    const exactAmount = Math.abs(amount - monthlyPayment) < 0.005;
    return (
      MORTGAGE_TEXT.test(`${row.name} ${row.description}`) ||
      (exactAmount && (row.category === "housing" || /\bing\b|hypo|woning/i.test(row.name)))
    );
  });
  const payments: ActualPayment[] = matched.map((row) => ({
    date: day(row.bookedAt),
    amount: Number(row.amount),
    description: row.name,
    account: row.accountName,
    joint: row.ownership === "joint",
  }));

  // Coverage follows the accounts the instalments leave from, so a short export of another
  // account cannot make months look covered (or hide real gaps).
  const accountIds = new Set(matched.map((row) => row.accountId));
  const covering = rows.filter((row) => (accountIds.size ? accountIds.has(row.accountId) : true));
  const first = covering[0]?.bookedAt;
  const last = covering.at(-1)?.bookedAt;
  return {
    payments,
    coverageStart: first ? day(first) : null,
    coverageEnd: last ? day(last) : null,
  };
}
