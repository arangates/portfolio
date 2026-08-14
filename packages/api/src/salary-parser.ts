import { extractText } from "unpdf";

export type SalaryLineItemCategory =
  | "earning"
  | "deduction"
  | "tax"
  | "reimbursement"
  | "taxable_wage"
  | "net"
  | "other";

export type ParsedSalaryLineItem = {
  rowIndex: number;
  description: string;
  category: SalaryLineItemCategory;
  amount: number;
  components: number[];
  quantity: number | null;
  unit: string | null;
};

export type ParsedSalaryPayslip = {
  parserVersion: string;
  employerName: string;
  payPeriod: string;
  periodLabel: string;
  currency: "EUR";
  revision: string | null;
  baseSalary: number;
  supplementalGross: number;
  grossPay: number;
  taxableWage: number;
  wageTax: number;
  pensionContribution: number;
  socialInsurance: number;
  thirtyPercentAdjustment: number;
  thirtyPercentCompensation: number;
  expenseReimbursements: number;
  netPay: number;
  annualSalary: number | null;
  partTimePercentage: number | null;
  ytdTaxableWage: number | null;
  ytdWageTax: number | null;
  ytdNetPay: number | null;
  ytdPension: number | null;
  validationStatus: "verified" | "needs_review";
  validationIssues: string[];
  lineItems: ParsedSalaryLineItem[];
};

const PARSER_VERSION = "euhreka-v1";
const MONEY_PATTERN = /(?:\d{1,3}(?:\.\d{3})+|\d+),\d{2}-?/g;
const PERSONAL_DATA_MARKERS = [
  "Birth date",
  "Employed on",
  "Fulltime annual salary",
  "Sal.scale/level",
  "Parttime perc.",
  "Min. wage",
  "Wage tax reduction",
  "Code tax-tabl",
  "% Tax spec. paym.",
  "ZW/WW/WAO/ZVW",
  "EC Perm./Written/Stand-by",
];

const months = new Map(
  [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ].map((month, index) => [month, index + 1]),
);

function europeanNumber(value: string) {
  const negative = value.endsWith("-");
  const parsed = Number(value.replace(/-$/, "").replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(parsed)) throw new Error(`Invalid payroll amount: ${value}`);
  return negative ? -parsed : parsed;
}

function approximatelyEqual(left: number, right: number, tolerance = 0.02) {
  return Math.abs(left - right) <= tolerance;
}

function financialTotal(components: number[]) {
  if (components.length === 1) return components[0] ?? 0;
  const final = components.at(-1) ?? 0;
  const preceding = components.slice(0, -1).reduce((sum, amount) => sum + amount, 0);
  if (approximatelyEqual(final, preceding)) return final;
  if (components.every((amount) => approximatelyEqual(amount, final))) return final;
  return components.reduce((sum, amount) => sum + amount, 0);
}

function categoryFor(description: string): SalaryLineItemCategory {
  const value = description.toLowerCase();
  if (value === "payable amount" || value === "net wages" || value.includes("retro.acc")) {
    return "net";
  }
  if (value.includes("taxable wage")) return "taxable_wage";
  if (value.includes("wage tax") || value.includes("loonheffing")) return "tax";
  if (
    value.includes("home work") ||
    value.includes("work location") ||
    value.includes("cmm work") ||
    value.includes("traffic net") ||
    value.includes("net pay wkr") ||
    value.includes("regulation costs.comp")
  ) {
    return "reimbursement";
  }
  if (
    value.includes("pension") ||
    value.includes("premium wia") ||
    value.includes("paww") ||
    value.includes("wage in kind") ||
    value.includes("gross adj") ||
    value.includes("exchange com. traffic br") ||
    value === "exchange wkr"
  ) {
    return "deduction";
  }
  if (
    value.includes("gross salary") ||
    value.includes("profit sharing") ||
    value.includes("end of year benefit") ||
    value.includes("holiday allowance") ||
    value.includes("paid flex hours") ||
    value.includes("quarterly allowance") ||
    value.includes("conversion adv") ||
    value.includes("remaining adv")
  ) {
    return "earning";
  }
  return "other";
}

function withoutPersonalData(line: string) {
  const markerIndex = PERSONAL_DATA_MARKERS.reduce((earliest, marker) => {
    const index = line.indexOf(marker);
    return index >= 0 && (earliest < 0 || index < earliest) ? index : earliest;
  }, -1);
  return (markerIndex >= 0 ? line.slice(0, markerIndex) : line).trim();
}

