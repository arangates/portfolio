import {
  boolean,
  check,
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
import { sql } from "drizzle-orm";

import { user } from "./auth";
import { instrument } from "./portfolio";

export const capitalDeploymentPolicy = pgTable(
  "capital_deployment_policy",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    stagingInstrumentId: uuid("staging_instrument_id").references(() => instrument.id, {
      onDelete: "restrict",
    }),
    monthlyDeploymentAmount: numeric("monthly_deployment_amount", {
      precision: 30,
      scale: 8,
    })
      .default("0")
      .notNull(),
    deploymentCurrency: text("deployment_currency").default("INR").notNull(),
    reserveFloor: numeric("reserve_floor", { precision: 30, scale: 8 }).default("0").notNull(),
    fixedDepositHorizonDays: integer("fixed_deposit_horizon_days").default(365).notNull(),
    transferMatchWindowDays: integer("transfer_match_window_days").default(7).notNull(),
    transferMatchTolerance: numeric("transfer_match_tolerance", {
      precision: 12,
      scale: 8,
    })
      .default("0.15")
      .notNull(),
    includeBankCash: boolean("include_bank_cash").default(false).notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check(
      "capital_deployment_policy_values_check",
      sql`${table.monthlyDeploymentAmount} >= 0 and ${table.reserveFloor} >= 0 and ${table.fixedDepositHorizonDays} between 30 and 3650 and ${table.transferMatchWindowDays} between 0 and 31 and ${table.transferMatchTolerance} between 0 and 1 and char_length(${table.deploymentCurrency}) = 3`,
    ),
    foreignKey({
      columns: [table.stagingInstrumentId, table.userId],
      foreignColumns: [instrument.id, instrument.userId],
      name: "capital_deployment_policy_staging_owner_fk",
    }).onDelete("restrict"),
  ],
);

export const capitalAllocationTarget = pgTable(
  "capital_allocation_target",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    bucket: text("bucket").notNull(),
    targetWeight: numeric("target_weight", { precision: 12, scale: 8 }).notNull(),
    minimumWeight: numeric("minimum_weight", { precision: 12, scale: 8 }).notNull(),
    maximumWeight: numeric("maximum_weight", { precision: 12, scale: 8 }).notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check(
      "capital_allocation_target_weights_check",
      sql`${table.minimumWeight} between 0 and 1 and ${table.targetWeight} between 0 and 1 and ${table.maximumWeight} between 0 and 1 and ${table.minimumWeight} <= ${table.targetWeight} and ${table.targetWeight} <= ${table.maximumWeight}`,
    ),
    uniqueIndex("capital_allocation_target_user_bucket_uidx").on(table.userId, table.bucket),
    uniqueIndex("capital_allocation_target_id_user_uidx").on(table.id, table.userId),
    index("capital_allocation_target_user_idx").on(table.userId),
  ],
);
