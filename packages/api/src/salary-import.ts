import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { auditEvent, db, salaryImport, salaryLineItem, salaryPayslip } from "@portfolio/db";
import { and, desc, eq } from "drizzle-orm";

import { parseSalaryPayslip, SALARY_PARSER_VERSION } from "./salary-parser";

export type SalaryImportFile = {
  name: string;
  type: string;
  bytes: Uint8Array;
};

export type SalaryImportResult = {
  importId: string;
  duplicate: boolean;
  periodLabel: string;
  validationStatus: "verified" | "needs_review";
};

function hash(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

function isPdf(bytes: Uint8Array) {
  return new TextDecoder("ascii").decode(bytes.slice(0, 5)) === "%PDF-";
}

function storedFileName(payPeriod: string, revision: string | null) {
  return `Payslip ${payPeriod.slice(0, 7)}${revision ? ` R${revision}` : ""}.pdf`;
}

async function findImport(userId: string, fileHash: string) {
  const [existing] = await db
    .select()
    .from(salaryImport)
    .where(and(eq(salaryImport.userId, userId), eq(salaryImport.fileHash, fileHash)))
    .limit(1);
  return existing;
}

async function duplicateResult(userId: string, importId: string): Promise<SalaryImportResult> {
  const [payslip] = await db
    .select({
      periodLabel: salaryPayslip.periodLabel,
      validationStatus: salaryPayslip.validationStatus,
    })
    .from(salaryPayslip)
    .where(and(eq(salaryPayslip.userId, userId), eq(salaryPayslip.importId, importId)))
    .limit(1);
  return {
    importId,
    duplicate: true,
    periodLabel: payslip?.periodLabel ?? "Existing payslip",
    validationStatus: payslip?.validationStatus === "needs_review" ? "needs_review" : "verified",
  };
}

export async function processSalaryImport(input: {
  userId: string;
  file: SalaryImportFile;
}): Promise<SalaryImportResult> {
  if (!isPdf(input.file.bytes)) throw new Error("The selected file is not a valid PDF.");
  const fileHash = hash(input.file.bytes);
  const existing = await findImport(input.userId, fileHash);
  if (existing?.status === "completed") return duplicateResult(input.userId, existing.id);

  let parsed;
  try {
    parsed = await parseSalaryPayslip(input.file.bytes, input.file.name);
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "PDF parsing failed";
    if (existing) {
      await db
        .update(salaryImport)
        .set({ status: "failed", errorMessage: message, completedAt: new Date() })
        .where(and(eq(salaryImport.id, existing.id), eq(salaryImport.userId, input.userId)));
    } else {
      await db.insert(salaryImport).values({
        userId: input.userId,
        fileName: "Rejected payslip.pdf",
        fileHash,
        mimeType: "application/pdf",
        fileSize: input.file.bytes.byteLength,
        parserVersion: SALARY_PARSER_VERSION,
        status: "failed",
        errorMessage: message,
        completedAt: new Date(),
      });
    }
    throw error;
  }

  let savedImport = existing;
  if (savedImport) {
    await db
      .delete(salaryPayslip)
      .where(
        and(eq(salaryPayslip.importId, savedImport.id), eq(salaryPayslip.userId, input.userId)),
      );
    [savedImport] = await db
      .update(salaryImport)
      .set({
        fileName: storedFileName(parsed.payPeriod, parsed.revision),
        mimeType: "application/pdf",
        fileSize: input.file.bytes.byteLength,
        parserVersion: parsed.parserVersion,
        status: "processing",
        errorMessage: null,
        completedAt: null,
      })
      .where(and(eq(salaryImport.id, savedImport.id), eq(salaryImport.userId, input.userId)))
      .returning();
  } else {
    [savedImport] = await db
      .insert(salaryImport)
      .values({
        userId: input.userId,
        fileName: storedFileName(parsed.payPeriod, parsed.revision),
        fileHash,
        mimeType: "application/pdf",
        fileSize: input.file.bytes.byteLength,
        parserVersion: parsed.parserVersion,
      })
      .onConflictDoNothing()
      .returning();
    if (!savedImport) {
      const concurrent = await findImport(input.userId, fileHash);
      if (!concurrent) throw new Error("Could not create the salary import.");
      return duplicateResult(input.userId, concurrent.id);
    }
  }

  if (!savedImport) throw new Error("Could not prepare the salary import.");
  const payslipId = randomUUID();

  try {
    await db.batch([
      db.insert(salaryPayslip).values({
        id: payslipId,
        userId: input.userId,
        importId: savedImport.id,
        employerName: parsed.employerName,
        payPeriod: parsed.payPeriod,
        periodLabel: parsed.periodLabel,
        currency: parsed.currency,
        revision: parsed.revision,
        baseSalary: parsed.baseSalary.toString(),
        supplementalGross: parsed.supplementalGross.toString(),
        grossPay: parsed.grossPay.toString(),
        taxableWage: parsed.taxableWage.toString(),
        wageTax: parsed.wageTax.toString(),
        pensionContribution: parsed.pensionContribution.toString(),
        socialInsurance: parsed.socialInsurance.toString(),
        thirtyPercentAdjustment: parsed.thirtyPercentAdjustment.toString(),
        thirtyPercentCompensation: parsed.thirtyPercentCompensation.toString(),
        expenseReimbursements: parsed.expenseReimbursements.toString(),
        netPay: parsed.netPay.toString(),
        annualSalary: parsed.annualSalary?.toString() ?? null,
        partTimePercentage: parsed.partTimePercentage?.toString() ?? null,
        ytdTaxableWage: parsed.ytdTaxableWage?.toString() ?? null,
        ytdWageTax: parsed.ytdWageTax?.toString() ?? null,
        ytdNetPay: parsed.ytdNetPay?.toString() ?? null,
        ytdPension: parsed.ytdPension?.toString() ?? null,
        validationStatus: parsed.validationStatus,
        validationIssues: parsed.validationIssues,
      }),
      db.insert(salaryLineItem).values(
        parsed.lineItems.map((item) => ({
          userId: input.userId,
          payslipId,
          rowIndex: item.rowIndex,
          description: item.description,
          category: item.category,
          amount: item.amount.toString(),
          components: item.components,
          quantity: item.quantity?.toString() ?? null,
          unit: item.unit,
        })),
      ),
      db
        .update(salaryImport)
        .set({ status: "completed", completedAt: new Date(), errorMessage: null })
        .where(and(eq(salaryImport.id, savedImport.id), eq(salaryImport.userId, input.userId))),
      db.insert(auditEvent).values({
        userId: input.userId,
        action: "imported",
        entityType: "salary_payslip",
        entityId: payslipId,
        metadata: {
          period: parsed.payPeriod,
          parserVersion: parsed.parserVersion,
          validationStatus: parsed.validationStatus,
          rawPdfStored: false,
        },
      }),
    ]);
  } catch (error) {
    await db
      .update(salaryImport)
      .set({
        status: "failed",
        errorMessage: "The parsed payslip could not be saved.",
        completedAt: new Date(),
      })
      .where(and(eq(salaryImport.id, savedImport.id), eq(salaryImport.userId, input.userId)));
    throw error;
  }

  return {
    importId: savedImport.id,
    duplicate: false,
    periodLabel: parsed.periodLabel,
    validationStatus: parsed.validationStatus,
  };
}

export async function getRecentSalaryImports(userId: string) {
  return db
    .select({
      id: salaryImport.id,
      fileName: salaryImport.fileName,
      status: salaryImport.status,
      errorMessage: salaryImport.errorMessage,
      parserVersion: salaryImport.parserVersion,
      createdAt: salaryImport.createdAt,
      completedAt: salaryImport.completedAt,
    })
    .from(salaryImport)
    .where(eq(salaryImport.userId, userId))
    .orderBy(desc(salaryImport.createdAt))
    .limit(50);
}
