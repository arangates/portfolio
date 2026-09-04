import { relations } from "drizzle-orm";
import {
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { instrument } from "./portfolio";

// MFAPI data is public market-reference data. Keeping one canonical copy avoids
// downloading the same NAV series for every account. Only the instrument link
// and sync audit records contain account-specific information.
export const mutualFundScheme = pgTable(
  "mutual_fund_scheme",
  {
    schemeCode: integer("scheme_code").primaryKey(),
    schemeName: text("scheme_name").notNull(),
    fundHouse: text("fund_house").notNull(),
    schemeType: text("scheme_type").notNull(),
    schemeCategory: text("scheme_category").notNull(),
    isinGrowth: text("isin_growth"),
    isinDivReinvestment: text("isin_div_reinvestment"),
    source: text("source").default("mfapi.in").notNull(),
    sourceUpdatedAt: timestamp("source_updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("mutual_fund_scheme_growth_isin_idx").on(table.isinGrowth),
    index("mutual_fund_scheme_div_isin_idx").on(table.isinDivReinvestment),
    index("mutual_fund_scheme_category_idx").on(table.schemeCategory),
  ],
);

export const mutualFundNav = pgTable(
  "mutual_fund_nav",
  {
    schemeCode: integer("scheme_code")
      .notNull()
      .references(() => mutualFundScheme.schemeCode, { onDelete: "cascade" }),
    navDate: date("nav_date").notNull(),
    nav: numeric("nav", { precision: 30, scale: 10 }).notNull(),
    source: text("source").default("mfapi.in").notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.schemeCode, table.navDate] }),
    index("mutual_fund_nav_date_idx").on(table.navDate),
  ],
);

export const mutualFundInstrumentLink = pgTable(
  "mutual_fund_instrument_link",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    instrumentId: uuid("instrument_id")
      .notNull()
      .references(() => instrument.id, { onDelete: "cascade" }),
    schemeCode: integer("scheme_code").references(() => mutualFundScheme.schemeCode, {
      onDelete: "set null",
    }),
    matchMethod: text("match_method"),
    status: text("status").default("pending").notNull(),
    errorMessage: text("error_message"),
    matchedAt: timestamp("matched_at", { withTimezone: true }),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("mutual_fund_link_user_instrument_uidx").on(table.userId, table.instrumentId),
    index("mutual_fund_link_user_status_idx").on(table.userId, table.status),
    foreignKey({
      columns: [table.instrumentId, table.userId],
      foreignColumns: [instrument.id, instrument.userId],
      name: "mutual_fund_link_instrument_owner_fk",
    }).onDelete("cascade"),
  ],
);

export const mutualFundSyncRun = pgTable(
  "mutual_fund_sync_run",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status").default("processing").notNull(),
    schemesRequested: integer("schemes_requested").default(0).notNull(),
    schemesMatched: integer("schemes_matched").default(0).notNull(),
    schemesSynced: integer("schemes_synced").default(0).notNull(),
    navRowsWritten: integer("nav_rows_written").default(0).notNull(),
    summary: jsonb("summary").$type<Record<string, unknown>>(),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [index("mutual_fund_sync_user_created_idx").on(table.userId, table.createdAt)],
);

export const mutualFundSchemeRelations = relations(mutualFundScheme, ({ many }) => ({
  nav: many(mutualFundNav),
  instrumentLinks: many(mutualFundInstrumentLink),
}));

export const mutualFundNavRelations = relations(mutualFundNav, ({ one }) => ({
  scheme: one(mutualFundScheme, {
    fields: [mutualFundNav.schemeCode],
    references: [mutualFundScheme.schemeCode],
  }),
}));

export const mutualFundInstrumentLinkRelations = relations(mutualFundInstrumentLink, ({ one }) => ({
  owner: one(user, {
    fields: [mutualFundInstrumentLink.userId],
    references: [user.id],
  }),
  instrument: one(instrument, {
    fields: [mutualFundInstrumentLink.instrumentId],
    references: [instrument.id],
  }),
  scheme: one(mutualFundScheme, {
    fields: [mutualFundInstrumentLink.schemeCode],
    references: [mutualFundScheme.schemeCode],
  }),
}));
