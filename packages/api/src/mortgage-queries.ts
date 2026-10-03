import "server-only";

import { bankTransaction, db } from "@portfolio/db";
import { and, asc, eq, lt, min } from "drizzle-orm";

import type { ActualPayment } from "./mortgage-calculations";

const MORTGAGE_TEXT = /hypotheek|hypotheken|mortgage|r\s?106[-\s]?784564/i;

/** Bank debits that look like mortgage instalments, plus the earliest imported booking date. */
export async function getMortgageBankPayments(userId: string, monthlyPayment: number) {
  const [rows, coverage] = await Promise.all([
    db
      .select({
        bookedAt: bankTransaction.bookedAt,
        amount: bankTransaction.amount,
        name: bankTransaction.name,
        description: bankTransaction.description,
        category: bankTransaction.category,
      })
      .from(bankTransaction)
      .where(
        and(
          eq(bankTransaction.userId, userId),
          eq(bankTransaction.currency, "EUR"),
          lt(bankTransaction.amount, "0"),
        ),
      )
      .orderBy(asc(bankTransaction.bookedAt)),
    db
      .select({ first: min(bankTransaction.bookedAt) })
      .from(bankTransaction)
      .where(eq(bankTransaction.userId, userId)),
  ]);
  const payments: ActualPayment[] = rows
    .filter((row) => {
      const amount = Math.abs(Number(row.amount));
      const textMatch = MORTGAGE_TEXT.test(`${row.name} ${row.description}`);
      const amountMatch = Math.abs(amount - monthlyPayment) < 0.005 && row.category === "housing";
      return textMatch || amountMatch;
    })
    .map((row) => ({
      date: row.bookedAt.toISOString().slice(0, 10),
      amount: Number(row.amount),
      description: row.name,
    }));
  return { payments, coverageStart: coverage[0]?.first?.toISOString().slice(0, 10) ?? null };
}
