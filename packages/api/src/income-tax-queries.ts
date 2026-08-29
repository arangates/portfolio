import "server-only";

import { db, incomeTaxImport, incomeTaxReturn } from "@portfolio/db";
import { and, asc, eq } from "drizzle-orm";

function numberValue(value: string) {
  return Number(value);
}

function acknowledgementLast4(value: string | null) {
  return value ? value.slice(-4) : null;
}

export async function getIncomeTaxReturns(userId: string) {
  const rows = await db
    .select({
      id: incomeTaxReturn.id,
      importId: incomeTaxReturn.importId,
      assessmentYearStart: incomeTaxReturn.assessmentYearStart,
      assessmentYearLabel: incomeTaxReturn.assessmentYearLabel,
      financialYearLabel: incomeTaxReturn.financialYearLabel,
      formType: incomeTaxReturn.formType,
      sourceCreatedOn: incomeTaxReturn.sourceCreatedOn,
      acknowledgementNumber: incomeTaxReturn.acknowledgementNumber,
      filingSection: incomeTaxReturn.filingSection,
      residentialStatus: incomeTaxReturn.residentialStatus,
      taxRegime: incomeTaxReturn.taxRegime,
      salaryIncome: incomeTaxReturn.salaryIncome,
      housePropertyIncome: incomeTaxReturn.housePropertyIncome,
      businessIncome: incomeTaxReturn.businessIncome,
      capitalGains: incomeTaxReturn.capitalGains,
      otherSourcesIncome: incomeTaxReturn.otherSourcesIncome,
      grossTotalIncome: incomeTaxReturn.grossTotalIncome,
      chapterViDeductions: incomeTaxReturn.chapterViDeductions,
      totalIncome: incomeTaxReturn.totalIncome,
      netTaxLiability: incomeTaxReturn.netTaxLiability,
      interestAndFees: incomeTaxReturn.interestAndFees,
      aggregateTaxLiability: incomeTaxReturn.aggregateTaxLiability,
      advanceTax: incomeTaxReturn.advanceTax,
      tds: incomeTaxReturn.tds,
      tcs: incomeTaxReturn.tcs,
      selfAssessmentTax: incomeTaxReturn.selfAssessmentTax,
      totalTaxesPaid: incomeTaxReturn.totalTaxesPaid,
      balanceTaxPayable: incomeTaxReturn.balanceTaxPayable,
      refundDue: incomeTaxReturn.refundDue,
      validationStatus: incomeTaxReturn.validationStatus,
      validationIssues: incomeTaxReturn.validationIssues,
      createdAt: incomeTaxReturn.createdAt,
    })
    .from(incomeTaxReturn)
    .innerJoin(
      incomeTaxImport,
      and(
        eq(incomeTaxReturn.importId, incomeTaxImport.id),
        eq(incomeTaxImport.userId, userId),
        eq(incomeTaxImport.status, "completed"),
      ),
    )
    .where(eq(incomeTaxReturn.userId, userId))
    .orderBy(asc(incomeTaxReturn.assessmentYearStart), asc(incomeTaxReturn.createdAt));

  const versions = new Map<number, number>();
  const latest = new Map<number, (typeof rows)[number]>();
  for (const row of rows) {
    versions.set(row.assessmentYearStart, (versions.get(row.assessmentYearStart) ?? 0) + 1);
    const current = latest.get(row.assessmentYearStart);
    const currentDate = current?.sourceCreatedOn ?? current?.createdAt.toISOString() ?? "";
    const rowDate = row.sourceCreatedOn ?? row.createdAt.toISOString();
    if (!current || rowDate >= currentDate) latest.set(row.assessmentYearStart, row);
  }

  return [...latest.values()].map((row) => ({
    ...row,
    acknowledgementNumber: undefined,
    acknowledgementLast4: acknowledgementLast4(row.acknowledgementNumber),
    versionCount: versions.get(row.assessmentYearStart) ?? 1,
    salaryIncome: numberValue(row.salaryIncome),
    housePropertyIncome: numberValue(row.housePropertyIncome),
    businessIncome: numberValue(row.businessIncome),
    capitalGains: numberValue(row.capitalGains),
    otherSourcesIncome: numberValue(row.otherSourcesIncome),
    grossTotalIncome: numberValue(row.grossTotalIncome),
    chapterViDeductions: numberValue(row.chapterViDeductions),
    totalIncome: numberValue(row.totalIncome),
    netTaxLiability: numberValue(row.netTaxLiability),
    interestAndFees: numberValue(row.interestAndFees),
    aggregateTaxLiability: numberValue(row.aggregateTaxLiability),
    advanceTax: numberValue(row.advanceTax),
    tds: numberValue(row.tds),
    tcs: numberValue(row.tcs),
    selfAssessmentTax: numberValue(row.selfAssessmentTax),
    totalTaxesPaid: numberValue(row.totalTaxesPaid),
    balanceTaxPayable: numberValue(row.balanceTaxPayable),
    refundDue: numberValue(row.refundDue),
  }));
}

export async function getIncomeTaxExport(userId: string) {
  const [imports, returns] = await Promise.all([
    db
      .select()
      .from(incomeTaxImport)
      .where(eq(incomeTaxImport.userId, userId))
      .orderBy(asc(incomeTaxImport.createdAt)),
    db
      .select()
      .from(incomeTaxReturn)
      .where(eq(incomeTaxReturn.userId, userId))
      .orderBy(asc(incomeTaxReturn.assessmentYearStart), asc(incomeTaxReturn.createdAt)),
  ]);
  return { imports, returns };
}
