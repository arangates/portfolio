import "server-only";

import { createHash } from "node:crypto";

import {
  auditEvent,
  bankAccount,
  bankBalanceSnapshot,
  bankStatementImport,
  bankTransaction,
  db,
} from "@portfolio/db";
import { and, desc, eq } from "drizzle-orm";

import { BANK_STATEMENT_PARSER_VERSION, parseBankStatement } from "./bank-statement-parser";

export type BankStatementImportFile = { name: string; type: string; bytes: Uint8Array };

function hash(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

function atNoon(value: string | null) {
  return value ? new Date(`${value}T12:00:00Z`) : null;
}

export async function processBankStatementImport(input: {
  userId: string;
  ownershipType: "personal" | "joint";
  file: BankStatementImportFile;
}) {
  const fileHash = hash(input.file.bytes);
  const [existing] = await db
    .select()
    .from(bankStatementImport)
    .where(
      and(eq(bankStatementImport.userId, input.userId), eq(bankStatementImport.fileHash, fileHash)),
    )
    .limit(1);
  if (existing?.status === "completed") {
    const institution = existing.provider === "abn_amro" ? "ABN AMRO" : "ING";
    await db
      .update(bankAccount)
      .set({
        ownershipType: input.ownershipType,
        accountType: `${input.ownershipType === "joint" ? "Joint" : "Personal"} current account`,
        name: `${institution} ${input.ownershipType}`,
      })
      .where(and(eq(bankAccount.id, existing.accountId), eq(bankAccount.userId, input.userId)));
    return {
      importId: existing.id,
      duplicate: true,
      provider: existing.provider,
      insertedRows: existing.insertedRows,
      skippedRows: existing.skippedRows,
      validationStatus: existing.validationStatus,
    };
  }

  const parsed = await parseBankStatement(input.file.bytes, input.file.name);
  parsed.ownershipType = input.ownershipType;
  parsed.accountName = `${parsed.institution} ${input.ownershipType}`;
  parsed.accountType = `${input.ownershipType === "joint" ? "Joint" : "Personal"} current account`;
  let [account] = await db
    .select()
    .from(bankAccount)
    .where(
      and(
        eq(bankAccount.userId, input.userId),
        eq(bankAccount.accountFingerprint, parsed.accountFingerprint),
      ),
    )
    .limit(1);
  if (!account) {
    [account] = await db
      .insert(bankAccount)
      .values({
        userId: input.userId,
        institution: parsed.institution,
        name: parsed.accountName,
        accountType: parsed.accountType,
        accountLast4: parsed.accountLast4,
        ownershipType: parsed.ownershipType,
        accountFingerprint: parsed.accountFingerprint,
        currency: parsed.currency,
        notes:
          parsed.ownershipType === "joint"
            ? "Joint household account. Cash flow is shown in full and is not automatically divided between account holders."
            : "Imported personal current account.",
      })
      .returning();
  } else if (account.ownershipType !== input.ownershipType) {
    [account] = await db
      .update(bankAccount)
      .set({
        ownershipType: input.ownershipType,
        accountType: parsed.accountType,
        name: parsed.accountName,
      })
      .where(and(eq(bankAccount.id, account.id), eq(bankAccount.userId, input.userId)))
      .returning();
  }
  if (!account) throw new Error("Could not create the bank account.");

  const safeName = `${parsed.institution} statement ${parsed.periodEnd ?? parsed.periodStart ?? "import"}.${parsed.provider === "ing" ? "csv" : "pdf"}`;
  let saved = existing;
  if (!saved) {
    [saved] = await db
      .insert(bankStatementImport)
      .values({
        userId: input.userId,
        accountId: account.id,
        provider: parsed.provider,
        fileName: safeName,
        fileHash,
        mimeType: parsed.provider === "ing" ? "text/csv" : "application/pdf",
        fileSize: input.file.bytes.byteLength,
        parserVersion: BANK_STATEMENT_PARSER_VERSION,
        periodStart: atNoon(parsed.periodStart),
        periodEnd: atNoon(parsed.periodEnd),
        openingBalance: parsed.openingBalance?.toString() ?? null,
        closingBalance: parsed.closingBalance?.toString() ?? null,
        debitTotal: parsed.debitTotal.toString(),
        creditTotal: parsed.creditTotal.toString(),
        rowCount: parsed.transactions.length,
        validationStatus: parsed.validationStatus,
        validationIssues: parsed.validationIssues,
      })
      .returning();
  }
  if (!saved) throw new Error("Could not prepare the bank statement import.");

  if (saved.status !== "processing" || saved.parserVersion !== BANK_STATEMENT_PARSER_VERSION) {
    await db
      .update(bankStatementImport)
      .set({
        status: "processing",
        parserVersion: BANK_STATEMENT_PARSER_VERSION,
        errorMessage: null,
        completedAt: null,
      })
      .where(
        and(eq(bankStatementImport.id, saved.id), eq(bankStatementImport.userId, input.userId)),
      );
  }

  let insertedRows = 0;
  try {
    for (let offset = 0; offset < parsed.transactions.length; offset += 200) {
      const inserted = await db
        .insert(bankTransaction)
        .values(
          parsed.transactions.slice(offset, offset + 200).map((row) => ({
            userId: input.userId,
            accountId: account.id,
            importId: saved!.id,
            transactionHash: row.transactionHash,
            bookedAt: atNoon(row.bookedAt)!,
            valueAt: atNoon(row.valueAt),
            amount: row.amount.toString(),
            currency: row.currency,
            name: row.name,
            description: row.description,
            transactionType: row.transactionType,
            providerCode: row.providerCode,
            counterpartyName: row.counterpartyName,
            counterpartyAccountLast4: row.counterpartyAccountLast4,
            category: row.category,
            categoryConfidence: row.categoryConfidence.toString(),
          })),
        )
        .onConflictDoNothing()
        .returning({ id: bankTransaction.id });
      insertedRows += inserted.length;
    }
    const skippedRows = parsed.transactions.length - insertedRows;
    if (parsed.closingBalance !== null && parsed.periodEnd) {
      await db
        .insert(bankBalanceSnapshot)
        .values({
          userId: input.userId,
          accountId: account.id,
          asOf: atNoon(parsed.periodEnd)!,
          amount: parsed.closingBalance.toString(),
        })
        .onConflictDoUpdate({
          target: [bankBalanceSnapshot.accountId, bankBalanceSnapshot.asOf],
          set: { amount: parsed.closingBalance.toString() },
        });
    }
    await db.batch([
      db
        .update(bankStatementImport)
        .set({
          status: "completed",
          insertedRows,
          skippedRows,
          errorMessage: null,
          completedAt: new Date(),
        })
        .where(
          and(eq(bankStatementImport.id, saved.id), eq(bankStatementImport.userId, input.userId)),
        ),
      db.insert(auditEvent).values({
        userId: input.userId,
        action: "imported",
        entityType: "bank_statement",
        entityId: saved.id,
        metadata: {
          provider: parsed.provider,
          rowCount: parsed.transactions.length,
          insertedRows,
          skippedRows,
          validationStatus: parsed.validationStatus,
          rawFileStoredInDatabase: false,
        },
      }),
    ]);
    return {
      importId: saved.id,
      duplicate: false,
      provider: parsed.provider,
      insertedRows,
      skippedRows,
      validationStatus: parsed.validationStatus,
    };
  } catch (error) {
    await db
      .update(bankStatementImport)
      .set({
        status: "failed",
        errorMessage: "The parsed statement transactions could not be saved.",
        completedAt: new Date(),
      })
      .where(
        and(eq(bankStatementImport.id, saved.id), eq(bankStatementImport.userId, input.userId)),
      );
    throw error;
  }
}

export async function getRecentBankStatementImports(userId: string) {
  return db
    .select({
      id: bankStatementImport.id,
      provider: bankStatementImport.provider,
      fileName: bankStatementImport.fileName,
      status: bankStatementImport.status,
      rowCount: bankStatementImport.rowCount,
      insertedRows: bankStatementImport.insertedRows,
      skippedRows: bankStatementImport.skippedRows,
      validationStatus: bankStatementImport.validationStatus,
      validationIssues: bankStatementImport.validationIssues,
      periodStart: bankStatementImport.periodStart,
      periodEnd: bankStatementImport.periodEnd,
      createdAt: bankStatementImport.createdAt,
    })
    .from(bankStatementImport)
    .where(eq(bankStatementImport.userId, userId))
    .orderBy(desc(bankStatementImport.createdAt))
    .limit(50);
}
