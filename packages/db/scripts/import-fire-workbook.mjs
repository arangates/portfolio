import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
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
const requestedPlanningYear = option("planning-year");

if (!email || !sourceFile) {
  throw new Error(
    "Usage: pnpm db:import-fire-workbook -- --email=user@example.com --file=/absolute/path/FIRE.xlsx",
  );
}

const sourcePath = resolve(sourceFile);
if (extname(sourcePath).toLowerCase() !== ".xlsx") {
  throw new Error("The FIRE importer accepts an .xlsx workbook.");
}

const planningYear = requestedPlanningYear
  ? Number(requestedPlanningYear)
  : new Date().getUTCFullYear();
if (!Number.isInteger(planningYear) || planningYear < 2020 || planningYear > 2200) {
  throw new Error("--planning-year must be a year between 2020 and 2200.");
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
for (const name of ["Dashboard", "Expenses", "Family Overview", "Simulation", "Non-recurring"]) {
  if (!workbook.getWorksheet(name)) throw new Error(`Required worksheet is missing: ${name}`);
}

function valueOf(cell) {
  const value = cell.value;
  if (value && typeof value === "object" && "result" in value) return value.result;
  return value;
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

function textOf(cell) {
  const displayed = cell.text;
  if (typeof displayed === "string" && displayed.trim()) return displayed.trim();
  if (typeof displayed === "number" && Number.isFinite(displayed)) return String(displayed);
  const value = valueOf(cell);
  if (value && typeof value === "object" && "richText" in value) {
    return value.richText
      .map((part) => (typeof part.text === "string" ? part.text : ""))
      .join("")
      .trim();
  }
  return value === null || value === undefined ? "" : String(value).trim();
}

function birthDateFromAgeFormula(cell) {
  const value = cell.value;
  const formula = value && typeof value === "object" && "formula" in value ? value.formula : "";
  const dateFunction = formula.match(/DATE\(\s*(\d{4})\s*,\s*(\d{1,2})\s*,\s*(\d{1,2})\s*\)/i);
  if (dateFunction) {
    const [, year, month, day] = dateFunction;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  const quotedUsDate = formula.match(/["'](\d{1,2})\/(\d{1,2})\/(\d{4})["']/);
  if (!quotedUsDate) return null;
  const [, month, day, year] = quotedUsDate;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function stableUuid(namespace, key) {
  const bytes = createHash("sha256").update(`${namespace}\u0000${key}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const dashboard = workbook.getWorksheet("Dashboard");
const expensesSheet = workbook.getWorksheet("Expenses");
const familySheet = workbook.getWorksheet("Family Overview");
const simulationSheet = workbook.getWorksheet("Simulation");
const oneTimeSheet = workbook.getWorksheet("Non-recurring");

const yearsUntilRetirement = numberOf(dashboard.getCell("B6"), 10);
const retirementYear = planningYear + yearsUntilRetirement;
const planEndAge = numberOf(dashboard.getCell("B2"), 95);
const inflationRate = numberOf(dashboard.getCell("B3"), 0.03);
const expectedReturnRate = numberOf(dashboard.getCell("B4"), 0.06);
const ownerBirthDate = birthDateFromAgeFormula(dashboard.getCell("B5"));
const monthlySavingsEur =
  numberOf(familySheet.getCell("B5"), 0) + numberOf(familySheet.getCell("C5"), 0);
const annualSavingsEur = Math.round(monthlySavingsEur * 12 * 100) / 100;

const selfName = textOf(familySheet.getCell("B4")) || "Account owner";
const partnerName = textOf(familySheet.getCell("C4")) || "Partner";
const childName =
  textOf(simulationSheet.getCell("C1"))
    .replace(/\s+Age$/i, "")
    .trim() || "Child";
const selfNetWorth = numberOf(familySheet.getCell("B6"), 0);
const partnerNetWorth = numberOf(familySheet.getCell("C6"), 0);
const childBirthYear = numberOf(simulationSheet.getCell("A2"), planningYear);
const childExpenseEndYear = childBirthYear + 22;

const members = [
  {
    name: selfName,
    relationship: "self",
    birthDate: ownerBirthDate,
    linkedToPortfolio: true,
    netWorth: selfNetWorth,
    investableAssets: 0,
    annualNetIncome: 0,
    currency: "INR",
  },
  {
    name: partnerName,
    relationship: "partner",
    birthDate: null,
    linkedToPortfolio: false,
    netWorth: partnerNetWorth,
    investableAssets: partnerNetWorth,
    annualNetIncome: 0,
    currency: "INR",
  },
  {
    name: childName,
    relationship: "child",
    birthDate: null,
    linkedToPortfolio: false,
    netWorth: 0,
    investableAssets: 0,
    annualNetIncome: 0,
    currency: "INR",
  },
];

const flexibleExpenses = new Set([
  "Festivals & Charity",
  "Restaurant/Swiggy",
  "Cosmetics",
  "Entertainment/TV",
  "Roadside Spends",
  "Dry Fruits",
]);

function expenseCategory(name) {
  if (/education|courses|school/i.test(name)) return "Children & education";
  if (/grocer|milk|spice|rice|millet|gas|dry fruit|ghee|oil/i.test(name)) return "Food & household";
  if (/health|medical|cosmetic/i.test(name)) return "Health & wellbeing";
  if (/fuel|car/i.test(name)) return "Transport";
  if (/electric|internet|property|water|helper/i.test(name)) return "Home & utilities";
  if (/festival|charity/i.test(name)) return "Giving & festivals";
  if (/restaurant|entertainment|roadside/i.test(name)) return "Lifestyle";
  return "Other";
}

const expenses = [];
for (let rowNumber = 3; rowNumber <= expensesSheet.rowCount; rowNumber += 1) {
  const row = expensesSheet.getRow(rowNumber);
  const name = textOf(row.getCell(1));
  const monthlyAmount = numberOf(row.getCell(2));
  if (!name || !monthlyAmount || monthlyAmount <= 0) continue;
  const childExpense = name.toLowerCase().includes(childName.toLowerCase());
  expenses.push({
    name,
    category: expenseCategory(name),
    monthlyAmount,
    currency: "INR",
    essential: !flexibleExpenses.has(name),
    startYear: null,
    endYear: childExpense ? childExpenseEndYear : null,
    memberRelationship: childExpense ? "child" : null,
    notes: textOf(row.getCell(4)) || null,
  });
}

function costPriority(name) {
  if (/land|house construction|medical emergency/i.test(name)) return "essential";
  if (/headphone|iphone|ipad|tv|motor bike|bicycle|air purifier|robo/i.test(name)) {
    return "optional";
  }
  return "important";
}

const oneTimeCosts = [];
for (let rowNumber = 2; rowNumber <= oneTimeSheet.rowCount; rowNumber += 1) {
  const row = oneTimeSheet.getRow(rowNumber);
  const name = textOf(row.getCell(1));
  const amount = numberOf(row.getCell(2));
  if (!name || !amount || amount <= 0) continue;
  oneTimeCosts.push({
    name,
    amount,
    currency: "INR",
    plannedYear: retirementYear,
    priority: costPriority(name),
    inflationLinked: true,
    notes: textOf(row.getCell(3)) || null,
  });
}

const expenseTotal = expenses.reduce((sum, expense) => sum + expense.monthlyAmount, 0);
const workbookExpenseTotal = numberOf(expensesSheet.getCell("B2"), 0);
const oneTimeTotal = oneTimeCosts.reduce((sum, cost) => sum + cost.amount, 0);
const workbookOneTimeTotal = numberOf(oneTimeSheet.getCell("F28"), oneTimeTotal);
if (Math.abs(expenseTotal - workbookExpenseTotal) > 0.01) {
  throw new Error(`Expense reconciliation failed: ${expenseTotal} vs ${workbookExpenseTotal}`);
}
if (Math.abs(oneTimeTotal - workbookOneTimeTotal) > 0.01) {
  throw new Error(
    `One-time cost reconciliation failed: ${oneTimeTotal} vs ${workbookOneTimeTotal}`,
  );
}

const [targetUser] = await sql`
  select id, email from "user" where lower(email) = lower(${email})
`;
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
  workbook: { fileName: basename(sourcePath), sha256: sourceHash, planningYear },
  assumptions: {
    retirementYear,
    planEndAge,
    ownerBirthDate,
    inflationRate,
    expectedReturnRate,
    annualSavings: annualSavingsEur,
    savingsCurrency: "EUR",
  },
  import: {
    familyMembers: members.length,
    expenses: expenses.length,
    oneTimeCosts: oneTimeCosts.length,
    scenarios: 2,
  },
  totals: { monthlyExpenses: expenseTotal, oneTimeCosts: oneTimeTotal },
  policy: {
    childBirthDate: "Not inferred from a year-only age schedule; add the exact date in Settings.",
    partnerBirthDate: "Not present in the workbook; add it in Settings.",
    portfolioLink: "The account owner uses Selvam portfolio liquidity; it is not duplicated.",
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
if (confirmedEmail !== email)
  throw new Error(`Refusing import: --confirm-email must equal ${email}.`);
if (!expectedHost || expectedHost !== connection.hostname) {
  throw new Error(`Refusing import: --expect-host must equal ${connection.hostname}.`);
}

const namespace = `${targetUser.id}:fire-workbook`;
const existingMembers = await sql`
  select id, name, relationship
  from family_member
  where user_id = ${targetUser.id}
`;
const existingMemberIds = new Map(
  existingMembers.map((member) => [`${member.relationship}\u0000${member.name}`, member.id]),
);
const memberIds = new Map(
  members.map((member) => [
    member.relationship,
    existingMemberIds.get(`${member.relationship}\u0000${member.name}`) ??
      stableUuid(namespace, `member:${member.relationship}:${member.name}`),
  ]),
);
const queries = [];
queries.push(sql`
  insert into fire_profile
    (user_id, birth_date, planned_retirement_year, plan_end_age, inflation_rate,
     expected_return_rate, return_volatility, safe_withdrawal_rate, safety_buffer,
     annual_savings, savings_currency, target_legacy, spending_policy)
  values
    (${targetUser.id}, ${ownerBirthDate}::date, ${retirementYear}, ${planEndAge},
     ${inflationRate}::numeric, ${expectedReturnRate}::numeric, 0.12, 0.035, 0.15,
     ${annualSavingsEur}::numeric, 'EUR', 0, 'essential_floor')
  on conflict (user_id) do update set
    birth_date = excluded.birth_date,
    planned_retirement_year = excluded.planned_retirement_year,
    plan_end_age = excluded.plan_end_age,
    inflation_rate = excluded.inflation_rate,
    expected_return_rate = excluded.expected_return_rate,
    annual_savings = excluded.annual_savings,
    savings_currency = excluded.savings_currency,
    updated_at = now()
`);

for (const member of members) {
  const id = memberIds.get(member.relationship);
  queries.push(sql`
    insert into family_member
      (id, user_id, name, relationship, birth_date, linked_to_portfolio, net_worth,
       investable_assets, annual_net_income, currency, included_in_plan)
    values
      (${id}::uuid, ${targetUser.id}, ${member.name}, ${member.relationship},
       ${member.birthDate}::date, ${member.linkedToPortfolio}, ${member.netWorth}::numeric,
       ${member.investableAssets}::numeric, ${member.annualNetIncome}::numeric, ${member.currency}, true)
    on conflict (user_id, name, relationship) do update set
      birth_date = excluded.birth_date,
      linked_to_portfolio = excluded.linked_to_portfolio,
      net_worth = excluded.net_worth,
      investable_assets = excluded.investable_assets,
      annual_net_income = excluded.annual_net_income,
      currency = excluded.currency,
      included_in_plan = true,
      archived_at = null,
      updated_at = now()
  `);
}

for (const expense of expenses) {
  const id = stableUuid(namespace, `expense:${expense.category}:${expense.name}`);
  const memberId = expense.memberRelationship ? memberIds.get(expense.memberRelationship) : null;
  queries.push(sql`
    insert into fire_expense
      (id, user_id, member_id, name, category, monthly_amount, currency, essential,
       start_year, end_year, notes)
    values
      (${id}::uuid, ${targetUser.id}, ${memberId}::uuid, ${expense.name}, ${expense.category},
       ${expense.monthlyAmount}::numeric, ${expense.currency}, ${expense.essential},
       ${expense.startYear}, ${expense.endYear}, ${expense.notes})
    on conflict (id) do update set
      member_id = excluded.member_id,
      name = excluded.name,
      category = excluded.category,
      monthly_amount = excluded.monthly_amount,
      currency = excluded.currency,
      essential = excluded.essential,
      start_year = excluded.start_year,
      end_year = excluded.end_year,
      notes = excluded.notes,
      archived_at = null,
      updated_at = now()
  `);
}

for (const cost of oneTimeCosts) {
  const id = stableUuid(namespace, `cost:${cost.name}`);
  queries.push(sql`
    insert into fire_one_time_cost
      (id, user_id, name, amount, currency, planned_year, priority, inflation_linked, notes)
    values
      (${id}::uuid, ${targetUser.id}, ${cost.name}, ${cost.amount}::numeric, ${cost.currency},
       ${cost.plannedYear}, ${cost.priority}, ${cost.inflationLinked}, ${cost.notes})
    on conflict (id) do update set
      name = excluded.name,
      amount = excluded.amount,
      currency = excluded.currency,
      planned_year = excluded.planned_year,
      priority = excluded.priority,
      inflation_linked = excluded.inflation_linked,
      notes = excluded.notes,
      archived_at = null,
      updated_at = now()
  `);
}

for (const scenario of [
  { name: "Doable", bufferRate: 0 },
  { name: "Safety Max", bufferRate: 0.15 },
]) {
  const id = stableUuid(namespace, `scenario:${scenario.name}`);
  queries.push(sql`
    insert into fire_scenario (id, user_id, name, spending_multiplier, buffer_rate, enabled)
    values (${id}::uuid, ${targetUser.id}, ${scenario.name}, 1, ${scenario.bufferRate}::numeric, true)
    on conflict (user_id, name) do update set
      spending_multiplier = excluded.spending_multiplier,
      buffer_rate = excluded.buffer_rate,
      enabled = true,
      updated_at = now()
  `);
}

const auditId = stableUuid(namespace, `audit:${sourceHash}`);
const auditMetadata = JSON.stringify({
  sourceSha256: sourceHash,
  planningYear,
  counts: report.import,
  totals: report.totals,
  rawWorkbookStored: false,
});
queries.push(sql`
  insert into audit_event (id, user_id, action, entity_type, entity_id, metadata)
  values (${auditId}::uuid, ${targetUser.id}, 'imported', 'fire_workbook', ${targetUser.id}, ${auditMetadata}::jsonb)
  on conflict (id) do update set metadata = excluded.metadata
`);

await sql.transaction(queries);
const [verified] = await sql`
  select
    (select count(*)::int from family_member where user_id = ${targetUser.id} and archived_at is null) as "familyMembers",
    (select count(*)::int from fire_expense where user_id = ${targetUser.id} and id = any(${expenses.map((expense) => stableUuid(namespace, `expense:${expense.category}:${expense.name}`))}::uuid[])) as expenses,
    (select count(*)::int from fire_one_time_cost where user_id = ${targetUser.id} and id = any(${oneTimeCosts.map((cost) => stableUuid(namespace, `cost:${cost.name}`))}::uuid[])) as "oneTimeCosts",
    (select count(*)::int from fire_scenario where user_id = ${targetUser.id} and enabled = true) as scenarios,
    (select coalesce(sum(monthly_amount), 0)::text from fire_expense where user_id = ${targetUser.id} and id = any(${expenses.map((expense) => stableUuid(namespace, `expense:${expense.category}:${expense.name}`))}::uuid[])) as "monthlyExpenses",
    (select coalesce(sum(amount), 0)::text from fire_one_time_cost where user_id = ${targetUser.id} and id = any(${oneTimeCosts.map((cost) => stableUuid(namespace, `cost:${cost.name}`))}::uuid[])) as "oneTimeCostTotal",
    (
      (select count(*) from fire_expense e join family_member m on m.id = e.member_id where e.user_id = ${targetUser.id} and m.user_id <> e.user_id) +
      (select count(*) from fire_one_time_cost c join family_member m on m.id = c.member_id where c.user_id = ${targetUser.id} and m.user_id <> c.user_id) +
      (select count(*) from fire_income_stream i join family_member m on m.id = i.member_id where i.user_id = ${targetUser.id} and m.user_id <> i.user_id)
    )::int as "ownershipMismatches"
`;
const ok =
  verified.familyMembers >= members.length &&
  verified.expenses === expenses.length &&
  verified.oneTimeCosts === oneTimeCosts.length &&
  verified.scenarios >= 2 &&
  Number(verified.monthlyExpenses) === expenseTotal &&
  Number(verified.oneTimeCostTotal) === oneTimeTotal &&
  verified.ownershipMismatches === 0;
console.log(JSON.stringify({ verified: ok, imported: verified }, null, 2));
if (!ok) throw new Error("FIRE workbook import verification failed.");
