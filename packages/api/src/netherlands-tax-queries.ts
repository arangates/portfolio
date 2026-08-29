import "server-only";

import { db, familyMember, netherlandsTaxAssessment, netherlandsTaxImport } from "@portfolio/db";
import { and, asc, eq, isNull } from "drizzle-orm";

function numberValue(value: string) {
  return Number(value);
}

export async function getNetherlandsTaxpayerOptions(userId: string) {
  const members = await db
    .select({
      id: familyMember.id,
      name: familyMember.name,
      relationship: familyMember.relationship,
    })
    .from(familyMember)
    .where(and(eq(familyMember.userId, userId), isNull(familyMember.archivedAt)))
    .orderBy(asc(familyMember.createdAt));
  return [{ id: null, name: "Account owner", relationship: "self" }, ...members];
}

export async function getNetherlandsTaxAssessments(userId: string) {
  const rows = await db
    .select({
      id: netherlandsTaxAssessment.id,
      importId: netherlandsTaxAssessment.importId,
      taxpayerMemberId: netherlandsTaxAssessment.taxpayerMemberId,
      taxpayerName: familyMember.name,
      taxpayerRelationship: familyMember.relationship,
      taxYear: netherlandsTaxAssessment.taxYear,
      assessmentType: netherlandsTaxAssessment.assessmentType,
      assessmentDate: netherlandsTaxAssessment.assessmentDate,
      assessmentReferenceSuffix: netherlandsTaxAssessment.assessmentReferenceSuffix,
      outcomeType: netherlandsTaxAssessment.outcomeType,
      settlementAmount: netherlandsTaxAssessment.settlementAmount,
      payrollTaxWithheld: netherlandsTaxAssessment.payrollTaxWithheld,
      dividendGamingTaxWithheld: netherlandsTaxAssessment.dividendGamingTaxWithheld,
      provisionalRefunds: netherlandsTaxAssessment.provisionalRefunds,
      priorBalanceAdjustment: netherlandsTaxAssessment.priorBalanceAdjustment,
      taxInterest: netherlandsTaxAssessment.taxInterest,
      finalTaxAndSocialInsurance: netherlandsTaxAssessment.finalTaxAndSocialInsurance,
      box1TaxableIncome: netherlandsTaxAssessment.box1TaxableIncome,
      box1IncomeTax: netherlandsTaxAssessment.box1IncomeTax,
      box2TaxableIncome: netherlandsTaxAssessment.box2TaxableIncome,
      box2IncomeTax: netherlandsTaxAssessment.box2IncomeTax,
      box3TaxableIncome: netherlandsTaxAssessment.box3TaxableIncome,
      box3IncomeTax: netherlandsTaxAssessment.box3IncomeTax,
      socialInsuranceIncome: netherlandsTaxAssessment.socialInsuranceIncome,
      socialInsurancePremium: netherlandsTaxAssessment.socialInsurancePremium,
      generalTaxCredit: netherlandsTaxAssessment.generalTaxCredit,
      employmentTaxCredit: netherlandsTaxAssessment.employmentTaxCredit,
      totalTaxCredits: netherlandsTaxAssessment.totalTaxCredits,
      aggregateIncome: netherlandsTaxAssessment.aggregateIncome,
      validationStatus: netherlandsTaxAssessment.validationStatus,
      validationIssues: netherlandsTaxAssessment.validationIssues,
      createdAt: netherlandsTaxAssessment.createdAt,
    })
    .from(netherlandsTaxAssessment)
    .innerJoin(
      netherlandsTaxImport,
      and(
        eq(netherlandsTaxAssessment.importId, netherlandsTaxImport.id),
        eq(netherlandsTaxImport.userId, userId),
        eq(netherlandsTaxImport.status, "completed"),
      ),
    )
    .leftJoin(
      familyMember,
      and(
        eq(netherlandsTaxAssessment.taxpayerMemberId, familyMember.id),
        eq(familyMember.userId, userId),
      ),
    )
    .where(eq(netherlandsTaxAssessment.userId, userId))
    .orderBy(
      asc(netherlandsTaxAssessment.taxYear),
      asc(netherlandsTaxAssessment.assessmentDate),
      asc(netherlandsTaxAssessment.createdAt),
    );

  const versions = new Map<string, number>();
  const latest = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    const key = `${row.taxpayerMemberId ?? "owner"}:${row.taxYear}`;
    versions.set(key, (versions.get(key) ?? 0) + 1);
    latest.set(key, row);
  }
  return [...latest.entries()].map(([key, row]) => ({
    ...row,
    taxpayerName: row.taxpayerName ?? "Account owner",
    taxpayerRelationship: row.taxpayerRelationship ?? "self",
    versionCount: versions.get(key) ?? 1,
    settlementAmount: numberValue(row.settlementAmount),
    payrollTaxWithheld: numberValue(row.payrollTaxWithheld),
    dividendGamingTaxWithheld: numberValue(row.dividendGamingTaxWithheld),
    provisionalRefunds: numberValue(row.provisionalRefunds),
    priorBalanceAdjustment: numberValue(row.priorBalanceAdjustment),
    taxInterest: numberValue(row.taxInterest),
    finalTaxAndSocialInsurance: numberValue(row.finalTaxAndSocialInsurance),
    box1TaxableIncome: numberValue(row.box1TaxableIncome),
    box1IncomeTax: numberValue(row.box1IncomeTax),
    box2TaxableIncome: numberValue(row.box2TaxableIncome),
    box2IncomeTax: numberValue(row.box2IncomeTax),
    box3TaxableIncome: numberValue(row.box3TaxableIncome),
    box3IncomeTax: numberValue(row.box3IncomeTax),
    socialInsuranceIncome: numberValue(row.socialInsuranceIncome),
    socialInsurancePremium: numberValue(row.socialInsurancePremium),
    generalTaxCredit: numberValue(row.generalTaxCredit),
    employmentTaxCredit: numberValue(row.employmentTaxCredit),
    totalTaxCredits: numberValue(row.totalTaxCredits),
    aggregateIncome: numberValue(row.aggregateIncome),
  }));
}

export async function getNetherlandsTaxExport(userId: string) {
  const [imports, assessments] = await Promise.all([
    db
      .select()
      .from(netherlandsTaxImport)
      .where(eq(netherlandsTaxImport.userId, userId))
      .orderBy(asc(netherlandsTaxImport.createdAt)),
    db
      .select()
      .from(netherlandsTaxAssessment)
      .where(eq(netherlandsTaxAssessment.userId, userId))
      .orderBy(asc(netherlandsTaxAssessment.taxYear), asc(netherlandsTaxAssessment.createdAt)),
  ]);
  return { imports, assessments };
}
