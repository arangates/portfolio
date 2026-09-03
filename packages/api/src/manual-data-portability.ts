import "server-only";

import { randomUUID } from "node:crypto";

import {
  auditEvent,
  bankAccount,
  bankBalanceSnapshot,
  capitalAllocationTarget,
  capitalDeploymentPolicy,
  commodityHolding,
  commodityInventoryItem,
  commodityInventorySnapshot,
  commoditySnapshot,
  db,
  exchangeRateSnapshot,
  familyMember,
  fireExpense,
  fireIncomeStream,
  fireOneTimeCost,
  fireProfile,
  fireScenario,
  fixedDeposit,
  fixedDepositSnapshot,
  householdBudgetItem,
  householdBudgetSnapshot,
  householdProfile,
  householdPurchase,
  householdScenario,
  householdScenarioLine,
  householdServiceContract,
  householdServiceContractSnapshot,
  instrument,
  manualAsset,
  manualAssetSnapshot,
  portfolioPreference,
  realEstateProperty,
  realEstateSnapshot,
} from "@portfolio/db";
import { getTableColumns, sql, type SQL, type SQLWrapper } from "drizzle-orm";
import ExcelJS from "exceljs";
import Papa from "papaparse";
import { z } from "zod";

const FORMAT_NAME = "Selvam manual data";
const FORMAT_VERSION = "1";
const MAX_ROWS = 50_000;

type ParentReference = {
  field: string;
  dataset: string;
  optional?: boolean;
};

type ManualSpec = {
  key: string;
  sheet: string;
  table: SQLWrapper;
  profile?: boolean;
  identity?: string[];
  parent?: ParentReference;
  exclude?: string[];
  manualOnly?: boolean;
};

type PortableRow = {
  dataset: string;
  rowNumber: number;
  values: Record<string, unknown>;
};

type DbColumn = SQLWrapper & {
  dataType: string;
  columnType: string;
  hasDefault: boolean;
  name: string;
  notNull: boolean;
};

