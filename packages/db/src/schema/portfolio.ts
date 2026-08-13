import { relations } from "drizzle-orm";
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

export const portfolioSource = pgTable(
  "portfolio_source",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    name: text("name").notNull(),
    baseCurrency: text("base_currency").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("portfolio_source_user_provider_name_uidx").on(
      table.userId,
      table.provider,
      table.name,
    ),
    index("portfolio_source_user_idx").on(table.userId),
    uniqueIndex("portfolio_source_id_user_uidx").on(table.id, table.userId),
  ],
);

export const importBatch = pgTable(
  "import_batch",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => portfolioSource.id, { onDelete: "restrict" }),
    kind: text("kind").notNull(),
    fileName: text("file_name").notNull(),
    fileHash: text("file_hash").notNull(),
    fileContentsBase64: text("file_contents_base64").notNull(),
    statementDate: date("statement_date"),
    status: text("status").default("processing").notNull(),
    rowCount: integer("row_count").default(0).notNull(),
    insertedRows: integer("inserted_rows").default(0).notNull(),
    skippedRows: integer("skipped_rows").default(0).notNull(),
    summary: jsonb("summary").$type<Record<string, unknown>>(),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("import_batch_user_kind_hash_uidx").on(table.userId, table.kind, table.fileHash),
    index("import_batch_user_created_idx").on(table.userId, table.createdAt),
    uniqueIndex("import_batch_id_user_uidx").on(table.id, table.userId),
    foreignKey({
      columns: [table.sourceId, table.userId],
      foreignColumns: [portfolioSource.id, portfolioSource.userId],
      name: "import_batch_source_owner_fk",
    }).onDelete("restrict"),
  ],
);

export const importRow = pgTable(
  "import_row",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => importBatch.id, { onDelete: "cascade" }),
    rowNumber: integer("row_number").notNull(),
    rowHash: text("row_hash").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("import_row_batch_number_uidx").on(table.batchId, table.rowNumber),
    index("import_row_hash_idx").on(table.rowHash),
    index("import_row_user_idx").on(table.userId),
    foreignKey({
      columns: [table.batchId, table.userId],
      foreignColumns: [importBatch.id, importBatch.userId],
      name: "import_row_batch_owner_fk",
    }).onDelete("cascade"),
  ],
);

export const instrument = pgTable(
  "instrument",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    isin: text("isin").notNull(),
    symbol: text("symbol"),
    name: text("name").notNull(),
    assetClass: text("asset_class").notNull(),
    currency: text("currency").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("instrument_user_isin_uidx").on(table.userId, table.isin),
    index("instrument_user_class_idx").on(table.userId, table.assetClass),
    uniqueIndex("instrument_id_user_uidx").on(table.id, table.userId),
  ],
);

export const positionSnapshot = pgTable(
  "position_snapshot",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => portfolioSource.id, { onDelete: "restrict" }),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => importBatch.id, { onDelete: "restrict" }),
    instrumentId: uuid("instrument_id")
      .notNull()
      .references(() => instrument.id, { onDelete: "restrict" }),
    snapshotAt: timestamp("snapshot_at", { withTimezone: true }).notNull(),
    quantity: numeric("quantity", { precision: 30, scale: 10 }).notNull(),
    averagePrice: numeric("average_price", { precision: 30, scale: 10 }),
    marketPrice: numeric("market_price", { precision: 30, scale: 10 }),
    investedValue: numeric("invested_value", { precision: 30, scale: 8 }),
    marketValue: numeric("market_value", { precision: 30, scale: 8 }),
    unrealizedPnl: numeric("unrealized_pnl", { precision: 30, scale: 8 }),
    rawRowHash: text("raw_row_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("position_snapshot_batch_instrument_uidx").on(table.batchId, table.instrumentId),
    index("position_snapshot_user_date_idx").on(table.userId, table.snapshotAt),
    foreignKey({
      columns: [table.sourceId, table.userId],
      foreignColumns: [portfolioSource.id, portfolioSource.userId],
      name: "position_snapshot_source_owner_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.batchId, table.userId],
      foreignColumns: [importBatch.id, importBatch.userId],
      name: "position_snapshot_batch_owner_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.instrumentId, table.userId],
      foreignColumns: [instrument.id, instrument.userId],
      name: "position_snapshot_instrument_owner_fk",
    }).onDelete("restrict"),
  ],
);

