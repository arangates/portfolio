export const INDIA_ITR_PARSER_VERSION = "india-itr-json-v1";

type JsonRecord = Record<string, unknown>;

export type ParsedIncomeTaxReturn = {
  parserVersion: typeof INDIA_ITR_PARSER_VERSION;
  assessmentYearStart: number;
  assessmentYearLabel: string;
  financialYearLabel: string;
  formType: "ITR-2" | "ITR-3";
  schemaVersion: string | null;
  formVersion: string | null;
  sourceCreatedOn: string | null;
  acknowledgementNumber: string | null;
  filingSection: string | null;
  residentialStatus: string | null;
  taxRegime: "old" | "new" | "unknown";
  salaryIncome: number;
  housePropertyIncome: number;
  businessIncome: number;
  capitalGains: number;
  otherSourcesIncome: number;
  grossTotalIncome: number;
  chapterViDeductions: number;
  totalIncome: number;
  netTaxLiability: number;
  interestAndFees: number;
  aggregateTaxLiability: number;
  advanceTax: number;
  tds: number;
  tcs: number;
  selfAssessmentTax: number;
  totalTaxesPaid: number;
  balanceTaxPayable: number;
  refundDue: number;
  validationStatus: "verified" | "needs_review";
  validationIssues: string[];
};