const manualSpecs: ManualSpec[] = [
  {
    key: "portfolio_preferences",
    sheet: "Portfolio preferences",
    table: portfolioPreference,
    profile: true,
  },
  {
    key: "exchange_rates",
    sheet: "Exchange rates",
    table: exchangeRateSnapshot,
    identity: ["baseCurrency", "quoteCurrency", "asOf"],
  },
  {
    key: "bank_accounts",
    sheet: "Bank accounts",
    table: bankAccount,
    identity: ["institution", "name", "currency"],
  },
  {
    key: "bank_balance_history",
    sheet: "Bank balance history",
    table: bankBalanceSnapshot,
    parent: { field: "accountId", dataset: "bank_accounts" },
    identity: ["accountId", "asOf"],
    exclude: ["batchId"],
    manualOnly: true,
  },
  { key: "fixed_deposits", sheet: "Fixed deposits", table: fixedDeposit },
  {
    key: "fixed_deposit_history",
    sheet: "Fixed deposit history",
    table: fixedDepositSnapshot,
    parent: { field: "fixedDepositId", dataset: "fixed_deposits" },
    identity: ["fixedDepositId", "asOf"],
  },
  { key: "commodity_holdings", sheet: "Commodity holdings", table: commodityHolding },
  {
    key: "commodity_history",
    sheet: "Commodity history",
    table: commoditySnapshot,
    parent: { field: "commodityHoldingId", dataset: "commodity_holdings" },
    identity: ["commodityHoldingId", "asOf"],
  },
  {
    key: "commodity_inventory",
    sheet: "Commodity inventory",
    table: commodityInventoryItem,
    parent: { field: "commodityHoldingId", dataset: "commodity_holdings" },
  },
  {
    key: "commodity_inventory_history",
    sheet: "Commodity inventory history",
    table: commodityInventorySnapshot,
    parent: { field: "itemId", dataset: "commodity_inventory" },
    identity: ["itemId", "asOf"],
  },
  { key: "manual_assets", sheet: "Manual assets", table: manualAsset, identity: ["name"] },
  {
    key: "manual_asset_history",
    sheet: "Manual asset history",
    table: manualAssetSnapshot,
    parent: { field: "assetId", dataset: "manual_assets" },
    identity: ["assetId", "asOf"],
  },
  {
    key: "real_estate",
    sheet: "Real estate",
    table: realEstateProperty,
    identity: ["name", "owner", "location"],
  },
  {
    key: "real_estate_history",
    sheet: "Real estate history",
    table: realEstateSnapshot,
    parent: { field: "propertyId", dataset: "real_estate" },
    identity: ["propertyId", "asOf"],
  },
  { key: "household_profile", sheet: "Household profile", table: householdProfile, profile: true },
  {
    key: "household_budget",
    sheet: "Household budget",
    table: householdBudgetItem,
    identity: ["name", "category", "flowType"],
  },
  {
    key: "household_budget_history",
    sheet: "Household budget history",
    table: householdBudgetSnapshot,
    parent: { field: "itemId", dataset: "household_budget" },
    identity: ["itemId", "effectiveFrom"],
  },
  {
    key: "household_scenarios",
    sheet: "Household scenarios",
    table: householdScenario,
    identity: ["name"],
  },
  {
    key: "household_scenario_lines",
    sheet: "Household scenario lines",
    table: householdScenarioLine,
    parent: { field: "scenarioId", dataset: "household_scenarios" },
  },
  {
    key: "household_contracts",
    sheet: "Household contracts",
    table: householdServiceContract,
    identity: ["service", "provider"],
    parent: { field: "budgetItemId", dataset: "household_budget", optional: true },
  },
  {
    key: "household_contract_history",
    sheet: "Household contract history",
    table: householdServiceContractSnapshot,
    parent: { field: "contractId", dataset: "household_contracts" },
    identity: ["contractId", "effectiveFrom"],
  },
  { key: "household_purchases", sheet: "Household purchases", table: householdPurchase },
  { key: "fire_profile", sheet: "FIRE profile", table: fireProfile, profile: true },
  {
    key: "family_members",
    sheet: "Family members",
    table: familyMember,
    identity: ["name", "relationship"],
  },
  {
    key: "fire_expenses",
    sheet: "FIRE expenses",
    table: fireExpense,
    parent: { field: "memberId", dataset: "family_members", optional: true },
  },
  {
    key: "fire_one_time_costs",
    sheet: "FIRE one-time costs",
    table: fireOneTimeCost,
    parent: { field: "memberId", dataset: "family_members", optional: true },
  },
  {
    key: "fire_income_streams",
    sheet: "FIRE income streams",
    table: fireIncomeStream,
    parent: { field: "memberId", dataset: "family_members", optional: true },
  },
  { key: "fire_scenarios", sheet: "FIRE scenarios", table: fireScenario, identity: ["name"] },
  {
    key: "deployment_policy",
    sheet: "Deployment policy",
    table: capitalDeploymentPolicy,
    profile: true,
  },
  {
    key: "allocation_targets",
    sheet: "Allocation targets",
    table: capitalAllocationTarget,
    identity: ["bucket"],
  },
];

const specByKey = new Map(manualSpecs.map((spec) => [spec.key, spec]));
const dateOnlyFields = new Set([
  "birthDate",
  "contractEndDate",
  "effectiveFrom",
  "maturityDate",
  "purchasedOn",
  "startDate",
]);

function tableColumns(spec: ManualSpec) {
  return getTableColumns(spec.table as typeof bankAccount) as unknown as Record<string, DbColumn>;
}

function portableFields(spec: ManualSpec) {
  const excluded = new Set(["userId", "createdAt", "updatedAt", ...(spec.exclude ?? [])]);
  return Object.keys(tableColumns(spec)).filter((field) => !excluded.has(field));
}

function cellValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if ("result" in value) return cellValue((value as { result?: unknown }).result);
    if ("text" in value) return cellValue((value as { text?: unknown }).text);
    if ("richText" in value) {
      return ((value as { richText?: Array<{ text?: string }> }).richText ?? [])
        .map((part) => part.text ?? "")
        .join("");
    }
  }
  return value;
}

