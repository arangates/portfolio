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

export const householdProfile = pgTable("household_profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  currency: text("currency").default("EUR").notNull(),
  adultsCount: integer("adults_count").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const householdBudgetItem = pgTable(
  "household_budget_item",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category").notNull(),
    flowType: text("flow_type").notNull(),
    essential: boolean("essential").default(true).notNull(),
    notes: text("notes"),
    sourceKey: text("source_key"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("household_budget_item_user_identity_uidx").on(
      table.userId,
      table.name,
      table.category,
      table.flowType,
    ),
    uniqueIndex("household_budget_item_user_source_uidx").on(table.userId, table.sourceKey),
    uniqueIndex("household_budget_item_id_user_uidx").on(table.id, table.userId),
    index("household_budget_item_user_category_idx").on(table.userId, table.category),
  ],
);

export const householdBudgetSnapshot = pgTable(
  "household_budget_snapshot",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    itemId: uuid("item_id")
      .notNull()
      .references(() => householdBudgetItem.id, { onDelete: "cascade" }),
    effectiveFrom: date("effective_from").notNull(),
    monthlyAmount: numeric("monthly_amount", { precision: 30, scale: 8 }).notNull(),
    source: text("source").default("manual").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("household_budget_snapshot_item_date_uidx").on(table.itemId, table.effectiveFrom),
    index("household_budget_snapshot_user_date_idx").on(table.userId, table.effectiveFrom),
    foreignKey({
      columns: [table.itemId, table.userId],
      foreignColumns: [householdBudgetItem.id, householdBudgetItem.userId],
      name: "household_budget_snapshot_owner_fk",
    }).onDelete("cascade"),
  ],
);

export const householdScenario = pgTable(
  "household_scenario",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    scenarioType: text("scenario_type").default("custom").notNull(),
    description: text("description"),
    adultsCount: integer("adults_count").default(1).notNull(),
    usesCurrentBudget: boolean("uses_current_budget").default(false).notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("household_scenario_user_name_uidx").on(table.userId, table.name),
    uniqueIndex("household_scenario_id_user_uidx").on(table.id, table.userId),
    index("household_scenario_user_idx").on(table.userId),
  ],
);

export const householdScenarioLine = pgTable(
  "household_scenario_line",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    scenarioId: uuid("scenario_id")
      .notNull()
      .references(() => householdScenario.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category").notNull(),
    flowType: text("flow_type").notNull(),
    monthlyAmount: numeric("monthly_amount", { precision: 30, scale: 8 }).notNull(),
    essential: boolean("essential").default(true).notNull(),
    notes: text("notes"),
    sortOrder: integer("sort_order").default(0).notNull(),
    sourceKey: text("source_key"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("household_scenario_line_user_source_uidx").on(table.userId, table.sourceKey),
    index("household_scenario_line_scenario_idx").on(table.userId, table.scenarioId),
    foreignKey({
      columns: [table.scenarioId, table.userId],
      foreignColumns: [householdScenario.id, householdScenario.userId],
      name: "household_scenario_line_owner_fk",
    }).onDelete("cascade"),
  ],
);

export const householdServiceContract = pgTable(
  "household_service_contract",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    budgetItemId: uuid("budget_item_id").references(() => householdBudgetItem.id, {
      onDelete: "set null",
    }),
    service: text("service").notNull(),
    provider: text("provider").notNull(),
    sourceKey: text("source_key"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("household_contract_user_identity_uidx").on(
      table.userId,
      table.service,
      table.provider,
    ),
    uniqueIndex("household_contract_user_source_uidx").on(table.userId, table.sourceKey),
    uniqueIndex("household_contract_id_user_uidx").on(table.id, table.userId),
    index("household_contract_user_idx").on(table.userId),
    foreignKey({
      columns: [table.budgetItemId, table.userId],
      foreignColumns: [householdBudgetItem.id, householdBudgetItem.userId],
      name: "household_contract_budget_owner_fk",
    }).onDelete("set null"),
  ],
);

export const householdServiceContractSnapshot = pgTable(
  "household_service_contract_snapshot",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    contractId: uuid("contract_id")
      .notNull()
      .references(() => householdServiceContract.id, { onDelete: "cascade" }),
    effectiveFrom: date("effective_from").notNull(),
    monthlyCost: numeric("monthly_cost", { precision: 30, scale: 8 }),
    billingDay: integer("billing_day"),
    contractEndDate: date("contract_end_date"),
    durationMonths: integer("duration_months"),
    renewalType: text("renewal_type").default("unknown").notNull(),
    status: text("status").default("active").notNull(),
    notes: text("notes"),
    source: text("source").default("manual").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("household_contract_snapshot_contract_date_uidx").on(
      table.contractId,
      table.effectiveFrom,
    ),
    index("household_contract_snapshot_user_date_idx").on(table.userId, table.effectiveFrom),
    foreignKey({
      columns: [table.contractId, table.userId],
      foreignColumns: [householdServiceContract.id, householdServiceContract.userId],
      name: "household_contract_snapshot_owner_fk",
    }).onDelete("cascade"),
  ],
);

export const householdPurchase = pgTable(
  "household_purchase",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    scope: text("scope").notNull(),
    category: text("category").notNull(),
    vendor: text("vendor"),
    amount: numeric("amount", { precision: 30, scale: 8 }).notNull(),
    currency: text("currency").default("EUR").notNull(),
    purchasedOn: date("purchased_on"),
    paymentSource: text("payment_source"),
    notes: text("notes"),
    sourceKey: text("source_key"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("household_purchase_user_source_uidx").on(table.userId, table.sourceKey),
    index("household_purchase_user_scope_idx").on(table.userId, table.scope),
    index("household_purchase_user_date_idx").on(table.userId, table.purchasedOn),
  ],
);

export const householdProfileRelations = relations(householdProfile, ({ one }) => ({
  user: one(user, { fields: [householdProfile.userId], references: [user.id] }),
}));

export const householdBudgetItemRelations = relations(householdBudgetItem, ({ one, many }) => ({
  user: one(user, { fields: [householdBudgetItem.userId], references: [user.id] }),
  snapshots: many(householdBudgetSnapshot),
  contracts: many(householdServiceContract),
}));

export const householdBudgetSnapshotRelations = relations(householdBudgetSnapshot, ({ one }) => ({
  item: one(householdBudgetItem, {
    fields: [householdBudgetSnapshot.itemId],
    references: [householdBudgetItem.id],
  }),
}));

export const householdScenarioRelations = relations(householdScenario, ({ many }) => ({
  lines: many(householdScenarioLine),
}));

export const householdScenarioLineRelations = relations(householdScenarioLine, ({ one }) => ({
  scenario: one(householdScenario, {
    fields: [householdScenarioLine.scenarioId],
    references: [householdScenario.id],
  }),
}));

export const householdServiceContractRelations = relations(
  householdServiceContract,
  ({ one, many }) => ({
    budgetItem: one(householdBudgetItem, {
      fields: [householdServiceContract.budgetItemId],
      references: [householdBudgetItem.id],
    }),
    snapshots: many(householdServiceContractSnapshot),
  }),
);

export const householdServiceContractSnapshotRelations = relations(
  householdServiceContractSnapshot,
  ({ one }) => ({
    contract: one(householdServiceContract, {
      fields: [householdServiceContractSnapshot.contractId],
      references: [householdServiceContract.id],
    }),
  }),
);