export const ledgerEntry = pgTable(
  "ledger_entry",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => portfolioSource.id, { onDelete: "restrict" }),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => importBatch.id, { onDelete: "restrict" }),
    instrumentId: uuid("instrument_id").references(() => instrument.id, {
      onDelete: "restrict",
    }),
    externalId: text("external_id"),
    entryKey: text("entry_key").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    entryType: text("entry_type").notNull(),
    description: text("description"),
    quantity: numeric("quantity", { precision: 30, scale: 10 }),
    price: numeric("price", { precision: 30, scale: 10 }),
    grossAmount: numeric("gross_amount", { precision: 30, scale: 8 }),
    fees: numeric("fees", { precision: 30, scale: 8 }),
    netAmount: numeric("net_amount", { precision: 30, scale: 8 }),
    balance: numeric("balance", { precision: 30, scale: 8 }),
    currency: text("currency").notNull(),
    rawRowHash: text("raw_row_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("ledger_entry_user_source_key_uidx").on(
      table.userId,
      table.sourceId,
      table.entryKey,
    ),
    index("ledger_entry_user_occurred_idx").on(table.userId, table.occurredAt),
    foreignKey({
      columns: [table.sourceId, table.userId],
      foreignColumns: [portfolioSource.id, portfolioSource.userId],
      name: "ledger_entry_source_owner_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.batchId, table.userId],
      foreignColumns: [importBatch.id, importBatch.userId],
      name: "ledger_entry_batch_owner_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.instrumentId, table.userId],
      foreignColumns: [instrument.id, instrument.userId],
      name: "ledger_entry_instrument_owner_fk",
    }).onDelete("restrict"),
  ],
);

export const bankAccount = pgTable(
  "bank_account",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    institution: text("institution").notNull(),
    name: text("name").notNull(),
    accountType: text("account_type").notNull(),
    accountLast4: text("account_last4"),
    currency: text("currency").notNull(),
    notes: text("notes"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("bank_account_user_currency_idx").on(table.userId, table.currency),
    uniqueIndex("bank_account_user_identity_uidx").on(
      table.userId,
      table.institution,
      table.name,
      table.currency,
    ),
    uniqueIndex("bank_account_id_user_uidx").on(table.id, table.userId),
  ],
);

export const bankBalanceSnapshot = pgTable(
  "bank_balance_snapshot",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: uuid("account_id")
      .notNull()
      .references(() => bankAccount.id, { onDelete: "cascade" }),
    batchId: uuid("batch_id").references(() => importBatch.id, {
      onDelete: "restrict",
    }),
    asOf: timestamp("as_of", { withTimezone: true }).notNull(),
    amount: numeric("amount", { precision: 30, scale: 8 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("bank_balance_account_asof_uidx").on(table.accountId, table.asOf),
    index("bank_balance_user_asof_idx").on(table.userId, table.asOf),
    foreignKey({
      columns: [table.accountId, table.userId],
      foreignColumns: [bankAccount.id, bankAccount.userId],
      name: "bank_balance_account_owner_fk",
    }).onDelete("cascade"),
  ],
);

export const fixedDeposit = pgTable(
  "fixed_deposit",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    bank: text("bank").notNull(),
    depositType: text("deposit_type").notNull(),
    accountLast4: text("account_last4"),
    currency: text("currency").default("INR").notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("fixed_deposit_user_idx").on(table.userId),
    uniqueIndex("fixed_deposit_id_user_uidx").on(table.id, table.userId),
  ],
);

export const fixedDepositSnapshot = pgTable(
  "fixed_deposit_snapshot",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    fixedDepositId: uuid("fixed_deposit_id")
      .notNull()
      .references(() => fixedDeposit.id, { onDelete: "cascade" }),
    asOf: timestamp("as_of", { withTimezone: true }).defaultNow().notNull(),
    principal: numeric("principal", { precision: 30, scale: 8 }).notNull(),
    interestRate: numeric("interest_rate", { precision: 12, scale: 8 }).notNull(),
    startDate: date("start_date").notNull(),
    maturityDate: date("maturity_date").notNull(),
    compoundingPerYear: integer("compounding_per_year").default(4).notNull(),
    status: text("status").default("active").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("fixed_deposit_snapshot_deposit_asof_uidx").on(table.fixedDepositId, table.asOf),
    index("fixed_deposit_snapshot_user_asof_idx").on(table.userId, table.asOf),
    foreignKey({
      columns: [table.fixedDepositId, table.userId],
      foreignColumns: [fixedDeposit.id, fixedDeposit.userId],
      name: "fixed_deposit_snapshot_owner_fk",
    }).onDelete("cascade"),
  ],
);

export const commodityHolding = pgTable(
  "commodity_holding",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    commodityType: text("commodity_type").notNull(),
    location: text("location"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("commodity_holding_user_idx").on(table.userId),
    uniqueIndex("commodity_holding_id_user_uidx").on(table.id, table.userId),
  ],
);

export const commoditySnapshot = pgTable(
  "commodity_snapshot",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    commodityHoldingId: uuid("commodity_holding_id")
      .notNull()
      .references(() => commodityHolding.id, { onDelete: "cascade" }),
    asOf: timestamp("as_of", { withTimezone: true }).defaultNow().notNull(),
    quantityGrams: numeric("quantity_grams", { precision: 30, scale: 8 }).notNull(),
    ownershipShare: numeric("ownership_share", { precision: 12, scale: 8 }).notNull(),
    pricePerGram: numeric("price_per_gram", { precision: 30, scale: 8 }).notNull(),
    currency: text("currency").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("commodity_snapshot_holding_asof_uidx").on(table.commodityHoldingId, table.asOf),
    index("commodity_snapshot_user_asof_idx").on(table.userId, table.asOf),
    foreignKey({
      columns: [table.commodityHoldingId, table.userId],
      foreignColumns: [commodityHolding.id, commodityHolding.userId],
      name: "commodity_snapshot_owner_fk",
    }).onDelete("cascade"),
  ],
);