function normalizedDate(value: unknown, field: string) {
  const raw = value instanceof Date ? value.toISOString() : String(value).trim();
  if (dateOnlyFields.has(field)) {
    const date = raw.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
    if (!date) throw new Error(`${field} must use YYYY-MM-DD format`);
    return date;
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) throw new Error(`${field} must contain a valid date`);
  return date;
}

function normalizedBoolean(value: unknown, field: string) {
  if (typeof value === "boolean") return value;
  const raw = String(value).trim().toLowerCase();
  if (["true", "yes", "1"].includes(raw)) return true;
  if (["false", "no", "0"].includes(raw)) return false;
  throw new Error(`${field} must be true or false`);
}

function normalizeForColumn(value: unknown, field: string, column: DbColumn) {
  const resolved = cellValue(value);
  if (resolved === "" || resolved === null || resolved === undefined) {
    if (column.notNull && !column.hasDefault && field !== "id") {
      throw new Error(`${field} is required`);
    }
    return null;
  }
  if (dateOnlyFields.has(field) || column.columnType.includes("Timestamp")) {
    return normalizedDate(resolved, field);
  }
  if (column.dataType === "boolean") return normalizedBoolean(resolved, field);
  if (column.dataType === "number") {
    const number = Number(resolved);
    if (!Number.isFinite(number)) throw new Error(`${field} must be a number`);
    return number;
  }
  if (column.columnType.includes("Numeric")) {
    const raw = String(resolved).trim();
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw)) {
      throw new Error(`${field} must be a decimal number`);
    }
    return raw;
  }
  return String(resolved).trim();
}

function selectList(spec: ManualSpec) {
  const columns = tableColumns(spec);
  return sql.join(
    portableFields(spec).map((field) => sql`${columns[field]} as ${sql.identifier(field)}`),
    sql`, `,
  );
}

async function loadDataset(userId: string, spec: ManualSpec) {
  const columns = tableColumns(spec);
  const manualFilter = spec.manualOnly ? sql` and ${columns.batchId} is null` : sql``;
  const order = columns.id ? sql` order by ${columns.id}` : sql``;
  const result = await db.execute<Record<string, unknown>>(
    sql`select ${selectList(spec)} from ${spec.table} where ${columns.userId} = ${userId}${manualFilter}${order}`,
  );
  return result.rows;
}

