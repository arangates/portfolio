import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  foreignKey,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const fireProfile = pgTable("fire_profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  birthDate: date("birth_date"),
  plannedRetirementYear: integer("planned_retirement_year").notNull(),
  planEndAge: integer("plan_end_age").default(95).notNull(),
  inflationRate: numeric("inflation_rate", { precision: 12, scale: 8 }).default("0.03").notNull(),
  expectedReturnRate: numeric("expected_return_rate", { precision: 12, scale: 8 })
    .default("0.06")
    .notNull(),
  returnVolatility: numeric("return_volatility", { precision: 12, scale: 8 })
    .default("0.12")
    .notNull(),
  safeWithdrawalRate: numeric("safe_withdrawal_rate", { precision: 12, scale: 8 })
    .default("0.035")
    .notNull(),
  safetyBuffer: numeric("safety_buffer", { precision: 12, scale: 8 }).default("0.15").notNull(),
  annualSavings: numeric("annual_savings", { precision: 30, scale: 8 }).default("0").notNull(),
  savingsCurrency: text("savings_currency").default("INR").notNull(),
  targetLegacy: numeric("target_legacy", { precision: 30, scale: 8 }).default("0").notNull(),
  spendingPolicy: text("spending_policy").default("essential_floor").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const familyMember = pgTable(
  "family_member",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    relationship: text("relationship").notNull(),
    birthDate: date("birth_date"),
    linkedToPortfolio: boolean("linked_to_portfolio").default(false).notNull(),
    netWorth: numeric("net_worth", { precision: 30, scale: 8 }).default("0").notNull(),
    investableAssets: numeric("investable_assets", { precision: 30, scale: 8 })
      .default("0")
      .notNull(),
    annualNetIncome: numeric("annual_net_income", { precision: 30, scale: 8 })
      .default("0")
      .notNull(),
    currency: text("currency").notNull(),
    includedInPlan: boolean("included_in_plan").default(true).notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("family_member_user_identity_uidx").on(
      table.userId,
      table.name,
      table.relationship,
    ),
    index("family_member_user_idx").on(table.userId),
    uniqueIndex("family_member_id_user_uidx").on(table.id, table.userId),
  ],
);

export const fireExpense = pgTable(
  "fire_expense",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    memberId: uuid("member_id").references(() => familyMember.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    category: text("category").notNull(),
    monthlyAmount: numeric("monthly_amount", { precision: 30, scale: 8 }).notNull(),
    currency: text("currency").notNull(),
    essential: boolean("essential").default(true).notNull(),
    startYear: integer("start_year"),
    endYear: integer("end_year"),
    inflationRateOverride: numeric("inflation_rate_override", { precision: 12, scale: 8 }),
    notes: text("notes"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("fire_expense_user_category_idx").on(table.userId, table.category),
    uniqueIndex("fire_expense_id_user_uidx").on(table.id, table.userId),
    foreignKey({
      columns: [table.memberId, table.userId],
      foreignColumns: [familyMember.id, familyMember.userId],
      name: "fire_expense_member_owner_fk",
    }).onDelete("restrict"),
  ],
);

export const fireOneTimeCost = pgTable(
  "fire_one_time_cost",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    memberId: uuid("member_id").references(() => familyMember.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    amount: numeric("amount", { precision: 30, scale: 8 }).notNull(),
    currency: text("currency").notNull(),
    plannedYear: integer("planned_year").notNull(),
    priority: text("priority").default("important").notNull(),
    inflationLinked: boolean("inflation_linked").default(true).notNull(),
    notes: text("notes"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("fire_one_time_cost_user_year_idx").on(table.userId, table.plannedYear),
    uniqueIndex("fire_one_time_cost_id_user_uidx").on(table.id, table.userId),
    foreignKey({
      columns: [table.memberId, table.userId],
      foreignColumns: [familyMember.id, familyMember.userId],
      name: "fire_one_time_cost_member_owner_fk",
    }).onDelete("restrict"),
  ],
);

export const fireIncomeStream = pgTable(
  "fire_income_stream",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    memberId: uuid("member_id").references(() => familyMember.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    incomeType: text("income_type").notNull(),
    annualAmount: numeric("annual_amount", { precision: 30, scale: 8 }).notNull(),
    currency: text("currency").notNull(),
    startYear: integer("start_year").notNull(),
    endYear: integer("end_year"),
    inflationLinked: boolean("inflation_linked").default(true).notNull(),
    notes: text("notes"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("fire_income_stream_user_year_idx").on(table.userId, table.startYear),
    uniqueIndex("fire_income_stream_id_user_uidx").on(table.id, table.userId),
    foreignKey({
      columns: [table.memberId, table.userId],
      foreignColumns: [familyMember.id, familyMember.userId],
      name: "fire_income_stream_member_owner_fk",
    }).onDelete("restrict"),
  ],
);

export const fireScenario = pgTable(
  "fire_scenario",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    spendingMultiplier: numeric("spending_multiplier", { precision: 12, scale: 8 })
      .default("1")
      .notNull(),
    bufferRate: numeric("buffer_rate", { precision: 12, scale: 8 }).default("0").notNull(),
    returnRateOverride: numeric("return_rate_override", { precision: 12, scale: 8 }),
    inflationRateOverride: numeric("inflation_rate_override", { precision: 12, scale: 8 }),
    retirementYearOverride: integer("retirement_year_override"),
    enabled: boolean("enabled").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("fire_scenario_user_name_uidx").on(table.userId, table.name),
    index("fire_scenario_user_idx").on(table.userId),
    uniqueIndex("fire_scenario_id_user_uidx").on(table.id, table.userId),
  ],
);

export const fireProfileRelations = relations(fireProfile, ({ one }) => ({
  user: one(user, { fields: [fireProfile.userId], references: [user.id] }),
}));

export const familyMemberRelations = relations(familyMember, ({ one, many }) => ({
  user: one(user, { fields: [familyMember.userId], references: [user.id] }),
  expenses: many(fireExpense),
  oneTimeCosts: many(fireOneTimeCost),
  incomeStreams: many(fireIncomeStream),
}));

export const fireExpenseRelations = relations(fireExpense, ({ one }) => ({
  member: one(familyMember, { fields: [fireExpense.memberId], references: [familyMember.id] }),
}));

export const fireOneTimeCostRelations = relations(fireOneTimeCost, ({ one }) => ({
  member: one(familyMember, {
    fields: [fireOneTimeCost.memberId],
    references: [familyMember.id],
  }),
}));

export const fireIncomeStreamRelations = relations(fireIncomeStream, ({ one }) => ({
  member: one(familyMember, {
    fields: [fireIncomeStream.memberId],
    references: [familyMember.id],
  }),
}));
