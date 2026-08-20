import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import ExcelJS from "exceljs";

const args = process.argv.slice(2);
const execute = args.includes("--execute");
const option = (name) => {
  const prefix = `--${name}=`;
  return args.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
};
const email = option("email")?.trim().toLowerCase();
const confirmedEmail = option("confirm-email")?.trim().toLowerCase();
const expectedHost = option("expect-host")?.trim();
const sourceFile = option("file");
const effectiveFrom = option("effective-from") ?? new Date().toISOString().slice(0, 10);
if (!email || !sourceFile) {
  throw new Error(
    "Usage: pnpm db:import-metals-inventory -- --email=user@example.com --file=/absolute/path/Metals.csv",
  );
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom))
  throw new Error("--effective-from must use YYYY-MM-DD.");
const sourcePath = resolve(sourceFile);
if (extname(sourcePath).toLowerCase() !== ".csv")
  throw new Error("The metals importer accepts a .csv file.");

const envPath = fileURLToPath(new URL("../../../apps/web/.env", import.meta.url));
dotenv.config({ path: envPath, quiet: true });
const connectionString = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;
if (!connectionString) throw new Error("Set DATABASE_URL_DIRECT or DATABASE_URL before importing.");
const connection = new URL(connectionString);
const sql = neon(connectionString);
const sourceBytes = await readFile(sourcePath);
const sourceHash = createHash("sha256").update(sourceBytes).digest("hex");
const workbook = new ExcelJS.Workbook();
await workbook.csv.readFile(sourcePath);
const sheet = workbook.worksheets[0];
if (!sheet) throw new Error("The CSV has no readable rows.");

