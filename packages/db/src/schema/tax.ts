import {
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

export const incomeTaxImport = pgTable(
  "income_tax_import",
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
    uniqueIndex("income_tax_import_user_hash_uidx").on(table.userId, table.fileHash),
    uniqueIndex("income_tax_import_id_user_uidx").on(table.id, table.userId),
    index("income_tax_import_user_created_idx").on(table.userId, table.createdAt),
  ],
);

export const incomeTaxReturn = pgTable(
  "income_tax_return",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    importId: uuid("import_id")
      .notNull()
      .references(() => incomeTaxImport.id, { onDelete: "cascade" }),
    jurisdiction: text("jurisdiction").default("IN").notNull(),
    currency: text("currency").default("INR").notNull(),
    assessmentYearStart: integer("assessment_year_start").notNull(),
    assessmentYearLabel: text("assessment_year_label").notNull(),
    financialYearLabel: text("financial_year_label").notNull(),
    formType: text("form_type").notNull(),
    schemaVersion: text("schema_version"),
    formVersion: text("form_version"),
    sourceCreatedOn: date("source_created_on"),
    acknowledgementNumber: text("acknowledgement_number"),
    filingSection: text("filing_section"),
    residentialStatus: text("residential_status"),
    taxRegime: text("tax_regime").default("unknown").notNull(),
    salaryIncome: numeric("salary_income", { precision: 30, scale: 2 }).notNull(),
    housePropertyIncome: numeric("house_property_income", {
      precision: 30,
      scale: 2,
    }).notNull(),
    businessIncome: numeric("business_income", { precision: 30, scale: 2 }).notNull(),
    capitalGains: numeric("capital_gains", { precision: 30, scale: 2 }).notNull(),
    otherSourcesIncome: numeric("other_sources_income", {
      precision: 30,
      scale: 2,
    }).notNull(),
    grossTotalIncome: numeric("gross_total_income", { precision: 30, scale: 2 }).notNull(),
    chapterViDeductions: numeric("chapter_vi_deductions", {
      precision: 30,
      scale: 2,
    }).notNull(),
    totalIncome: numeric("total_income", { precision: 30, scale: 2 }).notNull(),
    netTaxLiability: numeric("net_tax_liability", { precision: 30, scale: 2 }).notNull(),
    interestAndFees: numeric("interest_and_fees", { precision: 30, scale: 2 }).notNull(),
    aggregateTaxLiability: numeric("aggregate_tax_liability", {
      precision: 30,
      scale: 2,
    }).notNull(),
    advanceTax: numeric("advance_tax", { precision: 30, scale: 2 }).notNull(),
    tds: numeric("tds", { precision: 30, scale: 2 }).notNull(),
    tcs: numeric("tcs", { precision: 30, scale: 2 }).notNull(),
    selfAssessmentTax: numeric("self_assessment_tax", { precision: 30, scale: 2 }).notNull(),
    totalTaxesPaid: numeric("total_taxes_paid", { precision: 30, scale: 2 }).notNull(),
    balanceTaxPayable: numeric("balance_tax_payable", { precision: 30, scale: 2 }).notNull(),
    refundDue: numeric("refund_due", { precision: 30, scale: 2 }).notNull(),
    validationStatus: text("validation_status").notNull(),
    validationIssues: jsonb("validation_issues").$type<string[]>().default([]).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("income_tax_return_import_uidx").on(table.importId),
    uniqueIndex("income_tax_return_id_user_uidx").on(table.id, table.userId),
    index("income_tax_return_user_year_idx").on(table.userId, table.assessmentYearStart),
    foreignKey({
      columns: [table.importId, table.userId],
      foreignColumns: [incomeTaxImport.id, incomeTaxImport.userId],
      name: "income_tax_return_import_owner_fk",
    }).onDelete("cascade"),
  ],
);
