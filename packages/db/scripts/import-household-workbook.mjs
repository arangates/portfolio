import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
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
    "Usage: pnpm db:import-household-workbook -- --email=user@example.com --file=/absolute/path/Housing.xlsx",
  );
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom)) {
  throw new Error("--effective-from must use YYYY-MM-DD.");
}
const sourcePath = resolve(sourceFile);
if (extname(sourcePath).toLowerCase() !== ".xlsx") {
  throw new Error("The household importer accepts an .xlsx workbook.");
}

const envPath = fileURLToPath(new URL("../../../apps/web/.env", import.meta.url));
dotenv.config({ path: envPath, quiet: true });
const connectionString = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;
if (!connectionString) throw new Error("Set DATABASE_URL_DIRECT or DATABASE_URL before importing.");
const connection = new URL(connectionString);
const sql = neon(connectionString);
const sourceBytes = await readFile(sourcePath);
const sourceHash = createHash("sha256").update(sourceBytes).digest("hex");
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.load(sourceBytes);
for (const name of [
  "Housing",
  "Worst case scenario",
  "Vacation",
  "Monthly",
  "Mandatory",
  "Service contracts",
  "House setup expenses",
  "Car",
]) {
  if (!workbook.getWorksheet(name)) throw new Error(`Required worksheet is missing: ${name}`);
}

function valueOf(cell) {
  const value = cell.value;
  if (value && typeof value === "object" && "result" in value) return value.result;
  return value;
}

function textOf(cell) {
  const displayed = cell.text;
  if (typeof displayed === "string" && displayed.trim()) return displayed.trim();
  const value = valueOf(cell);
  if (value && typeof value === "object" && "richText" in value) {
    return value.richText
      .map((part) => part.text ?? "")
      .join("")
      .trim();
  }
  return value === null || value === undefined ? "" : String(value).trim();
}