function parseLineItem(line: string, rowIndex: number): ParsedSalaryLineItem | null {
  let financialText = withoutPersonalData(line);
  if (!financialText) return null;

  let quantity: number | null = null;
  let unit: string | null = null;
  const quantityMatch = financialText.match(
    /(?:^|\s)((?:\d{1,3}(?:\.\d{3})+|\d+),\d{2})\s+(Hrs?|Days?|Km)\b/i,
  );
  if (
    quantityMatch?.index !== undefined &&
    quantityMatch[1] !== undefined &&
    quantityMatch[2] !== undefined
  ) {
    quantity = europeanNumber(quantityMatch[1]);
    unit = quantityMatch[2];
    financialText =
      `${financialText.slice(0, quantityMatch.index)} ${financialText.slice(quantityMatch.index + quantityMatch[0].length)}`.trim();
  }

  const matches = [...financialText.matchAll(MONEY_PATTERN)];
  const firstMatch = matches[0];
  if (!firstMatch || firstMatch.index === undefined) return null;
  const description = financialText.slice(0, firstMatch.index).trim().replace(/\s+/g, " ");
  if (!description) return null;
  const components = matches.map((match) => europeanNumber(match[0]));
  return {
    rowIndex,
    description,
    category: categoryFor(description),
    amount: financialTotal(components),
    components,
    quantity,
    unit,
  };
}

function lastMetric(text: string, label: string) {
  const pattern = new RegExp(
    `${label}\\s+((?:\\d{1,3}(?:\\.\\d{3})+|\\d+),\\d{2}-?)(?:\\s+((?:\\d{1,3}(?:\\.\\d{3})+|\\d+),\\d{2}-?))?`,
    "gi",
  );
  const matches = [...text.matchAll(pattern)];
  const match = matches.at(-1);
  if (!match) return null;
  const value = match[2] ?? match[1];
  return value === undefined ? null : europeanNumber(value);
}

