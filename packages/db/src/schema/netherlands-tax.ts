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
import { familyMember } from "./fire";

export const netherlandsTaxImport = pgTable(
  "netherlands_tax_import",
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
    uniqueIndex("netherlands_tax_import_user_hash_uidx").on(table.userId, table.fileHash),
    uniqueIndex("netherlands_tax_import_id_user_uidx").on(table.id, table.userId),
    index("netherlands_tax_import_user_created_idx").on(table.userId, table.createdAt),
  ],
);

export const netherlandsTaxAssessment = pgTable(
  "netherlands_tax_assessment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    importId: uuid("import_id")
      .notNull()
      .references(() => netherlandsTaxImport.id, { onDelete: "cascade" }),
    taxpayerMemberId: uuid("taxpayer_member_id").references(() => familyMember.id, {
      onDelete: "restrict",
    }),
    taxYear: integer("tax_year").notNull(),
    assessmentType: text("assessment_type").default("final").notNull(),
    assessmentDate: date("assessment_date").notNull(),
    assessmentReferenceSuffix: text("assessment_reference_suffix"),
    currency: text("currency").default("EUR").notNull(),
    outcomeType: text("outcome_type").notNull(),
    settlementAmount: numeric("settlement_amount", { precision: 30, scale: 2 }).notNull(),
    payrollTaxWithheld: numeric("payroll_tax_withheld", { precision: 30, scale: 2 }).notNull(),
    dividendGamingTaxWithheld: numeric("dividend_gaming_tax_withheld", {
      precision: 30,
      scale: 2,
    }).notNull(),
    provisionalRefunds: numeric("provisional_refunds", { precision: 30, scale: 2 }).notNull(),
    priorBalanceAdjustment: numeric("prior_balance_adjustment", {
      precision: 30,
      scale: 2,
    }).notNull(),
    collectionThresholdRelief: numeric("collection_threshold_relief", {
      precision: 30,
      scale: 2,
    })
      .default("0")
      .notNull(),
    taxInterest: numeric("tax_interest", { precision: 30, scale: 2 }).notNull(),
    finalTaxAndSocialInsurance: numeric("final_tax_and_social_insurance", {
      precision: 30,
      scale: 2,
    }).notNull(),
    box1TaxableIncome: numeric("box1_taxable_income", { precision: 30, scale: 2 }).notNull(),
    box1IncomeTax: numeric("box1_income_tax", { precision: 30, scale: 2 }).notNull(),
    box2TaxableIncome: numeric("box2_taxable_income", { precision: 30, scale: 2 }).notNull(),
    box2IncomeTax: numeric("box2_income_tax", { precision: 30, scale: 2 }).notNull(),
    box3TaxableIncome: numeric("box3_taxable_income", { precision: 30, scale: 2 }).notNull(),
    box3IncomeTax: numeric("box3_income_tax", { precision: 30, scale: 2 }).notNull(),
    socialInsuranceIncome: numeric("social_insurance_income", {
      precision: 30,
      scale: 2,
    }).notNull(),
    socialInsurancePremium: numeric("social_insurance_premium", {
      precision: 30,
      scale: 2,
    }).notNull(),
    generalTaxCredit: numeric("general_tax_credit", { precision: 30, scale: 2 }).notNull(),
    employmentTaxCredit: numeric("employment_tax_credit", {
      precision: 30,
      scale: 2,
    }).notNull(),
    totalTaxCredits: numeric("total_tax_credits", { precision: 30, scale: 2 }).notNull(),
    aggregateIncome: numeric("aggregate_income", { precision: 30, scale: 2 }).notNull(),
    validationStatus: text("validation_status").notNull(),
    validationIssues: jsonb("validation_issues").$type<string[]>().default([]).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("netherlands_tax_assessment_import_uidx").on(table.importId),
    uniqueIndex("netherlands_tax_assessment_id_user_uidx").on(table.id, table.userId),
    index("netherlands_tax_assessment_user_year_idx").on(
      table.userId,
      table.taxpayerMemberId,
      table.taxYear,
    ),
    foreignKey({
      columns: [table.importId, table.userId],
      foreignColumns: [netherlandsTaxImport.id, netherlandsTaxImport.userId],
      name: "netherlands_tax_assessment_import_owner_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.taxpayerMemberId, table.userId],
      foreignColumns: [familyMember.id, familyMember.userId],
      name: "netherlands_tax_assessment_member_owner_fk",
    }).onDelete("restrict"),
  ],
);
