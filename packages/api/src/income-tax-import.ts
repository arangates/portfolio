import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { auditEvent, db, incomeTaxImport, incomeTaxReturn } from "@portfolio/db";
import { and, desc, eq } from "drizzle-orm";

import { INDIA_ITR_PARSER_VERSION, parseIndiaItrJson } from "./income-tax-parser";

export type IncomeTaxImportFile = { name: string; type: string; bytes: Uint8Array };

export type IncomeTaxImportResult = {
  importId: string;
  duplicate: boolean;
  assessmentYearLabel: string;
  formType: string;
  validationStatus: "verified" | "needs_review";
};

function hash(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function findImport(userId: string, fileHash: string) {
  const [existing] = await db
    .select()
    .from(incomeTaxImport)
    .where(and(eq(incomeTaxImport.userId, userId), eq(incomeTaxImport.fileHash, fileHash)))
    .limit(1);
  return existing;
}

async function duplicateResult(userId: string, importId: string): Promise<IncomeTaxImportResult> {
  const [filing] = await db
    .select({
      assessmentYearLabel: incomeTaxReturn.assessmentYearLabel,
      formType: incomeTaxReturn.formType,
      validationStatus: incomeTaxReturn.validationStatus,
    })
    .from(incomeTaxReturn)
    .where(and(eq(incomeTaxReturn.userId, userId), eq(incomeTaxReturn.importId, importId)))
    .limit(1);
  return {
    importId,
    duplicate: true,
    assessmentYearLabel: filing?.assessmentYearLabel ?? "Existing year",
    formType: filing?.formType ?? "ITR",
    validationStatus: filing?.validationStatus === "needs_review" ? "needs_review" : "verified",
  };
}

export async function processIncomeTaxImport(input: {
  userId: string;
  file: IncomeTaxImportFile;
}): Promise<IncomeTaxImportResult> {
  const fileHash = hash(input.file.bytes);
  const existing = await findImport(input.userId, fileHash);
  if (existing?.status === "completed") return duplicateResult(input.userId, existing.id);

  let parsed;
  try {
    parsed = parseIndiaItrJson(input.file.bytes, input.file.name);
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "ITR parsing failed";
    if (existing) {
      await db
        .update(incomeTaxImport)
        .set({ status: "failed", errorMessage: message, completedAt: new Date() })
        .where(and(eq(incomeTaxImport.id, existing.id), eq(incomeTaxImport.userId, input.userId)));
    } else {
      await db.insert(incomeTaxImport).values({
        userId: input.userId,
        fileName: "Rejected ITR.json",
        fileHash,
        mimeType: "application/json",
        fileSize: input.file.bytes.byteLength,
        parserVersion: INDIA_ITR_PARSER_VERSION,
        status: "failed",
        errorMessage: message,
        completedAt: new Date(),
      });
    }
    throw error;
  }

  const safeFileName = `ITR AY ${parsed.assessmentYearLabel} ${parsed.formType}.json`;
  let savedImport = existing;
  if (savedImport) {
    await db
      .delete(incomeTaxReturn)
      .where(
        and(eq(incomeTaxReturn.importId, savedImport.id), eq(incomeTaxReturn.userId, input.userId)),
      );
    [savedImport] = await db
      .update(incomeTaxImport)
      .set({
        fileName: safeFileName,
        mimeType: "application/json",
        fileSize: input.file.bytes.byteLength,
        parserVersion: parsed.parserVersion,
        status: "processing",
        errorMessage: null,
        completedAt: null,
      })
      .where(and(eq(incomeTaxImport.id, savedImport.id), eq(incomeTaxImport.userId, input.userId)))
      .returning();
  } else {
    [savedImport] = await db
      .insert(incomeTaxImport)
      .values({
        userId: input.userId,
        fileName: safeFileName,
        fileHash,
        mimeType: "application/json",
        fileSize: input.file.bytes.byteLength,
        parserVersion: parsed.parserVersion,
      })
      .onConflictDoNothing()
      .returning();
    if (!savedImport) {
      const concurrent = await findImport(input.userId, fileHash);
      if (!concurrent) throw new Error("Could not create the ITR import.");
      return duplicateResult(input.userId, concurrent.id);
    }
  }

  if (!savedImport) throw new Error("Could not prepare the ITR import.");
  const returnId = randomUUID();
  try {
    await db.batch([
      db.insert(incomeTaxReturn).values({
        id: returnId,
        userId: input.userId,
        importId: savedImport.id,
        assessmentYearStart: parsed.assessmentYearStart,
        assessmentYearLabel: parsed.assessmentYearLabel,
        financialYearLabel: parsed.financialYearLabel,
        formType: parsed.formType,
        schemaVersion: parsed.schemaVersion,
        formVersion: parsed.formVersion,
        sourceCreatedOn: parsed.sourceCreatedOn,
        acknowledgementNumber: parsed.acknowledgementNumber,
        filingSection: parsed.filingSection,
        residentialStatus: parsed.residentialStatus,
        taxRegime: parsed.taxRegime,
        salaryIncome: parsed.salaryIncome.toString(),
        housePropertyIncome: parsed.housePropertyIncome.toString(),
        businessIncome: parsed.businessIncome.toString(),
        capitalGains: parsed.capitalGains.toString(),
        otherSourcesIncome: parsed.otherSourcesIncome.toString(),
        grossTotalIncome: parsed.grossTotalIncome.toString(),
        chapterViDeductions: parsed.chapterViDeductions.toString(),
        totalIncome: parsed.totalIncome.toString(),
        netTaxLiability: parsed.netTaxLiability.toString(),
        interestAndFees: parsed.interestAndFees.toString(),
        aggregateTaxLiability: parsed.aggregateTaxLiability.toString(),
        advanceTax: parsed.advanceTax.toString(),
        tds: parsed.tds.toString(),
        tcs: parsed.tcs.toString(),
        selfAssessmentTax: parsed.selfAssessmentTax.toString(),
        totalTaxesPaid: parsed.totalTaxesPaid.toString(),
        balanceTaxPayable: parsed.balanceTaxPayable.toString(),
        refundDue: parsed.refundDue.toString(),
        validationStatus: parsed.validationStatus,
        validationIssues: parsed.validationIssues,
      }),
      db
        .update(incomeTaxImport)
        .set({ status: "completed", completedAt: new Date(), errorMessage: null })
        .where(
          and(eq(incomeTaxImport.id, savedImport.id), eq(incomeTaxImport.userId, input.userId)),
        ),
      db.insert(auditEvent).values({
        userId: input.userId,
        action: "imported",
        entityType: "income_tax_return",
        entityId: returnId,
        metadata: {
          assessmentYear: parsed.assessmentYearLabel,
          formType: parsed.formType,
          parserVersion: parsed.parserVersion,
          validationStatus: parsed.validationStatus,
          rawJsonStored: false,
        },
      }),
    ]);
  } catch (error) {
    await db
      .update(incomeTaxImport)
      .set({
        status: "failed",
        errorMessage: "The parsed ITR could not be saved.",
        completedAt: new Date(),
      })
      .where(and(eq(incomeTaxImport.id, savedImport.id), eq(incomeTaxImport.userId, input.userId)));
    throw error;
  }

  return {
    importId: savedImport.id,
    duplicate: false,
    assessmentYearLabel: parsed.assessmentYearLabel,
    formType: parsed.formType,
    validationStatus: parsed.validationStatus,
  };
}

export async function getRecentIncomeTaxImports(userId: string) {
  return db
    .select({
      id: incomeTaxImport.id,
      fileName: incomeTaxImport.fileName,
      status: incomeTaxImport.status,
      errorMessage: incomeTaxImport.errorMessage,
      parserVersion: incomeTaxImport.parserVersion,
      createdAt: incomeTaxImport.createdAt,
      completedAt: incomeTaxImport.completedAt,
    })
    .from(incomeTaxImport)
    .where(eq(incomeTaxImport.userId, userId))
    .orderBy(desc(incomeTaxImport.createdAt))
    .limit(50);
}
