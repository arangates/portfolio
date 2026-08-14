import "server-only";

import { db, salaryImport, salaryLineItem, salaryPayslip } from "@portfolio/db";
import { and, asc, desc, eq, inArray } from "drizzle-orm";

function numberOrNull(value: string | null) {
  return value === null ? null : Number(value);
}

function numberValue(value: string) {
  return Number(value);
}

export async function getSalaryPayslips(userId: string) {
  const rows = await db
    .select({
      id: salaryPayslip.id,
      importId: salaryPayslip.importId,
      employerName: salaryPayslip.employerName,
      payPeriod: salaryPayslip.payPeriod,
      periodLabel: salaryPayslip.periodLabel,
      currency: salaryPayslip.currency,
      revision: salaryPayslip.revision,
      baseSalary: salaryPayslip.baseSalary,
      supplementalGross: salaryPayslip.supplementalGross,
      grossPay: salaryPayslip.grossPay,
      taxableWage: salaryPayslip.taxableWage,
      wageTax: salaryPayslip.wageTax,
      pensionContribution: salaryPayslip.pensionContribution,
      socialInsurance: salaryPayslip.socialInsurance,
      thirtyPercentAdjustment: salaryPayslip.thirtyPercentAdjustment,
      thirtyPercentCompensation: salaryPayslip.thirtyPercentCompensation,
      expenseReimbursements: salaryPayslip.expenseReimbursements,
      netPay: salaryPayslip.netPay,
      annualSalary: salaryPayslip.annualSalary,
      partTimePercentage: salaryPayslip.partTimePercentage,
      ytdTaxableWage: salaryPayslip.ytdTaxableWage,
      ytdWageTax: salaryPayslip.ytdWageTax,
      ytdNetPay: salaryPayslip.ytdNetPay,
      ytdPension: salaryPayslip.ytdPension,
      validationStatus: salaryPayslip.validationStatus,
      validationIssues: salaryPayslip.validationIssues,
      createdAt: salaryPayslip.createdAt,
    })
    .from(salaryPayslip)
    .innerJoin(
      salaryImport,
      and(
        eq(salaryPayslip.importId, salaryImport.id),
        eq(salaryImport.userId, userId),
        eq(salaryImport.status, "completed"),
      ),
    )
    .where(eq(salaryPayslip.userId, userId))
    .orderBy(asc(salaryPayslip.payPeriod), asc(salaryPayslip.createdAt));

  const versions = new Map<string, number>();
  const latest = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    const key = `${row.employerName}:${row.payPeriod}`;
    versions.set(key, (versions.get(key) ?? 0) + 1);
    latest.set(key, row);
  }

  return [...latest.entries()].map(([key, row]) => ({
    ...row,
    versionCount: versions.get(key) ?? 1,
    baseSalary: numberValue(row.baseSalary),
    supplementalGross: numberValue(row.supplementalGross),
    grossPay: numberValue(row.grossPay),
    taxableWage: numberValue(row.taxableWage),
    wageTax: numberValue(row.wageTax),
    pensionContribution: numberValue(row.pensionContribution),
    socialInsurance: numberValue(row.socialInsurance),
    thirtyPercentAdjustment: numberValue(row.thirtyPercentAdjustment),
    thirtyPercentCompensation: numberValue(row.thirtyPercentCompensation),
    expenseReimbursements: numberValue(row.expenseReimbursements),
    netPay: numberValue(row.netPay),
    annualSalary: numberOrNull(row.annualSalary),
    partTimePercentage: numberOrNull(row.partTimePercentage),
    ytdTaxableWage: numberOrNull(row.ytdTaxableWage),
    ytdWageTax: numberOrNull(row.ytdWageTax),
    ytdNetPay: numberOrNull(row.ytdNetPay),
    ytdPension: numberOrNull(row.ytdPension),
  }));
}

export async function getSalaryPayslip(userId: string, payslipId: string) {
  const payslips = await getSalaryPayslips(userId);
  const payslip = payslips.find((item) => item.id === payslipId);
  if (!payslip) return null;
  const lineItems = await db
    .select({
      id: salaryLineItem.id,
      rowIndex: salaryLineItem.rowIndex,
      description: salaryLineItem.description,
      category: salaryLineItem.category,
      amount: salaryLineItem.amount,
      components: salaryLineItem.components,
      quantity: salaryLineItem.quantity,
      unit: salaryLineItem.unit,
    })
    .from(salaryLineItem)
    .where(and(eq(salaryLineItem.userId, userId), eq(salaryLineItem.payslipId, payslipId)))
    .orderBy(asc(salaryLineItem.rowIndex));
  return {
    ...payslip,
    lineItems: lineItems.map((item) => ({
      ...item,
      amount: numberValue(item.amount),
      quantity: numberOrNull(item.quantity),
    })),
  };
}

export async function getSalaryLineItemTotals(userId: string, payslipIds: string[]) {
  if (payslipIds.length === 0) return [];
  const rows = await db
    .select({
      payslipId: salaryLineItem.payslipId,
      description: salaryLineItem.description,
      category: salaryLineItem.category,
      amount: salaryLineItem.amount,
    })
    .from(salaryLineItem)
    .where(and(eq(salaryLineItem.userId, userId), inArray(salaryLineItem.payslipId, payslipIds)))
    .orderBy(desc(salaryLineItem.amount));
  const totals = new Map<string, { description: string; category: string; amount: number }>();
  for (const row of rows) {
    if (["net", "taxable_wage"].includes(row.category)) continue;
    const key = `${row.category}:${row.description}`;
    const current = totals.get(key);
    totals.set(key, {
      description: row.description,
      category: row.category,
      amount: (current?.amount ?? 0) + numberValue(row.amount),
    });
  }
  return [...totals.values()].sort((left, right) => Math.abs(right.amount) - Math.abs(left.amount));
}

export async function getSalaryExport(userId: string) {
  const [imports, payslips, lineItems] = await Promise.all([
    db
      .select({
        id: salaryImport.id,
        fileName: salaryImport.fileName,
        fileHash: salaryImport.fileHash,
        parserVersion: salaryImport.parserVersion,
        status: salaryImport.status,
        errorMessage: salaryImport.errorMessage,
        createdAt: salaryImport.createdAt,
        completedAt: salaryImport.completedAt,
      })
      .from(salaryImport)
      .where(eq(salaryImport.userId, userId))
      .orderBy(asc(salaryImport.createdAt)),
    db
      .select()
      .from(salaryPayslip)
      .where(eq(salaryPayslip.userId, userId))
      .orderBy(asc(salaryPayslip.payPeriod), asc(salaryPayslip.createdAt)),
    db
      .select()
      .from(salaryLineItem)
      .where(eq(salaryLineItem.userId, userId))
      .orderBy(asc(salaryLineItem.payslipId), asc(salaryLineItem.rowIndex)),
  ]);
  return { imports, payslips, lineItems };
}