function sum(items: ParsedSalaryLineItem[], predicate: (item: ParsedSalaryLineItem) => boolean) {
  return items.filter(predicate).reduce((total, item) => total + item.amount, 0);
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function revisionFrom(fileName: string) {
  return fileName.match(/_R(\d+)/i)?.[1] ?? null;
}

export async function parseSalaryPayslip(
  bytes: Uint8Array,
  fileName: string,
): Promise<ParsedSalaryPayslip> {
  const extracted = await extractText(bytes, { mergePages: true });
  if (extracted.totalPages < 1 || extracted.totalPages > 5) {
    throw new Error("A payslip must contain between one and five pages.");
  }
  const text = extracted.text.replaceAll(String.fromCharCode(0), "").replace(/\r/g, "");
  if (!text.includes("Produced by NorthgateArinso euHReka")) {
    throw new Error("This PDF layout is not yet supported. Expected a euHReka salary statement.");
  }

  const periodMatch = text.match(/Income statement\s*:\s*([A-Za-z]+)\s+(\d{4})/i);
  if (!periodMatch) throw new Error("Could not identify the salary period.");
  const monthName = periodMatch[1];
  const yearText = periodMatch[2];
  if (!monthName || !yearText) throw new Error("Could not identify the salary period.");
  const month = months.get(monthName.toLowerCase());
  if (!month) throw new Error(`Unsupported salary month: ${monthName}`);
  const year = Number(yearText);
  const payPeriod = `${year}-${String(month).padStart(2, "0")}-01`;
  const periodLabel = `${monthName} ${year}`;

  const lines = text
    .split("\n")
    .map((line) => line.trim().replace(/\s+/g, " "))
    .filter(Boolean);
  const headerIndex = lines.findIndex((line) => line.startsWith("Description Quantity"));
  const detailsEnd = lines.findIndex(
    (line, index) => index > headerIndex && line.startsWith("Comm.distance"),
  );
  if (headerIndex < 0 || detailsEnd < 0)
    throw new Error("Could not identify the payroll detail table.");

  const employerCandidates = lines
    .slice(0, headerIndex)
    .filter(
      (line) =>
        line === line.toUpperCase() &&
        /[A-Z]/.test(line) &&
        !line.startsWith("IF UNDELIVERABLE") &&
        !line.includes("POSTBUS") &&
        !line.includes("EINDHOVEN"),
    );
  const employerName = employerCandidates.at(-1);
  if (!employerName) throw new Error("Could not identify the employer.");

  const lineItems = lines
    .slice(headerIndex + 1, detailsEnd)
    .map((line, index) => parseLineItem(line, index + 1))
    .filter((item): item is ParsedSalaryLineItem => item !== null);
  if (lineItems.length === 0) throw new Error("No payroll line items were found.");

  const baseSalary = sum(lineItems, (item) => item.description.toLowerCase() === "gross salary");
  const grossPay = sum(lineItems, (item) => item.category === "earning" && item.amount > 0);
  const taxableWage = sum(lineItems, (item) => item.category === "taxable_wage");
  const wageTax = Math.abs(sum(lineItems, (item) => item.category === "tax"));
  const pensionContribution = Math.abs(
    sum(lineItems, (item) => item.description.toLowerCase().includes("pension fund premium")),
  );
  const socialInsurance = Math.abs(
    sum(lineItems, (item) => {
      const description = item.description.toLowerCase();
      return description.includes("premium wia") || description.includes("paww contribution");
    }),
  );
  const thirtyPercentAdjustment = Math.abs(
    sum(lineItems, (item) => {
      const description = item.description.toLowerCase();
      return description.includes("wage in kind 30%") || description.includes("30% gross adj");
    }),
  );
  const thirtyPercentCompensation = sum(lineItems, (item) =>
    item.description.toLowerCase().includes("30% regulation costs.comp"),
  );
  const expenseReimbursements = sum(
    lineItems,
    (item) =>
      item.category === "reimbursement" &&
      !item.description.toLowerCase().includes("30% regulation costs.comp"),
  );
  const payableItems = lineItems.filter(
    (item) => item.description.toLowerCase() === "payable amount",
  );
  const netPay = payableItems.at(-1)?.amount ?? 0;
  const netWages = sum(lineItems, (item) => item.description.toLowerCase() === "net wages");
  const finalNetWageRow = Math.max(
    ...lineItems
      .filter((item) => item.description.toLowerCase() === "net wages")
      .map((item) => item.rowIndex),
  );
  const postNetReimbursements = sum(
    lineItems,
    (item) => item.rowIndex > finalNetWageRow && item.category === "reimbursement",
  );

  const annualSalaryMatch = text.match(
    /Fulltime annual salary\s+((?:\d{1,3}(?:\.\d{3})+|\d+),\d{2})/i,
  );
  const partTimeMatch = text.match(/Parttime perc\.\s+((?:\d{1,3}(?:\.\d{3})+|\d+),\d{2})/i);
  const bankTransferMatch = text.match(
    /Bank transfer\s+\S+\s+((?:\d{1,3}(?:\.\d{3})+|\d+),\d{2})/i,
  );
  const calculationText = text.split("Calculation data").at(-1) ?? "";

  const validationIssues: string[] = [];
  if (netPay <= 0) validationIssues.push("Payable amount was not found or is not positive.");
  if (!approximatelyEqual(netWages + postNetReimbursements, netPay)) {
    validationIssues.push("Net wage components do not reconcile to the payable amount.");
  }
  const bankTransferAmount = bankTransferMatch?.[1];
  if (bankTransferAmount && !approximatelyEqual(europeanNumber(bankTransferAmount), netPay)) {
    validationIssues.push("Bank transfer does not reconcile to the payable amount.");
  }

  return {
    parserVersion: PARSER_VERSION,
    employerName,
    payPeriod,
    periodLabel,
    currency: "EUR",
    revision: revisionFrom(fileName),
    baseSalary: roundMoney(baseSalary),
    supplementalGross: roundMoney(grossPay - baseSalary),
    grossPay: roundMoney(grossPay),
    taxableWage: roundMoney(taxableWage),
    wageTax: roundMoney(wageTax),
    pensionContribution: roundMoney(pensionContribution),
    socialInsurance: roundMoney(socialInsurance),
    thirtyPercentAdjustment: roundMoney(thirtyPercentAdjustment),
    thirtyPercentCompensation: roundMoney(thirtyPercentCompensation),
    expenseReimbursements: roundMoney(expenseReimbursements),
    netPay: roundMoney(netPay),
    annualSalary: annualSalaryMatch?.[1] ? europeanNumber(annualSalaryMatch[1]) : null,
    partTimePercentage: partTimeMatch?.[1] ? europeanNumber(partTimeMatch[1]) : null,
    ytdTaxableWage: lastMetric(calculationText, "Taxable wage"),
    ytdWageTax: lastMetric(calculationText, "Wage tax"),
    ytdNetPay: lastMetric(calculationText, "Pay\\. amount"),
    ytdPension: lastMetric(calculationText, "Prem\\.OP"),
    validationStatus: validationIssues.length === 0 ? "verified" : "needs_review",
    validationIssues,
    lineItems,
  };
}