function record(value: unknown): JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function numberValue(value: unknown, field: string) {
  if (value === undefined || value === null || value === "") return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`ITR field ${field} is not a valid number.`);
  return parsed;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function yearLabel(start: number) {
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

function filingSection(value: unknown) {
  if (value === 11 || value === "11") return "139(1)";
  return value === undefined || value === null ? null : String(value);
}

function taxRegime(status: JsonRecord): ParsedIncomeTaxReturn["taxRegime"] {
  const optedOut = stringValue(status.OptOutNewTaxRegime)?.toUpperCase();
  if (optedOut === "Y") return "old";
  if (optedOut === "N") return "new";
  const newRegime = stringValue(status.NewTaxRegime)?.toUpperCase();
  if (newRegime === "Y") return "new";
  if (newRegime === "N") return "old";
  return "unknown";
}

function acknowledgementFromFileName(fileName: string) {
  const baseName = fileName.replace(/^.*[\\/]/, "");
  const match = /^(\d{15})\.json$/i.exec(baseName);
  return match?.[1] ?? null;
}

export function parseIndiaItrJson(bytes: Uint8Array, fileName: string): ParsedIncomeTaxReturn {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("The ITR file is not valid UTF-8 JSON.");
  }

  let document: unknown;
  try {
    document = JSON.parse(text);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }

  const itrRoot = record(record(document).ITR);
  const formKey = ["ITR2", "ITR3"].find((key) => key in itrRoot);
  if (!formKey) throw new Error("Only Indian ITR-2 and ITR-3 JSON exports are supported.");
  const itr = record(itrRoot[formKey]);
  const form = record(itr[`Form_${formKey}`]);
  const assessmentYearStart = Number(form.AssessmentYear);
  if (
    !Number.isInteger(assessmentYearStart) ||
    assessmentYearStart < 2000 ||
    assessmentYearStart > 2200
  ) {
    throw new Error("The ITR assessment year is missing or invalid.");
  }

  const income = record(itr["PartB-TI"]);
  const tax = record(itr.PartB_TTI);
  const liability = record(tax.ComputationOfTaxLiability);
  const taxesPaidBlock = record(record(tax.TaxPaid).TaxesPaid);
  const filing = record(record(itr.PartA_GEN1).FilingStatus);
  const deductionsDetail = record(income.DeductionsUndSchVIADtl);

  const salaryIncome = numberValue(income.Salaries, "Salaries");
  const housePropertyIncome = numberValue(income.IncomeFromHP, "IncomeFromHP");
  const businessIncome = numberValue(
    typeof income.ProfBusGain === "object"
      ? record(income.ProfBusGain).TotProfBusGain
      : income.ProfBusGain,
    "ProfBusGain",
  );
  const capitalGains = numberValue(
    typeof income.CapGain === "object" ? record(income.CapGain).TotalCapGains : income.CapGain,
    "CapGain",
  );
  const otherSourcesIncome = numberValue(
    typeof income.IncFromOS === "object" ? record(income.IncFromOS).TotIncFromOS : income.IncFromOS,
    "IncFromOS",
  );
  const grossTotalIncome = numberValue(income.GrossTotalIncome, "GrossTotalIncome");
  const chapterViDeductions = numberValue(
    income.DeductionsUnderScheduleVIA ?? deductionsDetail.TotDeductUndSchVIA,
    "DeductionsUnderScheduleVIA",
  );
  const totalIncome = numberValue(income.TotalIncome, "TotalIncome");
  const netTaxLiability = numberValue(liability.NetTaxLiability, "NetTaxLiability");
  const interestAndFees = numberValue(record(liability.IntrstPay).TotalIntrstPay, "TotalIntrstPay");
  const aggregateTaxLiability = numberValue(
    liability.AggregateTaxInterestLiability,
    "AggregateTaxInterestLiability",
  );
  const advanceTax = numberValue(taxesPaidBlock.AdvanceTax, "AdvanceTax");
  const tds = numberValue(taxesPaidBlock.TDS, "TDS");
  const tcs = numberValue(taxesPaidBlock.TCS, "TCS");
  const selfAssessmentTax = numberValue(taxesPaidBlock.SelfAssessmentTax, "SelfAssessmentTax");
  const totalTaxesPaid = numberValue(taxesPaidBlock.TotalTaxesPaid, "TotalTaxesPaid");
  const balanceTaxPayable = numberValue(record(tax.TaxPaid).BalTaxPayable, "BalTaxPayable");
  const refundDue = numberValue(record(tax.Refund).RefundDue, "RefundDue");

  const issues: string[] = [];
  const approximately = (left: number, right: number) => Math.abs(left - right) <= 1;
  if (!approximately(totalTaxesPaid, advanceTax + tds + tcs + selfAssessmentTax)) {
    issues.push(
      "Total taxes paid does not reconcile with advance tax, TDS, TCS and self-assessment tax.",
    );
  }
  if (!approximately(aggregateTaxLiability, netTaxLiability + interestAndFees)) {
    issues.push(
      "Aggregate tax liability does not reconcile with net liability and interest or fees.",
    );
  }
  if (refundDue > 0 && balanceTaxPayable > 0) {
    issues.push("Both a refund and balance tax payable are present.");
  }
  if (totalIncome > grossTotalIncome + 10) {
    issues.push("Total income is greater than gross total income.");
  }
  for (const [label, value] of [
    ["Net tax liability", netTaxLiability],
    ["Aggregate tax liability", aggregateTaxLiability],
    ["Taxes paid", totalTaxesPaid],
    ["Balance tax payable", balanceTaxPayable],
    ["Refund due", refundDue],
  ] as const) {
    if (value < 0) issues.push(`${label} is negative.`);
  }

  const sourceCreatedOn = stringValue(record(itr.CreationInfo).JSONCreationDate);
  if (sourceCreatedOn && !/^\d{4}-\d{2}-\d{2}$/.test(sourceCreatedOn)) {
    issues.push("The source JSON creation date is not in YYYY-MM-DD format.");
  }

  return {
    parserVersion: INDIA_ITR_PARSER_VERSION,
    assessmentYearStart,
    assessmentYearLabel: yearLabel(assessmentYearStart),
    financialYearLabel: yearLabel(assessmentYearStart - 1),
    formType: formKey === "ITR2" ? "ITR-2" : "ITR-3",
    schemaVersion: stringValue(form.SchemaVer),
    formVersion: stringValue(form.FormVer),
    sourceCreatedOn,
    acknowledgementNumber: acknowledgementFromFileName(fileName),
    filingSection: filingSection(filing.ReturnFileSec),
    residentialStatus: stringValue(filing.ResidentialStatus),
    taxRegime: taxRegime(filing),
    salaryIncome,
    housePropertyIncome,
    businessIncome,
    capitalGains,
    otherSourcesIncome,
    grossTotalIncome,
    chapterViDeductions,
    totalIncome,
    netTaxLiability,
    interestAndFees,
    aggregateTaxLiability,
    advanceTax,
    tds,
    tcs,
    selfAssessmentTax,
    totalTaxesPaid,
    balanceTaxPayable,
    refundDue,
    validationStatus: issues.length === 0 ? "verified" : "needs_review",
    validationIssues: issues,
  };
}
