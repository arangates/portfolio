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

export const SALARY_PARSER_VERSION = "salary-v3";
const MONEY_PATTERN = /(?:\d{1,3}(?:\.\d{3})+|\d+),\d{2}-?/g;
const PAYROLL_DETAIL_END_MARKERS = [
  "Comm.distance",
  "Cost center",
  "Bank transfer",
  "E-mail:",
  "Phone number:",
  "Calculation data",
  "Produced by NorthgateArinso euHReka",
];
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
  const negative = value.endsWith("-") && !value.endsWith(",-");
  const normalized = value.endsWith(",-") ? value.slice(0, -2) : value.replace(/-$/, "");
  const parsed = Number(normalized.replace(/\./g, "").replace(",", "."));
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
    value.includes("deduction paid par.leave") ||
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
    value.includes("paid parental leave") ||
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

function firstPayrollAmount(text: string, pattern: RegExp) {
  const match = text.match(pattern);
  const value = match?.[1];
  return value ? europeanNumber(value) : 0;
}

function allPayrollAmounts(text: string, pattern: RegExp) {
  return [...text.matchAll(pattern)].map((match) => (match[1] ? europeanNumber(match[1]) : 0));
}

function bolooLineItem(
  rowIndex: number,
  description: string,
  category: SalaryLineItemCategory,
  amount: number,
): ParsedSalaryLineItem {
  return {
    rowIndex,
    description,
    category,
    amount,
    components: [amount],
    quantity: null,
    unit: null,
  };
}

