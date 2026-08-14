import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import ExcelJS from "exceljs";

const args = process.argv.slice(2);
const execute = args.includes("--execute");

function option(name) {
  const prefix = `--${name}=`;
  return args.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

const email = option("email")?.trim().toLowerCase();
const confirmedEmail = option("confirm-email")?.trim().toLowerCase();
const expectedHost = option("expect-host")?.trim();
const sourceFile = option("file");
const requestedAsOf = option("as-of");

if (!email || !sourceFile) {
  throw new Error(
    "Usage: pnpm db:import-legacy-workbook -- --email=user@example.com --file=/absolute/path/workbook.xlsx",
  );
}

const sourcePath = resolve(sourceFile);
if (extname(sourcePath).toLowerCase() !== ".xlsx") {
  throw new Error("The legacy importer accepts an .xlsx workbook.");
}

const envPath = fileURLToPath(new URL("../../../apps/web/.env", import.meta.url));
dotenv.config({ path: envPath, quiet: true });

const connectionString = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Set DATABASE_URL_DIRECT or DATABASE_URL before running the import.");
}

const connection = new URL(connectionString);
const sql = neon(connectionString);
const sourceBytes = await readFile(sourcePath);
const sourceStat = await stat(sourcePath);
const sourceHash = createHash("sha256").update(sourceBytes).digest("hex");
const asOf = requestedAsOf ?? sourceStat.mtime.toISOString().slice(0, 10);

if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf) || Number.isNaN(Date.parse(`${asOf}T00:00:00Z`))) {
  throw new Error("--as-of must be a valid ISO date (YYYY-MM-DD).");
}

const asOfTimestamp = `${asOf}T12:00:00.000Z`;
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.load(sourceBytes);

const requiredSheets = ["Fixed Deposit", "Assets", "Real Estate", "INR", "EUR", "Commodities"];
for (const name of requiredSheets) {
  if (!workbook.getWorksheet(name)) throw new Error(`Required worksheet is missing: ${name}`);
}

function valueOf(cell) {
  const value = cell.value;
  if (value && typeof value === "object" && "result" in value) return value.result;
  return value;
}

function textOf(cell) {
  const text = cell.text?.trim();
  if (text) return text;
  const value = valueOf(cell);
  return value === null || value === undefined ? "" : String(value).trim();
}

function numberOf(cell, fallback = null) {
  const value = valueOf(cell);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const normalized = String(value ?? "")
    .replace(/,/g, "")
    .replace(/[^0-9.+-]/g, "");
  if (!normalized) return fallback;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function lastFour(cell) {
  const digits = textOf(cell).replace(/\D/g, "");
  return digits.length >= 4 ? digits.slice(-4) : null;
}

function isoDate(cell) {
  const value = valueOf(cell);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(Date.UTC(1899, 11, 30) + Math.round(value) * 86_400_000)
      .toISOString()
      .slice(0, 10);
  }
  const parsed = Date.parse(String(value ?? ""));
  if (Number.isNaN(parsed)) throw new Error(`Invalid workbook date: ${String(value)}`);
  return new Date(parsed).toISOString().slice(0, 10);
}