export async function createManualDataExport(userId: string, format: "csv" | "xlsx") {
  const datasets = await Promise.all(
    manualSpecs.map(async (spec) => ({ spec, rows: await loadDataset(userId, spec) })),
  );
  const exportedAt = new Date().toISOString();

  if (format === "csv") {
    const rows = datasets.flatMap(({ spec, rows: datasetRows }) =>
      datasetRows.map((row) => ({
        selvam_format: FORMAT_NAME,
        format_version: FORMAT_VERSION,
        dataset: spec.key,
        row_json: JSON.stringify(row),
      })),
    );
    const csv = Papa.unparse(rows, {
      columns: ["selvam_format", "format_version", "dataset", "row_json"],
      newline: "\r\n",
    });
    return { bytes: new TextEncoder().encode(csv), contentType: "text/csv; charset=utf-8" };
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Selvam";
  workbook.created = new Date(exportedAt);
  const metadata = workbook.addWorksheet("About this export", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  metadata.addRows([
    ["key", "value"],
    ["format", FORMAT_NAME],
    ["version", FORMAT_VERSION],
    ["exported_at", exportedAt],
    ["scope", "Manual and user-maintained data only"],
    ["merge_behavior", "Import adds or updates rows and never deletes existing data"],
    ["precision", "Decimal values are stored as text to preserve exact precision"],
  ]);
  styleWorksheet(metadata, ["key", "value"]);

  for (const { spec, rows } of datasets) {
    const worksheet = workbook.addWorksheet(spec.sheet, {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    const fields = portableFields(spec);
    worksheet.addRow(fields);
    for (const row of rows) worksheet.addRow(fields.map((field) => cellValue(row[field])));
    styleWorksheet(worksheet, fields);
  }
  const buffer = await workbook.xlsx.writeBuffer();
  return {
    bytes: new Uint8Array(buffer as ArrayBuffer),
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
}

function styleWorksheet(worksheet: ExcelJS.Worksheet, fields: string[]) {
  const header = worksheet.getRow(1);
  header.height = 24;
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF18181B" } };
  header.alignment = { vertical: "middle" };
  worksheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: fields.length } };
  fields.forEach((field, index) => {
    worksheet.getColumn(index + 1).width = Math.min(42, Math.max(14, field.length + 3));
  });
}

function parseCsv(bytes: Uint8Array) {
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim(),
  });
  if (parsed.errors.length > 0) throw new Error(parsed.errors[0]?.message ?? "Invalid CSV file");
  return parsed.data.map((row, index): PortableRow => {
    if (row.selvam_format !== FORMAT_NAME || row.format_version !== FORMAT_VERSION) {
      throw new Error("This CSV is not a supported Selvam manual-data export");
    }
    if (!row.dataset || !specByKey.has(row.dataset)) {
      throw new Error(`CSV row ${index + 2} contains an unknown dataset`);
    }
    let values: unknown;
    try {
      values = JSON.parse(row.row_json ?? "");
    } catch {
      throw new Error(`CSV row ${index + 2} contains invalid row data`);
    }
    return {
      dataset: row.dataset,
      rowNumber: index + 2,
      values: z.record(z.string(), z.unknown()).parse(values),
    };
  });
}

async function parseXlsx(bytes: Uint8Array) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(
    bytes.slice().buffer as unknown as Parameters<typeof workbook.xlsx.load>[0],
  );
  const metadata = workbook.getWorksheet("About this export");
  if (!metadata) throw new Error("This workbook is missing Selvam export metadata");
  const metadataValues = new Map<string, string>();
  metadata.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    metadataValues.set(
      String(cellValue(row.getCell(1).value)),
      String(cellValue(row.getCell(2).value)),
    );
  });
  if (
    metadataValues.get("format") !== FORMAT_NAME ||
    metadataValues.get("version") !== FORMAT_VERSION
  ) {
    throw new Error("This workbook is not a supported Selvam manual-data export");
  }

  const rows: PortableRow[] = [];
  for (const spec of manualSpecs) {
    const worksheet = workbook.getWorksheet(spec.sheet);
    if (!worksheet) continue;
    const headers = (worksheet.getRow(1).values as unknown[])
      .slice(1)
      .map((value) => String(cellValue(value)).trim());
    const allowed = new Set(portableFields(spec));
    const populatedHeaders = headers.filter(Boolean);
    if (new Set(populatedHeaders).size !== populatedHeaders.length) {
      throw new Error(`${spec.sheet} contains duplicate column names`);
    }
    for (const header of headers) {
      if (header && !allowed.has(header)) {
        throw new Error(`${spec.sheet} contains an unsupported column: ${header}`);
      }
    }
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const values = Object.fromEntries(
        headers.flatMap((header, index) =>
          header ? [[header, cellValue(row.getCell(index + 1).value)] as const] : [],
        ),
      );
      if (Object.values(values).every((value) => value === "")) return;
      rows.push({ dataset: spec.key, rowNumber, values });
    });
  }
  return rows;
}

export async function parseManualDataFile(file: { name: string; bytes: Uint8Array }) {
  const lowerName = file.name.toLowerCase();
  const rows = lowerName.endsWith(".csv")
    ? parseCsv(file.bytes)
    : lowerName.endsWith(".xlsx")
      ? await parseXlsx(file.bytes)
      : (() => {
          throw new Error("Choose a .xlsx or .csv Selvam manual-data export");
        })();
  if (rows.length > MAX_ROWS) throw new Error(`The export exceeds the ${MAX_ROWS} row limit`);
  if (rows.length === 0) throw new Error("The export does not contain any manual records");
  return rows;
}

