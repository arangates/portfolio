import {
  boolean,
  date,
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

export const mortgageImport = pgTable(
  "mortgage_import",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    fileName: text("file_name").notNull(),
    fileHash: text("file_hash").notNull(),
    mimeType: text("mime_type").notNull(),
    fileSize: integer("file_size").notNull(),
    parserVersion: text("parser_version").notNull(),
    status: text("status").default("processing").notNull(),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("mortgage_import_user_hash_uidx").on(table.userId, table.fileHash),
    uniqueIndex("mortgage_import_id_user_uidx").on(table.id, table.userId),
    index("mortgage_import_user_created_idx").on(table.userId, table.createdAt),
  ],
);

/** One row per mortgage loan; holds the analysis preferences the user chose. */
export const mortgageLoan = pgTable(
  "mortgage_loan",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lender: text("lender").default("ING").notNull(),
    loanNumber: text("loan_number").notNull(),
    rateBasis: text("rate_basis").default("implied").notNull(),
    propertyAppreciation: numeric("property_appreciation", { precision: 8, scale: 5 })
      .default("0.02")
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("mortgage_loan_user_number_uidx").on(table.userId, table.loanNumber),
    uniqueIndex("mortgage_loan_id_user_uidx").on(table.id, table.userId),
  ],
);

/** Dated snapshot of the loan terms and balance, from a lender overview or entered by hand. */
export const mortgageOverview = pgTable(
  "mortgage_overview",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    loanId: uuid("loan_id")
      .notNull()
      .references(() => mortgageLoan.id, { onDelete: "cascade" }),
    importId: uuid("import_id").references(() => mortgageImport.id, { onDelete: "set null" }),
    source: text("source").default("import").notNull(),
    asOf: date("as_of").notNull(),
    currency: text("currency").default("EUR").notNull(),
    repaymentType: text("repayment_type").default("annuity").notNull(),
    startDate: date("start_date").notNull(),
    firstPaymentDate: date("first_payment_date").notNull(),
    endDate: date("end_date").notNull(),
    fixedRateEndDate: date("fixed_rate_end_date").notNull(),
    originalAmount: numeric("original_amount", { precision: 30, scale: 2 }).notNull(),
    currentBalance: numeric("current_balance", { precision: 30, scale: 2 }).notNull(),
    monthlyPayment: numeric("monthly_payment", { precision: 30, scale: 2 }).notNull(),
    statedRate: numeric("stated_rate", { precision: 8, scale: 5 }).notNull(),
    discount: numeric("discount", { precision: 8, scale: 5 }).default("0").notNull(),
    sustainabilityDiscount: boolean("sustainability_discount").default(false).notNull(),
    registrationAmount: numeric("registration_amount", { precision: 30, scale: 2 }),
    freeRepaymentAllowance: numeric("free_repayment_allowance", { precision: 30, scale: 2 }),
    propertyValue: numeric("property_value", { precision: 30, scale: 2 }),
    valuationDate: date("valuation_date"),
    energyLabel: text("energy_label"),
    nhg: boolean("nhg").default(false).notNull(),
    bouwdepotOriginal: numeric("bouwdepot_original", { precision: 30, scale: 2 }),
    bouwdepotRemaining: numeric("bouwdepot_remaining", { precision: 30, scale: 2 }),
    validationStatus: text("validation_status").default("verified").notNull(),
    validationIssues: jsonb("validation_issues").$type<string[]>().default([]).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("mortgage_overview_loan_as_of_uidx").on(table.loanId, table.asOf),
    uniqueIndex("mortgage_overview_id_user_uidx").on(table.id, table.userId),
    index("mortgage_overview_user_as_of_idx").on(table.userId, table.asOf),
    foreignKey({
      columns: [table.loanId, table.userId],
      foreignColumns: [mortgageLoan.id, mortgageLoan.userId],
      name: "mortgage_overview_loan_owner_fk",
    }).onDelete("cascade"),
  ],
);

/** Extra (unscheduled) repayments the user made, used to reconcile the balance. */
export const mortgageExtraRepayment = pgTable(
  "mortgage_extra_repayment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    loanId: uuid("loan_id")
      .notNull()
      .references(() => mortgageLoan.id, { onDelete: "cascade" }),
    paidOn: date("paid_on").notNull(),
    amount: numeric("amount", { precision: 30, scale: 2 }).notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("mortgage_extra_repayment_loan_idx").on(table.loanId, table.paidOn),
    foreignKey({
      columns: [table.loanId, table.userId],
      foreignColumns: [mortgageLoan.id, mortgageLoan.userId],
      name: "mortgage_extra_repayment_loan_owner_fk",
    }).onDelete("cascade"),
  ],
);
