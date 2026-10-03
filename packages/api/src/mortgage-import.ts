import "server-only";

import { createHash } from "node:crypto";

import { auditEvent, db, mortgageImport, mortgageOverview } from "@portfolio/db";
import { and, eq } from "drizzle-orm";

import type { MortgageTerms } from "./mortgage-calculations";
import { findOrCreateMortgageLoan, upsertMortgageOverview } from "./mortgage-mutations";
import { MORTGAGE_PARSER_VERSION, parseMortgageOverview } from "./mortgage-parser";

export type MortgageImportFile = { name: string; type: string; bytes: Uint8Array };
export type MortgageImportResult = {
  importId: string;
  duplicate: boolean;
  loanNumber: string;
  asOf: string;
  currentBalance: number;
  validationStatus: "verified" | "needs_review";
};

const hash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const isPdf = (bytes: Uint8Array) => new TextDecoder("ascii").decode(bytes.slice(0, 5)) === "%PDF-";

async function findImport(userId: string, fileHash: string) {
  const [existing] = await db
    .select()
    .from(mortgageImport)
    .where(and(eq(mortgageImport.userId, userId), eq(mortgageImport.fileHash, fileHash)))
    .limit(1);
  return existing;
}

async function duplicateResult(userId: string, importId: string): Promise<MortgageImportResult> {
  const [overview] = await db
    .select({
      asOf: mortgageOverview.asOf,
      currentBalance: mortgageOverview.currentBalance,
      validationStatus: mortgageOverview.validationStatus,
    })
    .from(mortgageOverview)
    .where(and(eq(mortgageOverview.userId, userId), eq(mortgageOverview.importId, importId)))
    .limit(1);
  return {
    importId,
    duplicate: true,
    loanNumber: "",
    asOf: overview?.asOf ?? "",
    currentBalance: Number(overview?.currentBalance ?? 0),
    validationStatus: overview?.validationStatus === "needs_review" ? "needs_review" : "verified",
  };
}

export async function processMortgageImport(input: {
  userId: string;
  file: MortgageImportFile;
}): Promise<MortgageImportResult> {
  if (!isPdf(input.file.bytes)) throw new Error("The selected file is not a valid PDF.");
  const fileSize = input.file.bytes.byteLength;
  const fileHash = hash(input.file.bytes);
  const existing = await findImport(input.userId, fileHash);
  if (existing?.status === "completed") return duplicateResult(input.userId, existing.id);

  let parsed;
  try {
    parsed = await parseMortgageOverview(input.file.bytes);
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Parsing failed";
    if (existing) {
      await db
        .update(mortgageImport)
        .set({ status: "failed", errorMessage: message, completedAt: new Date() })
        .where(and(eq(mortgageImport.id, existing.id), eq(mortgageImport.userId, input.userId)));
    } else {
      await db.insert(mortgageImport).values({
        userId: input.userId,
        fileName: "Rejected mortgage overview.pdf",
        fileHash,
        mimeType: "application/pdf",
        fileSize,
        parserVersion: MORTGAGE_PARSER_VERSION,
        status: "failed",
        errorMessage: message,
        completedAt: new Date(),
      });
    }
    throw error;
  }

  const safeFileName = `Mortgage overview ${parsed.asOf}.pdf`;
  let savedImport = existing;
  if (savedImport) {
    [savedImport] = await db
      .update(mortgageImport)
      .set({
        fileName: safeFileName,
        fileSize,
        parserVersion: parsed.parserVersion,
        status: "processing",
        errorMessage: null,
        completedAt: null,
      })
      .where(and(eq(mortgageImport.id, savedImport.id), eq(mortgageImport.userId, input.userId)))
      .returning();
  } else {
    [savedImport] = await db
      .insert(mortgageImport)
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
      if (!concurrent) throw new Error("Could not create the mortgage import.");
      return duplicateResult(input.userId, concurrent.id);
    }
  }
  if (!savedImport) throw new Error("Could not prepare the mortgage import.");

  const terms: MortgageTerms = {
    originalAmount: parsed.originalAmount,
    currentBalance: parsed.currentBalance,
    monthlyPayment: parsed.monthlyPayment,
    statedRate: parsed.statedRate,
    discount: parsed.discount,
    startDate: parsed.startDate,
    firstPaymentDate: parsed.firstPaymentDate,
    endDate: parsed.endDate,
    fixedRateEndDate: parsed.fixedRateEndDate,
    asOf: parsed.asOf,
    propertyValue: parsed.propertyValue ?? 0,
    valuationDate: parsed.valuationDate ?? parsed.asOf,
    freeRepaymentAllowance: parsed.freeRepaymentAllowance ?? 0,
    registrationAmount: parsed.registrationAmount ?? 0,
  };

  try {
    const loan = await findOrCreateMortgageLoan(input.userId, parsed.loanNumber, parsed.lender);
    const overviewId = await upsertMortgageOverview(input.userId, loan.id, {
      terms,
      source: "import",
      importId: savedImport.id,
      repaymentType: parsed.repaymentType,
      sustainabilityDiscount: parsed.sustainabilityDiscount,
      energyLabel: parsed.energyLabel,
      nhg: parsed.nhg,
      bouwdepotOriginal: parsed.bouwdepotOriginal,
      bouwdepotRemaining: parsed.bouwdepotRemaining,
      validationStatus: parsed.validationStatus,
      validationIssues: parsed.validationIssues,
    });
    await Promise.all([
      db
        .update(mortgageImport)
        .set({ status: "completed", completedAt: new Date(), errorMessage: null })
        .where(and(eq(mortgageImport.id, savedImport.id), eq(mortgageImport.userId, input.userId))),
      db.insert(auditEvent).values({
        userId: input.userId,
        action: "imported",
        entityType: "mortgage_overview",
        entityId: overviewId,
        metadata: {
          asOf: parsed.asOf,
          parserVersion: parsed.parserVersion,
          validationStatus: parsed.validationStatus,
          rawPdfStored: false,
        },
      }),
    ]);
  } catch (error) {
    await db
      .update(mortgageImport)
      .set({
        status: "failed",
        errorMessage: "The parsed mortgage overview could not be saved.",
        completedAt: new Date(),
      })
      .where(and(eq(mortgageImport.id, savedImport.id), eq(mortgageImport.userId, input.userId)));
    throw error;
  }

  return {
    importId: savedImport.id,
    duplicate: false,
    loanNumber: parsed.loanNumber,
    asOf: parsed.asOf,
    currentBalance: parsed.currentBalance,
    validationStatus: parsed.validationStatus,
  };
}