function numberOf(cell, fallback = null) {
  const value = valueOf(cell);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  let normalized = String(value ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(/[€$£]/g, "");
  if (normalized.includes(",") && !normalized.includes("."))
    normalized = normalized.replace(",", ".");
  else normalized = normalized.replace(/,/g, "");
  normalized = normalized.replace(/[^0-9.+-]/g, "");
  if (!normalized || normalized === "+" || normalized === "-") return fallback;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function excelDate(serial) {
  return new Date(Date.UTC(1899, 11, 30) + serial * 86_400_000).toISOString().slice(0, 10);
}

function dateOf(cell) {
  const value = valueOf(cell);
  if (value instanceof Date && !Number.isNaN(value.getTime()))
    return value.toISOString().slice(0, 10);
  if (typeof value === "number" && value > 20_000 && value < 100_000) return excelDate(value);
  const text = String(value ?? "").trim();
  const numeric = Number(text);
  if (Number.isFinite(numeric) && numeric > 20_000 && numeric < 100_000) return excelDate(numeric);
  const dmy = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const [, day, month, year] = dmy;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  const named = new Date(text);
  return Number.isNaN(named.getTime()) ? null : named.toISOString().slice(0, 10);
}

function stableUuid(namespace, key) {
  const bytes = createHash("sha256").update(`${namespace}\u0000${key}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const sum = (lines, flowType) =>
  lines
    .filter((line) => line.flowType === flowType)
    .reduce((total, line) => total + line.monthlyAmount, 0);
const monthlySheet = workbook.getWorksheet("Monthly");
const housingSheet = workbook.getWorksheet("Housing");
const mandatorySheet = workbook.getWorksheet("Mandatory");
const vacationSheet = workbook.getWorksheet("Vacation");
const worstSheet = workbook.getWorksheet("Worst case scenario");
const contractsSheet = workbook.getWorksheet("Service contracts");
const setupSheet = workbook.getWorksheet("House setup expenses");
const carSheet = workbook.getWorksheet("Car");

const flexibleNames = new Set([
  "Weekend",
  "Online shopping",
  "Miscellaneous",
  "Restaurants - varies",
  "Online shopping - Veda",
]);
const monthlyExpenses = [];
for (let rowNumber = 2; rowNumber <= monthlySheet.rowCount; rowNumber += 1) {
  const row = monthlySheet.getRow(rowNumber);
  const name = textOf(row.getCell(1)).trim();
  const monthlyAmount = numberOf(row.getCell(3));
  if (!name || monthlyAmount === null || monthlyAmount < 0) continue;
  monthlyExpenses.push({
    name,
    category: textOf(row.getCell(2)) || "Other",
    flowType: "expense",
    monthlyAmount,
    essential: !flexibleNames.has(name),
    notes: textOf(row.getCell(4)) || null,
    sourceKey: `monthly:${rowNumber}:${name}`,
  });
}
const refunds = [
  {
    name: textOf(housingSheet.getCell("A3")) || "Baby allowance",
    category: "Government support",
    flowType: "refund",
    monthlyAmount: numberOf(housingSheet.getCell("B3"), 0),
    essential: false,
    notes: "SVB and childcare-benefit allowance.",
    sourceKey: "housing:refund:baby-allowance",
  },
  {
    name: textOf(housingSheet.getCell("A4")) || "Housing refund",
    category: "Government support",
    flowType: "refund",
    monthlyAmount: numberOf(housingSheet.getCell("B4"), 0),
    essential: false,
    notes: "Mortgage-related housing refund.",
    sourceKey: "housing:refund:housing",
  },
];
const budgetItems = [...monthlyExpenses, ...refunds];

const minimumLines = [];
for (let rowNumber = 2; rowNumber <= mandatorySheet.rowCount; rowNumber += 1) {
  const row = mandatorySheet.getRow(rowNumber);
  const name = textOf(row.getCell(1)).trim();
  const monthlyAmount = numberOf(row.getCell(3));
  if (!name || monthlyAmount === null || monthlyAmount <= 0) continue;
  minimumLines.push({
    name,
    category: textOf(row.getCell(2)) || "Other",
    flowType: "expense",
    monthlyAmount,
    essential: true,
    notes: textOf(row.getCell(4)) || null,
    sourceKey: `minimum:${rowNumber}:${name}`,
  });
}
minimumLines.push(
  {
    name: textOf(vacationSheet.getCell("A3")) || "Baby allowance",
    category: "Government support",
    flowType: "refund",
    monthlyAmount: numberOf(vacationSheet.getCell("B3"), 0),
    essential: false,
    notes: "Allowance assumed during the minimum / away scenario.",
    sourceKey: "minimum:refund:baby-allowance",
  },
  {
    name: textOf(vacationSheet.getCell("A4")) || "Housing refund",
    category: "Government support",
    flowType: "refund",
    monthlyAmount: numberOf(vacationSheet.getCell("B4"), 0),
    essential: false,
    notes: "Housing refund assumed during the minimum / away scenario.",
    sourceKey: "minimum:refund:housing",
  },
);
const worstLines = monthlyExpenses.map((line) => ({
  ...line,
  sourceKey: `worst:${line.sourceKey}`,
}));
worstLines.push(
  {
    name: textOf(worstSheet.getCell("A3")) || "Extra daycare cost",
    category: "Daycare",
    flowType: "expense",
    monthlyAmount: numberOf(worstSheet.getCell("B3"), 0),
    essential: true,
    notes: "Additional daycare cost in the stress scenario.",
    sourceKey: "worst:extra-daycare",
  },
  {
    name: textOf(worstSheet.getCell("A4")) || "Baby allowance",
    category: "Government support",
    flowType: "refund",
    monthlyAmount: numberOf(worstSheet.getCell("B4"), 0),
    essential: false,
    notes: "Allowance assumed in the stress scenario.",
    sourceKey: "worst:refund:baby-allowance",
  },
  {
    name: textOf(worstSheet.getCell("A5")) || "Housing refund",
    category: "Government support",
    flowType: "refund",
    monthlyAmount: numberOf(worstSheet.getCell("B5"), 0),
    essential: false,
    notes: "Housing refund assumed in the stress scenario.",
    sourceKey: "worst:refund:housing",
  },
);

const billingDay = (text) => {
  const value = Number(text.match(/\d{1,2}/)?.[0]);
  return value >= 1 && value <= 31 ? value : null;
};
const durationMonths = (text) => {
  const match = text.match(/(\d+)\s*(year|month)/i);
  if (!match) return null;
  return Number(match[1]) * (match[2].toLowerCase().startsWith("year") ? 12 : 1);
};
const budgetNameAliases = new Map([
  ["electricity , gas", "Electricity & Gas"],
  ["internet", "Internet"],
  ["mortgage", "Mortgage"],
  ["home insurance", "Home insurance"],
  ["road side assistance", "Road side Assistance"],
  ["car insurance", "Car insurance"],
  ["water", "Water tax"],
]);
const contracts = [];
for (let rowNumber = 2; rowNumber <= contractsSheet.rowCount; rowNumber += 1) {
  const row = contractsSheet.getRow(rowNumber);
  const service = textOf(row.getCell(1));
  const provider = textOf(row.getCell(2));
  if (!service || !provider) continue;
  const durationText = textOf(row.getCell(7));
  const endText = textOf(row.getCell(6));
  const terminated = /terminated/i.test(service);
  contracts.push({
    service: service.replace(/\s+-\s+terminated$/i, "").trim(),
    provider,
    budgetItemName: budgetNameAliases.get(service.toLowerCase()) ?? null,
    monthlyCost: numberOf(row.getCell(3)),
    billingDay: billingDay(textOf(row.getCell(4))),
    contractEndDate: /∞|indefinite/i.test(endText) ? null : dateOf(row.getCell(6)),
    durationMonths: durationMonths(durationText),
    renewalType: /∞|indefinite/i.test(endText)
      ? "indefinite"
      : durationText
        ? "automatic"
        : "unknown",
    status: terminated ? "ended" : "active",
    notes: terminated
      ? "Marked terminated in the source workbook. Client numbers and login identifiers were not imported."
      : "Client numbers and login identifiers were not imported.",
    sourceKey: `contract:${rowNumber}:${service}:${provider}`,
  });
}

function setupCategory(name) {
  if (/notary|makelaar|advisor|appraiser|financieel/i.test(name))
    return "Transaction & professional";
  if (/mover|exit dieze/i.test(name)) return "Moving";
  if (/garden/i.test(name)) return "Garden";
  return "Furnishing & appliances";
}
const purchases = [];
for (let rowNumber = 2; rowNumber <= setupSheet.rowCount; rowNumber += 1) {
  const row = setupSheet.getRow(rowNumber);
  const name = textOf(row.getCell(1));
  const amount = numberOf(row.getCell(2));
  if (!name || /total/i.test(name) || amount === null || amount <= 0) continue;
  purchases.push({
    name,
    scope: "house_setup",
    category: setupCategory(name),
    vendor: name,
    amount,
    currency: "EUR",
    purchasedOn: dateOf(row.getCell(4)),
    paymentSource: textOf(row.getCell(5)) || null,
    notes: null,
    sourceKey: `house-setup:${rowNumber}:${name}`,
  });
}
for (let rowNumber = 1; rowNumber <= carSheet.rowCount; rowNumber += 1) {
  const row = carSheet.getRow(rowNumber);
  const rawName = textOf(row.getCell(1));
  const amount = numberOf(row.getCell(2));
  if (!rawName || amount === null || amount <= 0) continue;
  const isPurchase = rowNumber === 1;
  purchases.push({
    name: isPurchase ? `Vehicle purchase – ${rawName}` : rawName,
    scope: "car",
    category: isPurchase ? "Purchase" : /apk/i.test(rawName) ? "Inspection" : "Maintenance",
    vendor: isPurchase ? rawName : null,
    amount,
    currency: "EUR",
    purchasedOn: dateOf(row.getCell(4)),
    paymentSource: textOf(row.getCell(5)) || null,
    notes: null,
    sourceKey: `car:${rowNumber}:${rawName}`,
  });
}

const baselineGross = sum(budgetItems, "expense");
const baselineRefunds = sum(budgetItems, "refund");
const minimumGross = sum(minimumLines, "expense");
const minimumRefunds = sum(minimumLines, "refund");
const worstGross = sum(worstLines, "expense");
const worstRefunds = sum(worstLines, "refund");
const setupTotal = purchases
  .filter((purchase) => purchase.scope === "house_setup")
  .reduce((total, purchase) => total + purchase.amount, 0);
const carTotal = purchases
  .filter((purchase) => purchase.scope === "car")
  .reduce((total, purchase) => total + purchase.amount, 0);
const [targetUser] = await sql`select id, email from "user" where lower(email) = lower(${email})`;
if (!targetUser) throw new Error(`No user exists for ${email}. Sign in once before importing.`);
const [identity] = await sql`select current_database() as database, current_schema() as schema`;
const report = {
  mode: execute ? "execute" : "dry-run",
  target: {
    host: connection.hostname,
    database: identity.database,
    schema: identity.schema,
    email: targetUser.email,
  },
  workbook: { fileName: basename(sourcePath), sha256: sourceHash, effectiveFrom },
  import: {
    budgetItems: budgetItems.length,
    scenarios: 3,
    scenarioLines: minimumLines.length + worstLines.length,
    serviceContracts: contracts.length,
    purchases: purchases.length,
  },
  monthly: {
    grossExpenses: baselineGross,
    refunds: baselineRefunds,
    netHouseholdCost: baselineGross - baselineRefunds,
    perAdult: (baselineGross - baselineRefunds) / 2,
  },
  scenarios: {
    minimum: {
      grossExpenses: minimumGross,
      refunds: minimumRefunds,
      netHouseholdCost: minimumGross - minimumRefunds,
      perAdult: (minimumGross - minimumRefunds) / 2,
    },
    worst: {
      grossExpenses: worstGross,
      refunds: worstRefunds,
      netHouseholdCost: worstGross - worstRefunds,
      perAdult: (worstGross - worstRefunds) / 2,
    },
  },
  oneTime: { houseSetup: setupTotal, car: carTotal, total: setupTotal + carTotal },
  corrections: [
    "The baseline sums every Monthly row rather than the Housing formula's partial C2:C7 range.",
    "Scenario refunds are deducted once at household level before dividing by two adults.",
  ],
  excluded: [
    "Client numbers and login identifiers from Service contracts",
    "Broken Bunq formulas and contribution ledgers",
    "Historical house-search links, mover inventory, solar estimates, and plant spending",
    "Raw workbook bytes",
  ],
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
if (!expectedHost || expectedHost !== connection.hostname) {
  throw new Error(`Refusing import: --expect-host must equal ${connection.hostname}.`);
}

const namespace = `${targetUser.id}:household-workbook`;
const budgetIds = new Map(
  budgetItems.map((item) => [item.name, stableUuid(namespace, `budget:${item.sourceKey}`)]),
);
const scenarioDefinitions = [
  {
    key: "current",
    name: "Current household",
    type: "baseline",
    description: "All current monthly expenses and refunds.",
    usesCurrentBudget: true,
    isDefault: true,
    lines: [],
  },
  {
    key: "minimum",
    name: "Away / minimum",
    type: "minimum",
    description: "Costs that continue while the household is away, plus applicable refunds.",
    usesCurrentBudget: false,
    isDefault: false,
    lines: minimumLines,
  },
  {
    key: "worst",
    name: "Daycare stress case",
    type: "worst",
    description: "Current budget with extra daycare cost, changed allowance and no housing refund.",
    usesCurrentBudget: false,
    isDefault: false,
    lines: worstLines,
  },
];
const scenarioIds = new Map(
  scenarioDefinitions.map((scenario) => [
    scenario.key,
    stableUuid(namespace, `scenario:${scenario.key}`),
  ]),
);
const queries = [];
queries.push(sql`
  insert into household_profile (user_id, name, currency, adults_count)
  values (${targetUser.id}, 'Netherlands household', 'EUR', 2)
  on conflict (user_id) do update set
    name = excluded.name, currency = excluded.currency, adults_count = excluded.adults_count,
    updated_at = now()
`);
for (const item of budgetItems) {
  const id = budgetIds.get(item.name);
  queries.push(sql`
    insert into household_budget_item
      (id, user_id, name, category, flow_type, essential, notes, source_key)
    values (${id}::uuid, ${targetUser.id}, ${item.name}, ${item.category}, ${item.flowType},
      ${item.essential}, ${item.notes}, ${item.sourceKey})
    on conflict (user_id, source_key) do update set
      name = excluded.name, category = excluded.category, flow_type = excluded.flow_type,
      essential = excluded.essential, notes = excluded.notes, archived_at = null, updated_at = now()
  `);
  queries.push(sql`
    insert into household_budget_snapshot
      (id, user_id, item_id, effective_from, monthly_amount, source)
    values (${stableUuid(namespace, `budget-snapshot:${item.sourceKey}:${effectiveFrom}`)}::uuid,
      ${targetUser.id}, ${id}::uuid, ${effectiveFrom}::date, ${item.monthlyAmount}::numeric,
      'housing_workbook')
    on conflict (item_id, effective_from) do update set
      monthly_amount = excluded.monthly_amount, source = excluded.source
  `);
}
for (const scenario of scenarioDefinitions) {
  const scenarioId = scenarioIds.get(scenario.key);
  queries.push(sql`
    insert into household_scenario
      (id, user_id, name, scenario_type, description, adults_count, uses_current_budget, is_default)
    values (${scenarioId}::uuid, ${targetUser.id}, ${scenario.name}, ${scenario.type},
      ${scenario.description}, 2, ${scenario.usesCurrentBudget}, ${scenario.isDefault})
    on conflict (user_id, name) do update set
      scenario_type = excluded.scenario_type, description = excluded.description,
      adults_count = excluded.adults_count, uses_current_budget = excluded.uses_current_budget,
      is_default = excluded.is_default, archived_at = null, updated_at = now()
  `);
  for (const [index, line] of scenario.lines.entries()) {
    const sourceKey = `scenario:${scenario.key}:${line.sourceKey}`;
    queries.push(sql`
      insert into household_scenario_line
        (id, user_id, scenario_id, name, category, flow_type, monthly_amount, essential,
         notes, sort_order, source_key)
      values (${stableUuid(namespace, sourceKey)}::uuid, ${targetUser.id}, ${scenarioId}::uuid,
        ${line.name}, ${line.category}, ${line.flowType}, ${line.monthlyAmount}::numeric,
        ${line.essential}, ${line.notes}, ${index + 1}, ${sourceKey})
      on conflict (user_id, source_key) do update set
        scenario_id = excluded.scenario_id, name = excluded.name, category = excluded.category,
        flow_type = excluded.flow_type, monthly_amount = excluded.monthly_amount,
        essential = excluded.essential, notes = excluded.notes, sort_order = excluded.sort_order,
        archived_at = null, updated_at = now()
    `);
  }
}
for (const contract of contracts) {
  const contractId = stableUuid(namespace, contract.sourceKey);
  const budgetItemId = contract.budgetItemName
    ? (budgetIds.get(contract.budgetItemName) ?? null)
    : null;
  queries.push(sql`
    insert into household_service_contract
      (id, user_id, budget_item_id, service, provider, source_key)
    values (${contractId}::uuid, ${targetUser.id}, ${budgetItemId}::uuid, ${contract.service},
      ${contract.provider}, ${contract.sourceKey})
    on conflict (user_id, source_key) do update set
      budget_item_id = excluded.budget_item_id, service = excluded.service,
      provider = excluded.provider, archived_at = null, updated_at = now()
  `);
  queries.push(sql`
    insert into household_service_contract_snapshot
      (id, user_id, contract_id, effective_from, monthly_cost, billing_day,
       contract_end_date, duration_months, renewal_type, status, notes, source)
    values (${stableUuid(namespace, `contract-snapshot:${contract.sourceKey}:${effectiveFrom}`)}::uuid,
      ${targetUser.id}, ${contractId}::uuid, ${effectiveFrom}::date,
      ${contract.monthlyCost}::numeric, ${contract.billingDay}, ${contract.contractEndDate}::date,
      ${contract.durationMonths}, ${contract.renewalType}, ${contract.status}, ${contract.notes},
      'housing_workbook')
    on conflict (contract_id, effective_from) do update set
      monthly_cost = excluded.monthly_cost, billing_day = excluded.billing_day,
      contract_end_date = excluded.contract_end_date, duration_months = excluded.duration_months,
      renewal_type = excluded.renewal_type, status = excluded.status, notes = excluded.notes,
      source = excluded.source
  `);
}
for (const purchase of purchases) {
  queries.push(sql`
    insert into household_purchase
      (id, user_id, name, scope, category, vendor, amount, currency, purchased_on,
       payment_source, notes, source_key)
    values (${stableUuid(namespace, purchase.sourceKey)}::uuid, ${targetUser.id}, ${purchase.name},
      ${purchase.scope}, ${purchase.category}, ${purchase.vendor}, ${purchase.amount}::numeric,
      ${purchase.currency}, ${purchase.purchasedOn}::date, ${purchase.paymentSource},
      ${purchase.notes}, ${purchase.sourceKey})
    on conflict (user_id, source_key) do update set
      name = excluded.name, scope = excluded.scope, category = excluded.category,
      vendor = excluded.vendor, amount = excluded.amount, currency = excluded.currency,
      purchased_on = excluded.purchased_on, payment_source = excluded.payment_source,
      notes = excluded.notes, archived_at = null, updated_at = now()
  `);
}
const auditId = stableUuid(namespace, `audit:${sourceHash}`);
queries.push(sql`
  insert into audit_event (id, user_id, action, entity_type, entity_id, metadata)
  values (${auditId}::uuid, ${targetUser.id}, 'imported', 'household_workbook', ${targetUser.id},
    ${JSON.stringify({
      sourceSha256: sourceHash,
      effectiveFrom,
      counts: report.import,
      monthly: report.monthly,
      oneTime: report.oneTime,
      sensitiveColumnsStored: false,
      rawWorkbookStored: false,
    })}::jsonb)
  on conflict (id) do update set metadata = excluded.metadata
`);
await sql.transaction(queries);

const budgetSourceKeys = budgetItems.map((item) => item.sourceKey);
const scenarioSourceKeys = scenarioDefinitions.flatMap((scenario) =>
  scenario.lines.map((line) => `scenario:${scenario.key}:${line.sourceKey}`),
);
const contractSourceKeys = contracts.map((contract) => contract.sourceKey);
const purchaseSourceKeys = purchases.map((purchase) => purchase.sourceKey);
const [verified] = await sql`
  select
    (select count(*)::int from household_budget_item where user_id = ${targetUser.id} and source_key = any(${budgetSourceKeys}::text[])) as "budgetItems",
    (select count(*)::int from household_scenario where user_id = ${targetUser.id} and name = any(${scenarioDefinitions.map((scenario) => scenario.name)}::text[])) as scenarios,
    (select count(*)::int from household_scenario_line where user_id = ${targetUser.id} and source_key = any(${scenarioSourceKeys}::text[])) as "scenarioLines",
    (select count(*)::int from household_service_contract where user_id = ${targetUser.id} and source_key = any(${contractSourceKeys}::text[])) as contracts,
    (select count(*)::int from household_purchase where user_id = ${targetUser.id} and source_key = any(${purchaseSourceKeys}::text[])) as purchases,
    (select coalesce(sum(s.monthly_amount) filter (where i.flow_type = 'expense'), 0)::text from household_budget_item i join household_budget_snapshot s on s.item_id = i.id and s.user_id = i.user_id where i.user_id = ${targetUser.id} and i.source_key = any(${budgetSourceKeys}::text[]) and s.effective_from = ${effectiveFrom}::date) as "grossMonthly",
    (select coalesce(sum(s.monthly_amount) filter (where i.flow_type = 'refund'), 0)::text from household_budget_item i join household_budget_snapshot s on s.item_id = i.id and s.user_id = i.user_id where i.user_id = ${targetUser.id} and i.source_key = any(${budgetSourceKeys}::text[]) and s.effective_from = ${effectiveFrom}::date) as "monthlyRefunds",
    (select coalesce(sum(amount), 0)::text from household_purchase where user_id = ${targetUser.id} and source_key = any(${purchaseSourceKeys}::text[])) as "purchaseTotal",
    (
      (select count(*) from household_budget_snapshot s join household_budget_item i on i.id = s.item_id where s.user_id = ${targetUser.id} and i.user_id <> s.user_id) +
      (select count(*) from household_scenario_line l join household_scenario s on s.id = l.scenario_id where l.user_id = ${targetUser.id} and s.user_id <> l.user_id) +
      (select count(*) from household_service_contract_snapshot t join household_service_contract c on c.id = t.contract_id where t.user_id = ${targetUser.id} and c.user_id <> t.user_id)
    )::int as "ownershipMismatches"
`;
const ok =
  verified.budgetItems === budgetItems.length &&
  verified.scenarios === scenarioDefinitions.length &&
  verified.scenarioLines === scenarioSourceKeys.length &&
  verified.contracts === contracts.length &&
  verified.purchases === purchases.length &&
  Number(verified.grossMonthly) === baselineGross &&
  Number(verified.monthlyRefunds) === baselineRefunds &&
  Number(verified.purchaseTotal) === setupTotal + carTotal &&
  verified.ownershipMismatches === 0;
console.log(JSON.stringify({ verified: ok, imported: verified }, null, 2));
if (!ok) throw new Error("Household workbook import verification failed.");