function normalizedRow(spec: ManualSpec, raw: Record<string, unknown>) {
  const columns = tableColumns(spec);
  const output: Record<string, unknown> = {};
  for (const field of portableFields(spec)) {
    if (!(field in raw)) {
      const column = columns[field]!;
      if (column.notNull && !column.hasDefault && field !== "id") {
        throw new Error(`${field} is required`);
      }
      continue;
    }
    output[field] = normalizeForColumn(raw[field], field, columns[field]!);
  }
  if (!spec.profile) {
    const sourceId = output.id;
    if (sourceId !== null && sourceId !== undefined && !z.uuid().safeParse(sourceId).success) {
      throw new Error("id must be a UUID");
    }
  }
  return output;
}

function fieldCondition(column: DbColumn, value: unknown) {
  return value === null ? sql`${column} is null` : sql`${column} = ${value}`;
}

async function findOwnedId(
  userId: string,
  spec: ManualSpec,
  values: Record<string, unknown>,
  fields: string[],
) {
  if (spec.profile) return null;
  const columns = tableColumns(spec);
  const conditions: SQL[] = [sql`${columns.userId} = ${userId}`];
  for (const field of fields) {
    if (!(field in values)) return null;
    conditions.push(fieldCondition(columns[field]!, values[field]));
  }
  const result = await db.execute<{ id: string }>(
    sql`select ${columns.id} as id from ${spec.table} where ${sql.join(conditions, sql` and `)} limit 1`,
  );
  return result.rows[0]?.id ?? null;
}

function assignmentList(spec: ManualSpec, values: Record<string, unknown>) {
  const columns = tableColumns(spec);
  return sql.join(
    Object.entries(values).map(
      ([field, value]) => sql`${sql.identifier(columns[field]!.name)} = ${value}`,
    ),
    sql`, `,
  );
}

async function updateOwnedRow(
  userId: string,
  spec: ManualSpec,
  id: string,
  values: Record<string, unknown>,
) {
  const columns = tableColumns(spec);
  const writable = Object.fromEntries(Object.entries(values).filter(([field]) => field !== "id"));
  if (Object.keys(writable).length === 0) return;
  await db.execute(
    sql`update ${spec.table} set ${assignmentList(spec, writable)} where ${columns.id} = ${id} and ${columns.userId} = ${userId}`,
  );
}

async function insertRow(userId: string, spec: ManualSpec, values: Record<string, unknown>) {
  const columns = tableColumns(spec);
  const entries = [["userId", userId] as const, ...Object.entries(values)];
  const names = sql.join(
    entries.map(([field]) => sql.identifier(columns[field]!.name)),
    sql`, `,
  );
  const parameters = sql.join(
    entries.map(([, value]) => sql`${value}`),
    sql`, `,
  );
  const result = await db.execute<{ id: string }>(
    sql`insert into ${spec.table} (${names}) values (${parameters}) on conflict do nothing returning ${columns.id} as id`,
  );
  return result.rows[0]?.id ?? null;
}

async function upsertProfile(userId: string, spec: ManualSpec, values: Record<string, unknown>) {
  const columns = tableColumns(spec);
  const writable = Object.fromEntries(
    Object.entries(values).filter(([field]) => field !== "userId"),
  );
  const entries = [["userId", userId] as const, ...Object.entries(writable)];
  const names = sql.join(
    entries.map(([field]) => sql.identifier(columns[field]!.name)),
    sql`, `,
  );
  const parameters = sql.join(
    entries.map(([, value]) => sql`${value}`),
    sql`, `,
  );
  const updates = assignmentList(spec, writable);
  await db.execute(
    sql`insert into ${spec.table} (${names}) values (${parameters}) on conflict (${sql.identifier(columns.userId!.name)}) do update set ${updates}`,
  );
}

async function ownedInstrumentId(userId: string, value: unknown) {
  if (!value) return null;
  const parsed = z.uuid().safeParse(value);
  if (!parsed.success) return null;
  const [row] = await db
    .select({ id: instrument.id })
    .from(instrument)
    .where(sql`${instrument.id} = ${parsed.data} and ${instrument.userId} = ${userId}`)
    .limit(1);
  return row?.id ?? null;
}