const text = (cell) => String(cell.text || cell.value || "").trim();
const numeric = (value) => {
  const parsed = Number(String(value ?? "").replace(/[^0-9.+-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
};
const countAndUnit = (value) => {
  const raw = String(value ?? "").trim();
  const count = numeric(raw);
  const upper = raw.toUpperCase();
  return {
    count: count ?? 1,
    unit: upper.includes("PAIR") ? "pair" : upper.includes("SET") ? "set" : "piece",
  };
};
const slug = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const items = [];
let section = null;
let sequence = { Gold: 0, Silver: 0, Brass: 0 };
for (let rowNumber = 1; rowNumber <= sheet.rowCount; rowNumber += 1) {
  const row = sheet.getRow(rowNumber);
  const name = text(row.getCell(1));
  if (!name) continue;
  if (name.toUpperCase() === "PARTICULARS") {
    section = section === null ? "Gold" : "Brass";
    continue;
  }
  if (name.toUpperCase() === "NEW ITEM") {
    section = "Silver";
    continue;
  }
  if (!section) continue;
  const { count, unit } = countAndUnit(text(row.getCell(2)));
  const weight = section === "Brass" ? null : numeric(text(row.getCell(3)));
  if (count <= 0 || (section !== "Brass" && (weight === null || weight <= 0))) continue;
  sequence[section] += 1;
  const provenance =
    section === "Gold" ? text(row.getCell(5)) : section === "Silver" ? text(row.getCell(4)) : "";
  items.push({
    metal: section,
    name,
    count,
    unit,
    grossWeightGrams: weight,
    provenance: provenance || null,
    sourceKey: `metals-csv:${section.toLowerCase()}:${sequence[section]}:${slug(name)}`,
  });
}

const grouped = Object.groupBy(items, (item) => item.metal);
const sumWeight = (metal) =>
  (grouped[metal] ?? []).reduce((sum, item) => sum + (item.grossWeightGrams ?? 0), 0);
const totalUnits = (metal) => (grouped[metal] ?? []).reduce((sum, item) => sum + item.count, 0);
if ((grouped.Gold?.length ?? 0) !== 14 || Math.abs(sumWeight("Gold") - 231.45) > 0.001)
  throw new Error("Gold source validation failed.");
if ((grouped.Silver?.length ?? 0) !== 17 || Math.abs(sumWeight("Silver") - 2970.65) > 0.001)
  throw new Error("Silver source validation failed.");
if ((grouped.Brass?.length ?? 0) !== 11 || totalUnits("Brass") !== 15)
  throw new Error("Brass source validation failed.");

const [targetUser] = await sql`select id, email from "user" where lower(email) = ${email} limit 1`;
if (!targetUser) throw new Error(`No user exists for ${email}.`);
const holdings = await sql`
  select h.id, h.name, h.commodity_type as "commodityType", h.location,
    s.ownership_share::text as "ownershipShare"
  from commodity_holding h
  left join lateral (
    select ownership_share from commodity_snapshot
    where user_id = h.user_id and commodity_holding_id = h.id
    order by as_of desc limit 1
  ) s on true
  where h.user_id = ${targetUser.id} and h.archived_at is null
`;
const findHolding = (metal, namePattern) =>
  holdings.filter(
    (row) =>
      row.commodityType.toLowerCase() === metal.toLowerCase() &&
      row.name.toLowerCase().includes(namePattern),
  );
const goldMatches = findHolding("Gold", "marriage");
const silverMatches = findHolding("Silver", "marriage");
if (goldMatches.length !== 1 || silverMatches.length !== 1)
  throw new Error(
    "Expected exactly one Gold - Marriage and one Silver - marriage holding for the target user.",
  );

const stableUuid = (namespace, key) => {
  const bytes = createHash("sha256").update(`${namespace}\u0000${key}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};
const namespace = `selvam:metals-inventory:${targetUser.id}`;
const brassHoldingId = stableUuid(namespace, "holding:brass-household-inventory");
const holdingByMetal = {
  Gold: goldMatches[0],
  Silver: silverMatches[0],
  Brass: {
    id: brassHoldingId,
    name: "Brass - household inventory",
    location: null,
    ownershipShare: null,
  },
};

const report = {
  mode: execute ? "execute" : "dry-run",
  target: {
    email,
    userId: targetUser.id,
    host: connection.hostname,
    database: connection.pathname.slice(1),
  },
  effectiveFrom,
  source: { sha256: sourceHash, rawFileStored: false },
  inventory: {
    records: items.length,
    gold: {
      records: grouped.Gold.length,
      grossWeightGrams: sumWeight("Gold"),
      declaredWeightGrams: 300,
      gapGrams: 300 - sumWeight("Gold"),
    },
    silver: {
      records: grouped.Silver.length,
      grossWeightGrams: sumWeight("Silver"),
      declaredWeightGrams: 3000,
      gapGrams: 3000 - sumWeight("Silver"),
    },
    brass: {
      records: grouped.Brass.length,
      recordedUnits: totalUnits("Brass"),
      weightKnown: false,
    },
  },
  assumptions: {
    purity: null,
    brassWeight: null,
    fireEligible: false,
    liquidationFactor: null,
    provenanceIsNotOwnership: true,
  },
};
console.log(JSON.stringify(report, null, 2));
if (!execute) {
  console.log(
    `Dry run only. Execute with --execute, --confirm-email=${email}, and --expect-host=${connection.hostname}.`,
  );
  process.exit(0);
}
if (confirmedEmail !== email)
  throw new Error(`Refusing import: --confirm-email must equal ${email}.`);
if (expectedHost !== connection.hostname)
  throw new Error(`Refusing import: --expect-host must equal ${connection.hostname}.`);

const queries = [
  sql`
  insert into commodity_holding (id, user_id, name, commodity_type, location)
  values (${brassHoldingId}::uuid, ${targetUser.id}, 'Brass - household inventory', 'Brass', null)
  on conflict (id) do update set archived_at = null
`,
];
for (const item of items) {
  const holding = holdingByMetal[item.metal];
  const itemId = stableUuid(namespace, item.sourceKey);
  const ownershipShare = holding.ownershipShare == null ? null : Number(holding.ownershipShare);
  queries.push(sql`
    insert into commodity_inventory_item
      (id, user_id, commodity_holding_id, name, item_count, count_unit, provenance,
       location, eligible_for_fire, source_key)
    values (${itemId}::uuid, ${targetUser.id}, ${holding.id}::uuid, ${item.name},
      ${item.count}::numeric, ${item.unit}, ${item.provenance}, ${holding.location}, false,
      ${item.sourceKey})
    on conflict (user_id, source_key) do update set
      commodity_holding_id = excluded.commodity_holding_id, name = excluded.name,
      item_count = excluded.item_count, count_unit = excluded.count_unit,
      provenance = excluded.provenance, location = excluded.location,
      eligible_for_fire = false, archived_at = null, updated_at = now()
  `);
  queries.push(sql`
    insert into commodity_inventory_snapshot
      (id, user_id, item_id, as_of, gross_weight_grams, purity_fraction,
       ownership_share, liquidation_factor, appraisal_value, appraisal_currency, source)
    values (${stableUuid(namespace, `snapshot:${item.sourceKey}:${effectiveFrom}`)}::uuid,
      ${targetUser.id}, ${itemId}::uuid, ${effectiveFrom}::date,
      ${item.grossWeightGrams}::numeric, null, ${ownershipShare}::numeric, null, null, null,
      'metals_csv')
    on conflict (item_id, as_of) do update set
      gross_weight_grams = excluded.gross_weight_grams,
      ownership_share = excluded.ownership_share, source = excluded.source
  `);
}
queries.push(sql`
  insert into audit_event (id, user_id, action, entity_type, entity_id, metadata)
  values (${stableUuid(namespace, `audit:${sourceHash}:${effectiveFrom}`)}::uuid, ${targetUser.id},
    'imported', 'commodity_inventory', ${targetUser.id}, ${JSON.stringify({ sourceSha256: sourceHash, effectiveFrom, records: items.length, goldGrossWeightGrams: sumWeight("Gold"), silverGrossWeightGrams: sumWeight("Silver"), brassRecordedUnits: totalUnits("Brass"), rawFileStored: false, unknownValuesPreserved: true, fireEligible: false })}::jsonb)
  on conflict (id) do update set metadata = excluded.metadata
`);
await sql.transaction(queries);

const sourceKeys = items.map((item) => item.sourceKey);
const [verified] = await sql`
  select
    count(*)::int as records,
    coalesce(sum(s.gross_weight_grams) filter (where h.commodity_type = 'Gold'), 0)::text as "goldWeight",
    coalesce(sum(s.gross_weight_grams) filter (where h.commodity_type = 'Silver'), 0)::text as "silverWeight",
    coalesce(sum(i.item_count) filter (where h.commodity_type = 'Brass'), 0)::text as "brassUnits",
    count(*) filter (where i.eligible_for_fire)::int as "fireEligible",
    count(*) filter (where s.purity_fraction is not null)::int as "purityKnown",
    count(*) filter (where i.user_id <> s.user_id or i.user_id <> h.user_id)::int as "ownershipMismatches"
  from commodity_inventory_item i
  join commodity_inventory_snapshot s on s.item_id = i.id and s.user_id = i.user_id and s.as_of = ${effectiveFrom}::date
  join commodity_holding h on h.id = i.commodity_holding_id and h.user_id = i.user_id
  where i.user_id = ${targetUser.id} and i.source_key = any(${sourceKeys}::text[])
`;
const ok =
  verified.records === 42 &&
  Math.abs(Number(verified.goldWeight) - 231.45) < 0.001 &&
  Math.abs(Number(verified.silverWeight) - 2970.65) < 0.001 &&
  Number(verified.brassUnits) === 15 &&
  verified.fireEligible === 0 &&
  verified.purityKnown === 0 &&
  verified.ownershipMismatches === 0;
console.log(JSON.stringify({ verified: ok, imported: verified }, null, 2));
if (!ok) throw new Error("Metals inventory import verification failed.");