function stableUuid(namespace, key) {
  const bytes = createHash("sha256").update(`${namespace}\u0000${key}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function closeEnough(left, right, tolerance = 0.01) {
  return Math.abs(left - right) <= tolerance;
}

const inrSheet = workbook.getWorksheet("INR");
const eurSheet = workbook.getWorksheet("EUR");
const fixedDepositSheet = workbook.getWorksheet("Fixed Deposit");
const realEstateSheet = workbook.getWorksheet("Real Estate");
const commoditiesSheet = workbook.getWorksheet("Commodities");
const assetsSheet = workbook.getWorksheet("Assets");

const bankAccounts = [];
for (let rowNumber = 2; rowNumber <= inrSheet.rowCount; rowNumber += 1) {
  const row = inrSheet.getRow(rowNumber);
  const institution = textOf(row.getCell(1));
  const accountType = textOf(row.getCell(2));
  if (!institution || !accountType) continue;
  bankAccounts.push({
    institution,
    name: `${accountType} account`,
    accountType,
    accountLast4: lastFour(row.getCell(5)),
    currency: "INR",
    amount: numberOf(row.getCell(3), 0),
  });
}

for (let rowNumber = 2; rowNumber <= 7; rowNumber += 1) {
  const row = eurSheet.getRow(rowNumber);
  const institution = textOf(row.getCell(1));
  const accountType = textOf(row.getCell(2));
  if (!institution || !accountType) continue;
  bankAccounts.push({
    institution,
    name: `${accountType} account`,
    accountType,
    accountLast4: lastFour(row.getCell(3)),
    currency: "EUR",
    amount: numberOf(row.getCell(5), 0),
  });
}

const fixedDeposits = [];
for (let rowNumber = 2; rowNumber <= fixedDepositSheet.rowCount; rowNumber += 1) {
  const row = fixedDepositSheet.getRow(rowNumber);
  const bank = textOf(row.getCell(1));
  if (!bank) continue;
  const startDate = isoDate(row.getCell(7));
  const maturityDate = isoDate(row.getCell(6));
  fixedDeposits.push({
    sourceRow: rowNumber,
    bank,
    depositType: textOf(row.getCell(2)),
    accountLast4: lastFour(row.getCell(9)),
    principal: numberOf(row.getCell(3), 0),
    interestRate: numberOf(row.getCell(4), 0),
    projectedInterest: numberOf(row.getCell(5), 0),
    maturityDate,
    startDate,
    investmentDays: numberOf(row.getCell(8), 0),
    status: maturityDate < asOf ? "matured" : "active",
  });
}

const commodities = [];
for (let rowNumber = 2; rowNumber <= 4; rowNumber += 1) {
  const row = commoditiesSheet.getRow(rowNumber);
  const originalName = textOf(row.getCell(1));
  if (!originalName) continue;
  const quantityGrams = numberOf(row.getCell(3), 0);
  const ownershipShare = numberOf(row.getCell(4), 0);
  const amount = numberOf(row.getCell(6), 0);
  const commodityType = originalName.toLowerCase().includes("silver")
    ? "Silver"
    : originalName.toLowerCase().includes("sliver")
      ? "Silver"
      : "Gold";
  commodities.push({
    name: originalName.replace(/^Sliver\b/i, "Silver").trim(),
    commodityType,
    location: textOf(row.getCell(2))
      .replace(/\s*\(including [^)]+\)/i, "")
      .trim(),
    quantityGrams,
    ownershipShare,
    pricePerGram:
      quantityGrams > 0 && ownershipShare > 0 ? amount / quantityGrams / ownershipShare : 0,
    amount,
  });
}

const realEstate = [];
for (let rowNumber = 2; rowNumber <= realEstateSheet.rowCount; rowNumber += 1) {
  const row = realEstateSheet.getRow(rowNumber);
  const name = textOf(row.getCell(1));
  if (!name) continue;
  const areaSquareFeet = numberOf(row.getCell(6), 0);
  const marketValue = numberOf(row.getCell(9), 0);
  const legalValue = valueOf(row.getCell(8));
  realEstate.push({
    name,
    owner: textOf(row.getCell(2)),
    propertyType: textOf(row.getCell(3)),
    location: textOf(row.getCell(4)) || null,
    areaCents: numberOf(row.getCell(5), 0),
    areaSquareFeet,
    ownershipShare: numberOf(row.getCell(7), 0),
    legalStatus: legalValue === true ? "verified" : legalValue === false ? "pending" : "unknown",
    pricePerSquareFoot: areaSquareFeet > 0 ? marketValue / areaSquareFeet : 0,
    marketValue,
    currency: "INR",
  });
}

const carRow = commoditiesSheet.getRow(15);
const homeRow = commoditiesSheet.getRow(16);
const manualAssets = [
  {
    name: textOf(carRow.getCell(1)),
    assetType: "Vehicle",
    location: "Netherlands",
    riskLevel: "moderate",
    isLiquid: false,
    value: numberOf(carRow.getCell(4), 0),
    currency: "EUR",
    ownershipShare: numberOf(carRow.getCell(3), 0),
  },
].filter((asset) => asset.name);

if (textOf(homeRow.getCell(1))) {
  realEstate.push({
    name: textOf(homeRow.getCell(1)),
    owner: "Joint ownership",
    propertyType: "Home",
    location: "Netherlands",
    areaCents: 0,
    areaSquareFeet: 0,
    ownershipShare: numberOf(homeRow.getCell(3), 0),
    legalStatus: "unknown",
    pricePerSquareFoot: 0,
    marketValue: numberOf(homeRow.getCell(4), 0),
    currency: "EUR",
  });
}

const inrCashTotal = bankAccounts
  .filter((account) => account.currency === "INR")
  .reduce((sum, account) => sum + account.amount, 0);
const eurCashTotal = bankAccounts
  .filter((account) => account.currency === "EUR")
  .reduce((sum, account) => sum + account.amount, 0);
const fixedDepositTotal = fixedDeposits.reduce((sum, deposit) => sum + deposit.principal, 0);
const commodityTotal = commodities.reduce((sum, commodity) => sum + commodity.amount, 0);
const inrRealEstateTotal = realEstate
  .filter((property) => property.currency === "INR")
  .reduce((sum, property) => sum + property.marketValue, 0);

const expectedTotals = {
  inrCash: numberOf(assetsSheet.getCell("B8"), 0),
  fixedDeposits: numberOf(assetsSheet.getCell("B4"), 0),
  commodities: numberOf(assetsSheet.getCell("B7"), 0),
  inrRealEstate: numberOf(assetsSheet.getCell("B2"), 0),
};

const reconciliations = {
  inrCash: closeEnough(inrCashTotal, expectedTotals.inrCash),
  fixedDeposits: closeEnough(fixedDepositTotal, expectedTotals.fixedDeposits),
  commodities: closeEnough(commodityTotal, expectedTotals.commodities),
  inrRealEstate: closeEnough(inrRealEstateTotal, expectedTotals.inrRealEstate),
};

if (Object.values(reconciliations).some((matches) => !matches)) {
  throw new Error(`Workbook reconciliation failed: ${JSON.stringify(reconciliations)}`);
}

const eurCashInInr = numberOf(assetsSheet.getCell("B9"), 0);
const eurToInrRate = eurCashTotal > 0 ? eurCashInInr / eurCashTotal : null;
if (!eurToInrRate || !Number.isFinite(eurToInrRate) || eurToInrRate <= 0) {
  throw new Error("Could not derive the workbook EUR-to-INR conversion rate.");
}

const [targetUser] = await sql`
  select id, email, email_verified as "emailVerified"
  from "user"
  where lower(email) = lower(${email})
`;
if (!targetUser) throw new Error(`No user exists for ${email}. Sign in once before importing.`);

const [databaseIdentity] = await sql`
  select current_database() as database, current_schema() as schema
`;
const [beforeCounts] = await sql`
  select
    (select count(*)::int from bank_account where user_id = ${targetUser.id}) as "bankAccounts",
    (select count(*)::int from fixed_deposit where user_id = ${targetUser.id}) as "fixedDeposits",
    (select count(*)::int from commodity_holding where user_id = ${targetUser.id}) as commodities,
    (select count(*)::int from manual_asset where user_id = ${targetUser.id}) as "manualAssets",
    (select count(*)::int from real_estate_property where user_id = ${targetUser.id}) as "realEstate",
    (select count(*)::int from import_batch where user_id = ${targetUser.id}) as "brokerImportBatches",
    (select count(*)::int from ledger_entry where user_id = ${targetUser.id}) as "brokerLedgerEntries",
    (select count(*)::int from position_snapshot where user_id = ${targetUser.id}) as "brokerPositionSnapshots"
`;

const report = {
  mode: execute ? "execute" : "dry-run",
  target: {
    host: connection.hostname,
    database: databaseIdentity.database,
    schema: databaseIdentity.schema,
    email: targetUser.email,
  },
  workbook: {
    fileName: basename(sourcePath),
    sha256: sourceHash,
    asOf,
  },
  import: {
    bankAccounts: {
      total: bankAccounts.length,
      INR: bankAccounts.filter((account) => account.currency === "INR").length,
      EUR: bankAccounts.filter((account) => account.currency === "EUR").length,
    },
    fixedDeposits: fixedDeposits.length,
    commodities: commodities.length,
    realEstate: realEstate.length,
    manualAssets: manualAssets.length,
    exchangeRates: 1,
  },
  totals: {
    inrCash: inrCashTotal,
    eurCash: eurCashTotal,
    fixedDepositPrincipal: fixedDepositTotal,
    commodityValue: commodityTotal,
    inrRealEstateGrossValue: inrRealEstateTotal,
    eurToInrRate,
  },
  reconciliations,
  existing: beforeCounts,
  policy: {
    brokerSheets: "Preserved from existing broker imports; legacy derived rows are not duplicated.",
    credentials:
      "Passwords, PINs, user IDs, full account numbers, CIFs and card data are excluded.",
    rawWorkbook: "The source workbook is not stored in the database.",
  },
};

console.log(JSON.stringify(report, null, 2));

if (!execute) {
  console.log(
    `Dry run only. Execute with --execute, --confirm-email=${email}, and --expect-host=${connection.hostname}.`,
  );
  process.exit(0);
}

if (confirmedEmail !== email) {
  throw new Error(`Refusing import: --confirm-email must equal ${email}.`);
}
if (!expectedHost || expectedHost !== connection.hostname) {
  throw new Error(`Refusing import: --expect-host must equal ${connection.hostname}.`);
}

const namespace = `${targetUser.id}:${sourceHash}`;
const bankIds = bankAccounts.map((account) =>
  stableUuid(
    namespace,
    `bank:${account.currency}:${account.institution}:${account.name}:${account.accountLast4 ?? "none"}`,
  ),
);
const fixedDepositIds = fixedDeposits.map((deposit) =>
  stableUuid(
    namespace,
    `fixed-deposit:${deposit.sourceRow}:${deposit.bank}:${deposit.depositType}:${deposit.startDate}:${deposit.maturityDate}`,
  ),
);
const commodityIds = commodities.map((commodity) =>
  stableUuid(namespace, `commodity:${commodity.name}:${commodity.location}`),
);
const realEstateIds = realEstate.map((property) =>
  stableUuid(
    namespace,
    `real-estate:${property.name}:${property.owner}:${property.location ?? "none"}`,
  ),
);
const manualAssetIds = manualAssets.map((asset) =>
  stableUuid(namespace, `manual-asset:${asset.name}:${asset.assetType}`),
);

const transactionQueries = [];
transactionQueries.push(sql`
  insert into portfolio_preference (user_id, base_currency, locale, time_zone)
  values (${targetUser.id}, 'INR', 'en-IN', 'Europe/Amsterdam')
  on conflict (user_id) do nothing
`);

const exchangeRateId = stableUuid(namespace, `exchange-rate:INR:EUR:${asOf}`);
transactionQueries.push(sql`
  insert into exchange_rate_snapshot
    (id, user_id, base_currency, quote_currency, rate, as_of)
  values
    (${exchangeRateId}::uuid, ${targetUser.id}, 'INR', 'EUR', ${eurToInrRate}::numeric, ${asOfTimestamp}::timestamptz)
  on conflict (user_id, base_currency, quote_currency, as_of)
  do update set rate = excluded.rate
`);

for (const [index, account] of bankAccounts.entries()) {
  const id = bankIds[index];
  const snapshotId = stableUuid(namespace, `bank-snapshot:${id}:${asOf}`);
  transactionQueries.push(sql`
    insert into bank_account
      (id, user_id, institution, name, account_type, account_last4, currency, notes)
    values
      (${id}::uuid, ${targetUser.id}, ${account.institution}, ${account.name}, ${account.accountType}, ${account.accountLast4}, ${account.currency},
       'Imported from a legacy workbook; credentials and full identifiers were excluded.')
    on conflict (user_id, institution, name, currency)
    do update set
      account_type = excluded.account_type,
      account_last4 = excluded.account_last4,
      notes = excluded.notes,
      archived_at = null
  `);
  transactionQueries.push(sql`
    insert into bank_balance_snapshot (id, user_id, account_id, as_of, amount)
    select ${snapshotId}::uuid, ${targetUser.id}, id, ${asOfTimestamp}::timestamptz, ${account.amount}::numeric
    from bank_account
    where user_id = ${targetUser.id}
      and institution = ${account.institution}
      and name = ${account.name}
      and currency = ${account.currency}
    on conflict (account_id, as_of)
    do update set amount = excluded.amount
  `);
}

for (const [index, deposit] of fixedDeposits.entries()) {
  const id = fixedDepositIds[index];
  const snapshotId = stableUuid(namespace, `fixed-deposit-snapshot:${id}:${asOf}`);
  const notes = `Projected source interest: INR ${deposit.projectedInterest.toFixed(2)}; source term: ${deposit.investmentDays} days.`;
  transactionQueries.push(sql`
    insert into fixed_deposit
      (id, user_id, bank, deposit_type, account_last4, currency)
    values
      (${id}::uuid, ${targetUser.id}, ${deposit.bank}, ${deposit.depositType}, ${deposit.accountLast4}, 'INR')
    on conflict (id)
    do update set
      bank = excluded.bank,
      deposit_type = excluded.deposit_type,
      account_last4 = excluded.account_last4,
      archived_at = null
  `);
  transactionQueries.push(sql`
    insert into fixed_deposit_snapshot
      (id, user_id, fixed_deposit_id, as_of, principal, interest_rate, start_date, maturity_date,
       compounding_per_year, status, notes)
    values
      (${snapshotId}::uuid, ${targetUser.id}, ${id}::uuid, ${asOfTimestamp}::timestamptz,
       ${deposit.principal}::numeric, ${deposit.interestRate}::numeric, ${deposit.startDate}::date,
       ${deposit.maturityDate}::date, 4, ${deposit.status}, ${notes})
    on conflict (fixed_deposit_id, as_of)
    do update set
      principal = excluded.principal,
      interest_rate = excluded.interest_rate,
      start_date = excluded.start_date,
      maturity_date = excluded.maturity_date,
      compounding_per_year = excluded.compounding_per_year,
      status = excluded.status,
      notes = excluded.notes
  `);
}

for (const [index, commodity] of commodities.entries()) {
  const id = commodityIds[index];
  const snapshotId = stableUuid(namespace, `commodity-snapshot:${id}:${asOf}`);
  transactionQueries.push(sql`
    insert into commodity_holding (id, user_id, name, commodity_type, location)
    values (${id}::uuid, ${targetUser.id}, ${commodity.name}, ${commodity.commodityType}, ${commodity.location || null})
    on conflict (id)
    do update set
      name = excluded.name,
      commodity_type = excluded.commodity_type,
      location = excluded.location,
      archived_at = null
  `);
  transactionQueries.push(sql`
    insert into commodity_snapshot
      (id, user_id, commodity_holding_id, as_of, quantity_grams, ownership_share, price_per_gram, currency)
    values
      (${snapshotId}::uuid, ${targetUser.id}, ${id}::uuid, ${asOfTimestamp}::timestamptz,
       ${commodity.quantityGrams}::numeric, ${commodity.ownershipShare}::numeric,
       ${commodity.pricePerGram}::numeric, 'INR')
    on conflict (commodity_holding_id, as_of)
    do update set
      quantity_grams = excluded.quantity_grams,
      ownership_share = excluded.ownership_share,
      price_per_gram = excluded.price_per_gram,
      currency = excluded.currency
  `);
}

for (const [index, property] of realEstate.entries()) {
  const id = realEstateIds[index];
  const snapshotId = stableUuid(namespace, `real-estate-snapshot:${id}:${asOf}`);
  transactionQueries.push(sql`
    insert into real_estate_property
      (id, user_id, name, owner, property_type, location)
    values
      (${id}::uuid, ${targetUser.id}, ${property.name}, ${property.owner}, ${property.propertyType}, ${property.location})
    on conflict (user_id, name, owner, location)
    do update set
      property_type = excluded.property_type,
      archived_at = null
  `);
  transactionQueries.push(sql`
    insert into real_estate_snapshot
      (id, user_id, property_id, as_of, area_cents, area_square_feet, ownership_share,
       legal_status, price_per_square_foot, market_value, currency)
    select
      ${snapshotId}::uuid, ${targetUser.id}, id, ${asOfTimestamp}::timestamptz,
      ${property.areaCents}::numeric, ${property.areaSquareFeet}::numeric,
      ${property.ownershipShare}::numeric, ${property.legalStatus},
      ${property.pricePerSquareFoot}::numeric, ${property.marketValue}::numeric, ${property.currency}
    from real_estate_property
    where user_id = ${targetUser.id}
      and name = ${property.name}
      and owner = ${property.owner}
      and location is not distinct from ${property.location}
    on conflict (property_id, as_of)
    do update set
      area_cents = excluded.area_cents,
      area_square_feet = excluded.area_square_feet,
      ownership_share = excluded.ownership_share,
      legal_status = excluded.legal_status,
      price_per_square_foot = excluded.price_per_square_foot,
      market_value = excluded.market_value,
      currency = excluded.currency
  `);
}

for (const [index, asset] of manualAssets.entries()) {
  const id = manualAssetIds[index];
  const snapshotId = stableUuid(namespace, `manual-asset-snapshot:${id}:${asOf}`);
  transactionQueries.push(sql`
    insert into manual_asset
      (id, user_id, name, asset_type, location, risk_level, is_liquid, notes)
    values
      (${id}::uuid, ${targetUser.id}, ${asset.name}, ${asset.assetType}, ${asset.location},
       ${asset.riskLevel}, ${asset.isLiquid}, 'Imported from a legacy workbook.')
    on conflict (user_id, name)
    do update set
      asset_type = excluded.asset_type,
      location = excluded.location,
      risk_level = excluded.risk_level,
      is_liquid = excluded.is_liquid,
      notes = excluded.notes,
      archived_at = null
  `);
  transactionQueries.push(sql`
    insert into manual_asset_snapshot
      (id, user_id, asset_id, as_of, value, currency, ownership_share)
    select
      ${snapshotId}::uuid, ${targetUser.id}, id, ${asOfTimestamp}::timestamptz,
      ${asset.value}::numeric, ${asset.currency}, ${asset.ownershipShare}::numeric
    from manual_asset
    where user_id = ${targetUser.id} and name = ${asset.name}
    on conflict (asset_id, as_of)
    do update set
      value = excluded.value,
      currency = excluded.currency,
      ownership_share = excluded.ownership_share
  `);
}

const auditId = stableUuid(namespace, "audit:legacy-workbook-import");
const auditMetadata = JSON.stringify({
  sourceSha256: sourceHash,
  asOf,
  counts: report.import,
  excludedSensitiveFields: true,
  rawWorkbookStored: false,
});
transactionQueries.push(sql`
  insert into audit_event (id, user_id, action, entity_type, entity_id, metadata)
  values
    (${auditId}::uuid, ${targetUser.id}, 'imported', 'legacy_workbook', ${targetUser.id}, ${auditMetadata}::jsonb)
  on conflict (id)
  do update set metadata = excluded.metadata
`);

await sql.transaction(transactionQueries);

const [verifiedCounts] = await sql`
  select
    (select count(*)::int from bank_account where user_id = ${targetUser.id} and id = any(${bankIds}::uuid[])) as "bankAccounts",
    (select count(*)::int from fixed_deposit where user_id = ${targetUser.id} and id = any(${fixedDepositIds}::uuid[])) as "fixedDeposits",
    (select count(*)::int from commodity_holding where user_id = ${targetUser.id} and id = any(${commodityIds}::uuid[])) as commodities,
    (select count(*)::int from manual_asset where user_id = ${targetUser.id} and id = any(${manualAssetIds}::uuid[])) as "manualAssets",
    (select count(*)::int from real_estate_property where user_id = ${targetUser.id} and id = any(${realEstateIds}::uuid[])) as "realEstate",
    (select count(*)::int from exchange_rate_snapshot where user_id = ${targetUser.id} and id = ${exchangeRateId}::uuid) as "exchangeRates"
`;

const expectedCounts = {
  bankAccounts: bankAccounts.length,
  fixedDeposits: fixedDeposits.length,
  commodities: commodities.length,
  manualAssets: manualAssets.length,
  realEstate: realEstate.length,
  exchangeRates: 1,
};
const verified = Object.entries(expectedCounts).every(
  ([key, expected]) => verifiedCounts[key] === expected,
);

console.log(
  JSON.stringify({ verified, imported: verifiedCounts, expected: expectedCounts }, null, 2),
);
if (!verified) throw new Error("Legacy workbook import verification failed.");