export type ManualDataImportResult = {
  created: number;
  updated: number;
  profilesMerged: number;
  rows: number;
  datasets: number;
};

export async function importManualData(
  userId: string,
  rawRows: PortableRow[],
): Promise<ManualDataImportResult> {
  const grouped = new Map<string, PortableRow[]>();
  for (const row of rawRows) {
    const rows = grouped.get(row.dataset) ?? [];
    rows.push(row);
    grouped.set(row.dataset, rows);
  }

  const prepared = new Map<string, Array<{ rowNumber: number; values: Record<string, unknown> }>>();
  for (const spec of manualSpecs) {
    const rows = grouped.get(spec.key) ?? [];
    prepared.set(
      spec.key,
      rows.map((row) => {
        try {
          return { rowNumber: row.rowNumber, values: normalizedRow(spec, row.values) };
        } catch (error) {
          const detail = error instanceof Error ? error.message : "Invalid row";
          throw new Error(`${spec.sheet}, row ${row.rowNumber}: ${detail}`);
        }
      }),
    );
  }

  const idMap = new Map<string, string>();
  let created = 0;
  let updated = 0;
  let profilesMerged = 0;

  for (const spec of manualSpecs) {
    for (const preparedRow of prepared.get(spec.key) ?? []) {
      const values = { ...preparedRow.values };
      try {
        if (spec.key === "deployment_policy" && "stagingInstrumentId" in values) {
          values.stagingInstrumentId = await ownedInstrumentId(userId, values.stagingInstrumentId);
        }
        if (spec.profile) {
          await upsertProfile(userId, spec, values);
          profilesMerged += 1;
          continue;
        }

        const sourceId = typeof values.id === "string" ? values.id : randomUUID();
        values.id = sourceId;
        if (spec.parent) {
          const sourceParent = values[spec.parent.field];
          if (sourceParent === null || sourceParent === undefined || sourceParent === "") {
            if (!spec.parent.optional) throw new Error(`${spec.parent.field} is required`);
            values[spec.parent.field] = null;
          } else {
            const parentKey = `${spec.parent.dataset}:${String(sourceParent)}`;
            const parentSpec = specByKey.get(spec.parent.dataset);
            const mapped =
              idMap.get(parentKey) ??
              (parentSpec
                ? await findOwnedId(userId, parentSpec, { id: String(sourceParent) }, ["id"])
                : null);
            if (!mapped) throw new Error(`Referenced ${spec.parent.dataset} row is missing`);
            values[spec.parent.field] = mapped;
          }
        }

        let destinationId = await findOwnedId(userId, spec, { id: sourceId }, ["id"]);
        if (!destinationId && spec.identity?.length) {
          destinationId = await findOwnedId(userId, spec, values, spec.identity);
        }
        if (destinationId) {
          await updateOwnedRow(userId, spec, destinationId, values);
          updated += 1;
        } else {
          destinationId = await insertRow(userId, spec, values);
          if (!destinationId) {
            if (spec.identity?.length) {
              destinationId = await findOwnedId(userId, spec, values, spec.identity);
            }
            if (!destinationId) {
              values.id = randomUUID();
              destinationId = await insertRow(userId, spec, values);
            }
          }
          if (!destinationId)
            throw new Error("Could not merge this row because it conflicts with existing data");
          created += 1;
        }
        idMap.set(`${spec.key}:${sourceId}`, destinationId);
      } catch (error) {
        const detail = error instanceof Error ? error.message : "Could not merge row";
        throw new Error(`${spec.sheet}, row ${preparedRow.rowNumber}: ${detail}`);
      }
    }
  }

  const result = {
    created,
    updated,
    profilesMerged,
    rows: rawRows.length,
    datasets: [...grouped.values()].filter((rows) => rows.length > 0).length,
  };
  await db.insert(auditEvent).values({
    userId,
    action: "imported",
    entityType: "manual_data_backup",
    metadata: result,
  });
  return result;
}
