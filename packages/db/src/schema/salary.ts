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

export const salaryImport = pgTable(
  "salary_import",
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
    uniqueIndex("salary_import_user_hash_uidx").on(table.userId, table.fileHash),
    uniqueIndex("salary_import_id_user_uidx").on(table.id, table.userId),
    index("salary_import_user_created_idx").on(table.userId, table.createdAt),
  ],
);

export const salaryPayslip = pgTable(
  "salary_payslip",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    importId: uuid("import_id")
      .notNull()
      .references(() => salaryImport.id, { onDelete: "cascade" }),
    employerName: text("employer_name").notNull(),
    payPeriod: date("pay_period").notNull(),
    periodLabel: text("period_label").notNull(),
    currency: text("currency").notNull(),
    revision: text("revision"),
    baseSalary: numeric("base_salary", { precision: 30, scale: 8 }).notNull(),
    supplementalGross: numeric("supplemental_gross", { precision: 30, scale: 8 }).notNull(),
    grossPay: numeric("gross_pay", { precision: 30, scale: 8 }).notNull(),
    taxableWage: numeric("taxable_wage", { precision: 30, scale: 8 }).notNull(),
    wageTax: numeric("wage_tax", { precision: 30, scale: 8 }).notNull(),
    pensionContribution: numeric("pension_contribution", { precision: 30, scale: 8 }).notNull(),
    socialInsurance: numeric("social_insurance", { precision: 30, scale: 8 }).notNull(),
    thirtyPercentAdjustment: numeric("thirty_percent_adjustment", {
      precision: 30,
      scale: 8,
    }).notNull(),
    thirtyPercentCompensation: numeric("thirty_percent_compensation", {
      precision: 30,
      scale: 8,
    }).notNull(),
    expenseReimbursements: numeric("expense_reimbursements", {
      precision: 30,
      scale: 8,
    }).notNull(),
    netPay: numeric("net_pay", { precision: 30, scale: 8 }).notNull(),
    annualSalary: numeric("annual_salary", { precision: 30, scale: 8 }),
    partTimePercentage: numeric("part_time_percentage", { precision: 12, scale: 8 }),
    ytdTaxableWage: numeric("ytd_taxable_wage", { precision: 30, scale: 8 }),
    ytdWageTax: numeric("ytd_wage_tax", { precision: 30, scale: 8 }),
    ytdNetPay: numeric("ytd_net_pay", { precision: 30, scale: 8 }),
    ytdPension: numeric("ytd_pension", { precision: 30, scale: 8 }),
    validationStatus: text("validation_status").notNull(),
    validationIssues: jsonb("validation_issues").$type<string[]>().default([]).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("salary_payslip_import_uidx").on(table.importId),
    uniqueIndex("salary_payslip_id_user_uidx").on(table.id, table.userId),
    index("salary_payslip_user_period_idx").on(table.userId, table.payPeriod),
    index("salary_payslip_user_employer_period_idx").on(
      table.userId,
      table.employerName,
      table.payPeriod,
    ),
    foreignKey({
      columns: [table.importId, table.userId],
      foreignColumns: [salaryImport.id, salaryImport.userId],
      name: "salary_payslip_import_owner_fk",
    }).onDelete("cascade"),
  ],
);

export const salaryLineItem = pgTable(
  "salary_line_item",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    payslipId: uuid("payslip_id")
      .notNull()
      .references(() => salaryPayslip.id, { onDelete: "cascade" }),
    rowIndex: integer("row_index").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    amount: numeric("amount", { precision: 30, scale: 8 }).notNull(),
    components: jsonb("components").$type<number[]>().default([]).notNull(),
    quantity: numeric("quantity", { precision: 30, scale: 8 }),
    unit: text("unit"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("salary_line_item_payslip_row_uidx").on(table.payslipId, table.rowIndex),
    index("salary_line_item_user_category_idx").on(table.userId, table.category),
    foreignKey({
      columns: [table.payslipId, table.userId],
      foreignColumns: [salaryPayslip.id, salaryPayslip.userId],
      name: "salary_line_item_payslip_owner_fk",
    }).onDelete("cascade"),
  ],
);
