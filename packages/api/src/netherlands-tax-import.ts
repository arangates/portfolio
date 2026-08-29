import "server-only";

import { createHash, randomUUID } from "node:crypto";

import {
  auditEvent,
  db,
  familyMember,
  netherlandsTaxAssessment,
  netherlandsTaxImport,
} from "@portfolio/db";
import { and, desc, eq } from "drizzle-orm";

import {
  NETHERLANDS_TAX_PARSER_VERSION,
  parseNetherlandsTaxAssessment,
} from "./netherlands-tax-parser";

export type NetherlandsTaxImportFile = { name: string; type: string; bytes: Uint8Array };
export type NetherlandsTaxImportResult = {
  importId: string;
  duplicate: boolean;
  taxYear: number;
  assessmentType: string;
  outcomeType: string;
  settlementAmount: number;
  validationStatus: "verified" | "needs_review";
};

function hash(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

function isPdf(bytes: Uint8Array) {
  return new TextDecoder("ascii").decode(bytes.slice(0, 5)) === "%PDF-";
}

async function findImport(userId: string, fileHash: string) {
  const [existing] = await db
    .select()
    .from(netherlandsTaxImport)
    .where(
      and(eq(netherlandsTaxImport.userId, userId), eq(netherlandsTaxImport.fileHash, fileHash)),
    )
    .limit(1);
  return existing;
}

async function duplicateResult(
  userId: string,
  importId: string,
): Promise<NetherlandsTaxImportResult> {
  const [assessment] = await db
    .select({
      taxYear: netherlandsTaxAssessment.taxYear,
      assessmentType: netherlandsTaxAssessment.assessmentType,
      outcomeType: netherlandsTaxAssessment.outcomeType,
      settlementAmount: netherlandsTaxAssessment.settlementAmount,
      validationStatus: netherlandsTaxAssessment.validationStatus,
    })
    .from(netherlandsTaxAssessment)
    .where(
      and(
        eq(netherlandsTaxAssessment.userId, userId),
        eq(netherlandsTaxAssessment.importId, importId),
      ),
    )
    .limit(1);
  return {
    importId,
    duplicate: true,
    taxYear: assessment?.taxYear ?? 0,
    assessmentType: assessment?.assessmentType ?? "final",
    outcomeType: assessment?.outcomeType ?? "zero",
    settlementAmount: Number(assessment?.settlementAmount ?? 0),
    validationStatus: assessment?.validationStatus === "needs_review" ? "needs_review" : "verified",
  };
}

async function verifyTaxpayerMember(userId: string, taxpayerMemberId: string | null) {
  if (!taxpayerMemberId) return;
  const [member] = await db
    .select({ id: familyMember.id })
    .from(familyMember)
    .where(and(eq(familyMember.id, taxpayerMemberId), eq(familyMember.userId, userId)))
    .limit(1);
  if (!member) throw new Error("The selected taxpayer does not belong to this account.");
}

export async function processNetherlandsTaxImport(input: {
  userId: string;
  taxpayerMemberId: string | null;
  file: NetherlandsTaxImportFile;
}): Promise<NetherlandsTaxImportResult> {
  if (!isPdf(input.file.bytes)) throw new Error("The selected file is not a valid PDF.");
  await verifyTaxpayerMember(input.userId, input.taxpayerMemberId);
  const fileSize = input.file.bytes.byteLength;
  const fileHash = hash(input.file.bytes);
  const existing = await findImport(input.userId, fileHash);
  if (existing?.status === "completed") return duplicateResult(input.userId, existing.id);

  let parsed;
  try {
    parsed = await parseNetherlandsTaxAssessment(input.file.bytes, input.file.name);
  } catch (error) {
    const message =
      error instanceof Error ? error.message.slice(0, 500) : "Assessment parsing failed";
    if (existing) {
      await db
        .update(netherlandsTaxImport)
        .set({ status: "failed", errorMessage: message, completedAt: new Date() })
        .where(
          and(
            eq(netherlandsTaxImport.id, existing.id),
            eq(netherlandsTaxImport.userId, input.userId),
          ),
        );
    } else {
      await db.insert(netherlandsTaxImport).values({
        userId: input.userId,
        fileName: "Rejected Dutch tax assessment.pdf",
        fileHash,
        mimeType: "application/pdf",
        fileSize,
        parserVersion: NETHERLANDS_TAX_PARSER_VERSION,
        status: "failed",
        errorMessage: message,
        completedAt: new Date(),
      });
    }
    throw error;
  }

  const safeFileName = `Netherlands final tax assessment ${parsed.taxYear}.pdf`;
  let savedImport = existing;
  if (savedImport) {
    await db
      .delete(netherlandsTaxAssessment)
      .where(
        and(
          eq(netherlandsTaxAssessment.importId, savedImport.id),
          eq(netherlandsTaxAssessment.userId, input.userId),
        ),
      );
    [savedImport] = await db
      .update(netherlandsTaxImport)
      .set({
        fileName: safeFileName,
        mimeType: "application/pdf",
        fileSize,
        parserVersion: parsed.parserVersion,
        status: "processing",
        errorMessage: null,
        completedAt: null,
      })
      .where(
        and(
          eq(netherlandsTaxImport.id, savedImport.id),
          eq(netherlandsTaxImport.userId, input.userId),
        ),
      )
      .returning();
  } else {
    [savedImport] = await db
      .insert(netherlandsTaxImport)
      .values({
        userId: input.userId,
        fileName: safeFileName,
        fileHash,
        mimeType: "application/pdf",
        fileSize,
        parserVersion: parsed.parserVersion,
      })
      .onConflictDoNothing()
      .returning();
    if (!savedImport) {
      const concurrent = await findImport(input.userId, fileHash);
      if (!concurrent) throw new Error("Could not create the Dutch tax import.");
      return duplicateResult(input.userId, concurrent.id);
    }
  }
  if (!savedImport) throw new Error("Could not prepare the Dutch tax import.");

  const assessmentId = randomUUID();
  const amounts = {
    settlementAmount: parsed.settlementAmount.toString(),
    payrollTaxWithheld: parsed.payrollTaxWithheld.toString(),
    dividendGamingTaxWithheld: parsed.dividendGamingTaxWithheld.toString(),
    provisionalRefunds: parsed.provisionalRefunds.toString(),
    priorBalanceAdjustment: parsed.priorBalanceAdjustment.toString(),
    taxInterest: parsed.taxInterest.toString(),
    finalTaxAndSocialInsurance: parsed.finalTaxAndSocialInsurance.toString(),
    box1TaxableIncome: parsed.box1TaxableIncome.toString(),
    box1IncomeTax: parsed.box1IncomeTax.toString(),
    box2TaxableIncome: parsed.box2TaxableIncome.toString(),
    box2IncomeTax: parsed.box2IncomeTax.toString(),
    box3TaxableIncome: parsed.box3TaxableIncome.toString(),
    box3IncomeTax: parsed.box3IncomeTax.toString(),
    socialInsuranceIncome: parsed.socialInsuranceIncome.toString(),
    socialInsurancePremium: parsed.socialInsurancePremium.toString(),
    generalTaxCredit: parsed.generalTaxCredit.toString(),
    employmentTaxCredit: parsed.employmentTaxCredit.toString(),
    totalTaxCredits: parsed.totalTaxCredits.toString(),
    aggregateIncome: parsed.aggregateIncome.toString(),
  };

  try {
    await db.batch([
      db.insert(netherlandsTaxAssessment).values({
        id: assessmentId,
        userId: input.userId,
        importId: savedImport.id,
        taxpayerMemberId: input.taxpayerMemberId,
        taxYear: parsed.taxYear,
        assessmentType: parsed.assessmentType,
        assessmentDate: parsed.assessmentDate,
        assessmentReferenceSuffix: parsed.assessmentReferenceSuffix,
        outcomeType: parsed.outcomeType,
        ...amounts,
        validationStatus: parsed.validationStatus,
        validationIssues: parsed.validationIssues,
      }),
      db
        .update(netherlandsTaxImport)
        .set({ status: "completed", completedAt: new Date(), errorMessage: null })
        .where(
          and(
            eq(netherlandsTaxImport.id, savedImport.id),
            eq(netherlandsTaxImport.userId, input.userId),
          ),
        ),
      db.insert(auditEvent).values({
        userId: input.userId,
        action: "imported",
        entityType: "netherlands_tax_assessment",
        entityId: assessmentId,
        metadata: {
          taxYear: parsed.taxYear,
          assessmentType: parsed.assessmentType,
          parserVersion: parsed.parserVersion,
          validationStatus: parsed.validationStatus,
          rawPdfStored: false,
        },
      }),
    ]);
  } catch (error) {
    await db
      .update(netherlandsTaxImport)
      .set({
        status: "failed",
        errorMessage: "The parsed assessment could not be saved.",
        completedAt: new Date(),
      })
      .where(
        and(
          eq(netherlandsTaxImport.id, savedImport.id),
          eq(netherlandsTaxImport.userId, input.userId),
        ),
      );
    throw error;
  }

  return {
    importId: savedImport.id,
    duplicate: false,
    taxYear: parsed.taxYear,
    assessmentType: parsed.assessmentType,
    outcomeType: parsed.outcomeType,
    settlementAmount: parsed.settlementAmount,
    validationStatus: parsed.validationStatus,
  };
}

export async function getRecentNetherlandsTaxImports(userId: string) {
  return db
    .select({
      id: netherlandsTaxImport.id,
      fileName: netherlandsTaxImport.fileName,
      status: netherlandsTaxImport.status,
      errorMessage: netherlandsTaxImport.errorMessage,
      createdAt: netherlandsTaxImport.createdAt,
      completedAt: netherlandsTaxImport.completedAt,
    })
    .from(netherlandsTaxImport)
    .where(eq(netherlandsTaxImport.userId, userId))
    .orderBy(desc(netherlandsTaxImport.createdAt))
    .limit(50);
}
