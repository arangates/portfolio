import {
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { bankAccount } from "./portfolio";

export const bankStatementImport = pgTable(
  "bank_statement_import",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: uuid("account_id")
      .notNull()
      .references(() => bankAccount.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    fileName: text("file_name").notNull(),
    fileHash: text("file_hash").notNull(),
    mimeType: text("mime_type").notNull(),
    fileSize: integer("file_size").notNull(),
    parserVersion: text("parser_version").notNull(),
    periodStart: timestamp("period_start", { withTimezone: true }),
    periodEnd: timestamp("period_end", { withTimezone: true }),
    openingBalance: numeric("opening_balance", { precision: 30, scale: 8 }),
    closingBalance: numeric("closing_balance", { precision: 30, scale: 8 }),
    debitTotal: numeric("debit_total", { precision: 30, scale: 8 }).notNull(),
    creditTotal: numeric("credit_total", { precision: 30, scale: 8 }).notNull(),
    rowCount: integer("row_count").default(0).notNull(),
    insertedRows: integer("inserted_rows").default(0).notNull(),
    skippedRows: integer("skipped_rows").default(0).notNull(),
    validationStatus: text("validation_status").notNull(),
    validationIssues: jsonb("validation_issues").$type<string[]>().default([]).notNull(),
    status: text("status").default("processing").notNull(),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("bank_statement_import_user_hash_uidx").on(table.userId, table.fileHash),
    uniqueIndex("bank_statement_import_id_user_uidx").on(table.id, table.userId),
    index("bank_statement_import_user_period_idx").on(table.userId, table.periodEnd),
    foreignKey({
      columns: [table.accountId, table.userId],
      foreignColumns: [bankAccount.id, bankAccount.userId],
      name: "bank_statement_import_account_owner_fk",
    }).onDelete("cascade"),
  ],
);

export const bankTransaction = pgTable(
  "bank_transaction",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: uuid("account_id")
      .notNull()
      .references(() => bankAccount.id, { onDelete: "cascade" }),
    importId: uuid("import_id")
      .notNull()
      .references(() => bankStatementImport.id, { onDelete: "restrict" }),
    transactionHash: text("transaction_hash").notNull(),
    bookedAt: timestamp("booked_at", { withTimezone: true }).notNull(),
    valueAt: timestamp("value_at", { withTimezone: true }),
    amount: numeric("amount", { precision: 30, scale: 8 }).notNull(),
    currency: text("currency").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    transactionType: text("transaction_type"),
    providerCode: text("provider_code"),
    counterpartyName: text("counterparty_name"),
    counterpartyAccountLast4: text("counterparty_account_last4"),
    category: text("category").notNull(),
    categorySource: text("category_source").default("rule").notNull(),
    categoryConfidence: numeric("category_confidence", { precision: 5, scale: 4 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("bank_transaction_user_account_hash_uidx").on(
      table.userId,
      table.accountId,
      table.transactionHash,
    ),
    uniqueIndex("bank_transaction_id_user_uidx").on(table.id, table.userId),
    index("bank_transaction_user_booked_idx").on(table.userId, table.bookedAt),
    index("bank_transaction_user_category_idx").on(table.userId, table.category),
    foreignKey({
      columns: [table.accountId, table.userId],
      foreignColumns: [bankAccount.id, bankAccount.userId],
      name: "bank_transaction_account_owner_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.importId, table.userId],
      foreignColumns: [bankStatementImport.id, bankStatementImport.userId],
      name: "bank_transaction_import_owner_fk",
    }).onDelete("restrict"),
  ],
);