export const manualAsset = pgTable(
  "manual_asset",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    assetType: text("asset_type").notNull(),
    location: text("location"),
    riskLevel: text("risk_level").default("moderate").notNull(),
    isLiquid: boolean("is_liquid").default(false).notNull(),
    notes: text("notes"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("manual_asset_user_type_idx").on(table.userId, table.assetType),
    uniqueIndex("manual_asset_user_name_uidx").on(table.userId, table.name),
    uniqueIndex("manual_asset_id_user_uidx").on(table.id, table.userId),
  ],
);

export const manualAssetSnapshot = pgTable(
  "manual_asset_snapshot",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => manualAsset.id, { onDelete: "cascade" }),
    asOf: timestamp("as_of", { withTimezone: true }).defaultNow().notNull(),
    value: numeric("value", { precision: 30, scale: 8 }).notNull(),
    currency: text("currency").notNull(),
    ownershipShare: numeric("ownership_share", { precision: 12, scale: 8 }).default("1").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("manual_asset_snapshot_asset_asof_uidx").on(table.assetId, table.asOf),
    index("manual_asset_snapshot_user_asof_idx").on(table.userId, table.asOf),
    foreignKey({
      columns: [table.assetId, table.userId],
      foreignColumns: [manualAsset.id, manualAsset.userId],
      name: "manual_asset_snapshot_owner_fk",
    }).onDelete("cascade"),
  ],
);

export const realEstateProperty = pgTable(
  "real_estate_property",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    owner: text("owner").notNull(),
    propertyType: text("property_type").notNull(),
    location: text("location"),
    notes: text("notes"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("real_estate_property_user_type_idx").on(table.userId, table.propertyType),
    uniqueIndex("real_estate_property_user_identity_uidx").on(
      table.userId,
      table.name,
      table.owner,
      table.location,
    ),
    uniqueIndex("real_estate_property_id_user_uidx").on(table.id, table.userId),
  ],
);

export const realEstateSnapshot = pgTable(
  "real_estate_snapshot",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => realEstateProperty.id, { onDelete: "cascade" }),
    asOf: timestamp("as_of", { withTimezone: true }).defaultNow().notNull(),
    areaCents: numeric("area_cents", { precision: 30, scale: 8 }).notNull(),
    areaSquareFeet: numeric("area_square_feet", { precision: 30, scale: 8 }).notNull(),
    ownershipShare: numeric("ownership_share", { precision: 12, scale: 8 }).notNull(),
    legalStatus: text("legal_status").default("unknown").notNull(),
    pricePerSquareFoot: numeric("price_per_square_foot", { precision: 30, scale: 8 }).notNull(),
    marketValue: numeric("market_value", { precision: 30, scale: 8 }).notNull(),
    currency: text("currency").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("real_estate_snapshot_property_asof_uidx").on(table.propertyId, table.asOf),
    index("real_estate_snapshot_user_asof_idx").on(table.userId, table.asOf),
    foreignKey({
      columns: [table.propertyId, table.userId],
      foreignColumns: [realEstateProperty.id, realEstateProperty.userId],
      name: "real_estate_snapshot_owner_fk",
    }).onDelete("cascade"),
  ],
);

export const portfolioPreference = pgTable("portfolio_preference", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  baseCurrency: text("base_currency").default("INR").notNull(),
  locale: text("locale").default("en-IN").notNull(),
  timeZone: text("time_zone").default("UTC").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const exchangeRateSnapshot = pgTable(
  "exchange_rate_snapshot",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    baseCurrency: text("base_currency").notNull(),
    quoteCurrency: text("quote_currency").notNull(),
    rate: numeric("rate", { precision: 30, scale: 12 }).notNull(),
    asOf: timestamp("as_of", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("exchange_rate_user_pair_asof_uidx").on(
      table.userId,
      table.baseCurrency,
      table.quoteCurrency,
      table.asOf,
    ),
    index("exchange_rate_user_asof_idx").on(table.userId, table.asOf),
  ],
);

export const auditEvent = pgTable(
  "audit_event",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("audit_event_user_created_idx").on(table.userId, table.createdAt)],
);

export const portfolioSourceRelations = relations(portfolioSource, ({ one, many }) => ({
  user: one(user, { fields: [portfolioSource.userId], references: [user.id] }),
  imports: many(importBatch),
}));

export const importBatchRelations = relations(importBatch, ({ one, many }) => ({
  source: one(portfolioSource, {
    fields: [importBatch.sourceId],
    references: [portfolioSource.id],
  }),
  rows: many(importRow),
}));
