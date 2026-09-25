import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const financialEvaluation = pgTable(
  "financial_evaluation",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    trigger: text("trigger").notNull(),
    model: text("model").notNull().default("anthropic/claude-sonnet-4.6"),
    liquidityScore: integer("liquidity_score"),
    fireScore: integer("fire_score"),
    deploymentScore: integer("deployment_score"),
    evidenceScore: integer("evidence_score"),
    taxScore: integer("tax_score"),
    overallScore: integer("overall_score"),
    evaluation: jsonb("evaluation").notNull(),
    alerts: jsonb("alerts").notNull().default("[]"),
    contextHash: text("context_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("evaluation_user_created_idx").on(table.userId, table.createdAt)],
);

export const evaluationAlert = pgTable(
  "evaluation_alert",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    evaluationId: uuid("evaluation_id")
      .notNull()
      .references(() => financialEvaluation.id, { onDelete: "cascade" }),
    category: text("category").notNull(),
    severity: text("severity").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    actionLabel: text("action_label"),
    actionHref: text("action_href"),
    alertKey: text("alert_key").notNull(),
    acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("evaluation_alert_user_created_idx").on(table.userId, table.createdAt),
    uniqueIndex("evaluation_alert_active_key_uidx").on(
      table.userId,
      table.alertKey,
      table.evaluationId,
    ),
  ],
);