function parseBolooPayslip(text: string, fileName: string): ParsedSalaryPayslip {
  const dateMatch = text.match(/Salarisspecificatie\s+Datum\s+(\d{2})-(\d{2})-(\d{4})/i);
  if (!dateMatch?.[2] || !dateMatch[3])
    throw new Error("Could not identify the Boloo salary period.");
  const month = Number(dateMatch[2]);
  const year = Number(dateMatch[3]);
  if (month < 1 || month > 12)
    throw new Error("The Boloo salary period contains an invalid month.");

  const payPeriod = `${year}-${String(month).padStart(2, "0")}-01`;
  const englishMonthName =
    [...months.entries()].find(([, number]) => number === month)?.[0] ?? "unknown";
  const dutchMonthName = [
    "januari",
    "februari",
    "maart",
    "april",
    "mei",
    "juni",
    "juli",
    "augustus",
    "september",
    "oktober",
    "november",
    "december",
  ][month - 1]!;
  const periodLabel = `${englishMonthName[0]?.toUpperCase()}${englishMonthName.slice(1)} ${year}`;
  const currentStart = text.search(new RegExp(`^Loon ${dutchMonthName} ${year}`, "im"));
  if (currentStart < 0) throw new Error("Could not identify the current Boloo payroll section.");
  const currentEnd = text.indexOf("Kosten werkgever", currentStart);
  const current = text.slice(currentStart, currentEnd < 0 ? undefined : currentEnd);
  const cumulativeStart = text.indexOf("Cumulatieven");
  const cumulative = text.slice(cumulativeStart, currentStart);

  const baseSalary = firstPayrollAmount(
    current,
    new RegExp(`^Loon ${dutchMonthName} ${year} € ([\\d.]+,(?:\\d{2}|-))`, "im"),
  );
  const supplementalGross = firstPayrollAmount(
    current,
    /^Uitbetaling vakantiegeldreservering\s+-?\s*([\d.]+,(?:\d{2}|-))/im,
  );
  const grossPay = roundMoney(baseSalary + supplementalGross);
  const taxableWage = roundMoney(
    allPayrollAmounts(
      current,
      /^Heffingsloon(?: bijzonder tarief)? € ([\d.]+,(?:\d{2}|-))/gim,
    ).reduce((total, amount) => total + amount, 0),
  );
  const wageTax = roundMoney(
    allPayrollAmounts(
      current,
      /^Loonheffing(?: met loonheffingskorting| bijzonder tarief)\s+(?:€\s+|-\s*)([\d.]+,(?:\d{2}|-))/gim,
    ).reduce((total, amount) => total + Math.abs(amount), 0),
  );
  const socialInsurance = Math.abs(
    firstPayrollAmount(current, /^\d+(?:,\d+)? % W\.G\.A\.\s+-?\s*([\d.]+,(?:\d{2}|-))/im),
  );
  const statedThirtyPercentAdjustment = Math.abs(
    firstPayrollAmount(text, /^Aftrek 30% regeling € ([\d.]+,(?:\d{2}|-))/im),
  );
  const netPay = firstPayrollAmount(
    current,
    /^Netto loon, met loonheffingskorting € ([\d.]+,(?:\d{2}|-))/im,
  );
  const bankTransfer = firstPayrollAmount(
    current,
    /^€ ([\d.]+,(?:\d{2}|-)) Betaald op rekeningnummer/im,
  );
  const ytdTaxableWage = firstPayrollAmount(cumulative, /^Heffingsloon € ([\d.]+,(?:\d{2}|-))/im);
  const ytdWageTax = firstPayrollAmount(cumulative, /^Loonheffing € ([\d.]+,(?:\d{2}|-))/im);
  const ytdNetPay = firstPayrollAmount(cumulative, /^Netto loon € ([\d.]+,(?:\d{2}|-))/im);
  const thirtyPercentAdjustment =
    statedThirtyPercentAdjustment > 0
      ? statedThirtyPercentAdjustment
      : text.includes("30%-regeling toegepast over heffingsloon")
        ? roundMoney(grossPay - taxableWage)
        : 0;

  const validationIssues: string[] = [];
  if (baseSalary <= 0) validationIssues.push("Base salary was not found or is not positive.");
  if (netPay <= 0) validationIssues.push("Net pay was not found or is not positive.");
  if (!approximatelyEqual(grossPay - wageTax - socialInsurance, netPay)) {
    validationIssues.push("Gross pay less employee deductions does not reconcile to net pay.");
  }
  if (!approximatelyEqual(bankTransfer, netPay)) {
    validationIssues.push("Bank transfer does not reconcile to net pay.");
  }
  if (!approximatelyEqual(grossPay - thirtyPercentAdjustment, taxableWage)) {
    validationIssues.push("The 30% ruling adjustment does not reconcile to taxable wage.");
  }

  const lineItems = [
    bolooLineItem(1, "Base salary", "earning", baseSalary),
    ...(supplementalGross > 0
      ? [bolooLineItem(2, "Holiday allowance payout", "earning", supplementalGross)]
      : []),
    bolooLineItem(3, "30% ruling taxable-wage adjustment", "deduction", -thirtyPercentAdjustment),
    bolooLineItem(4, "Taxable wage", "taxable_wage", taxableWage),
    bolooLineItem(5, "Wage tax", "tax", -wageTax),
    bolooLineItem(6, "W.G.A. contribution", "deduction", -socialInsurance),
    bolooLineItem(7, "Net pay", "net", netPay),
  ];

  return {
    parserVersion: "boloo-v1",
    employerName: "Boloo B.V.",
    payPeriod,
    periodLabel,
    currency: "EUR",
    revision: revisionFrom(fileName),
    baseSalary: roundMoney(baseSalary),
    supplementalGross: roundMoney(supplementalGross),
    grossPay,
    taxableWage,
    wageTax,
    pensionContribution: 0,
    socialInsurance: roundMoney(socialInsurance),
    thirtyPercentAdjustment: roundMoney(thirtyPercentAdjustment),
    thirtyPercentCompensation: 0,
    expenseReimbursements: 0,
    netPay: roundMoney(netPay),
    annualSalary: null,
    partTimePercentage: null,
    ytdTaxableWage: ytdTaxableWage || null,
    ytdWageTax: ytdWageTax || null,
    ytdNetPay: ytdNetPay || null,
    ytdPension: null,
    validationStatus: validationIssues.length === 0 ? "verified" : "needs_review",
    validationIssues,
    lineItems,
  };
}

function payrollDetailEnd(lines: string[], headerIndex: number) {
  return lines.findIndex(
    (line, index) =>
      index > headerIndex && PAYROLL_DETAIL_END_MARKERS.some((marker) => line.startsWith(marker)),
  );
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
  if (text.includes("Salarisspecificatie") && text.includes("Boloo B.V.")) {
    return parseBolooPayslip(text, fileName);
  }
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
  const detailsEnd = payrollDetailEnd(lines, headerIndex);
  if (headerIndex < 0 || detailsEnd < 0)
    throw new Error("Could not identify the payroll detail table.");

  const employerCandidates = lines
    .slice(0, headerIndex)
    .filter(
      (line) =>
        line === line.toUpperCase() &&
        /[A-Z]/.test(line) &&
        !/^\d/.test(line) &&
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
    parserVersion: SALARY_PARSER_VERSION,
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
