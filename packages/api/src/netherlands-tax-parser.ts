import { extractTextItems, type StructuredTextItem } from "unpdf";

export const NETHERLANDS_TAX_PARSER_VERSION = "belastingdienst-final-assessment-v1";

export type ParsedNetherlandsTaxAssessment = {
  parserVersion: typeof NETHERLANDS_TAX_PARSER_VERSION;
  taxYear: number;
  assessmentType: "final" | "revised_final";
  assessmentDate: string;
  assessmentReferenceSuffix: string | null;
  outcomeType: "refund" | "payable" | "zero";
  settlementAmount: number;
  payrollTaxWithheld: number;
  dividendGamingTaxWithheld: number;
  provisionalRefunds: number;
  priorBalanceAdjustment: number;
  taxInterest: number;
  finalTaxAndSocialInsurance: number;
  box1TaxableIncome: number;
  box1IncomeTax: number;
  box2TaxableIncome: number;
  box2IncomeTax: number;
  box3TaxableIncome: number;
  box3IncomeTax: number;
  socialInsuranceIncome: number;
  socialInsurancePremium: number;
  generalTaxCredit: number;
  employmentTaxCredit: number;
  totalTaxCredits: number;
  aggregateIncome: number;
  validationStatus: "verified" | "needs_review";
  validationIssues: string[];
};

function layoutLines(pages: StructuredTextItem[][]) {
  return pages.flatMap((page) => {
    const rows: { y: number; items: StructuredTextItem[] }[] = [];
    for (const item of [...page].sort((left, right) => right.y - left.y || left.x - right.x)) {
      let row = rows.find((candidate) => Math.abs(candidate.y - item.y) <= 1.5);
      if (!row) {
        row = { y: item.y, items: [] };
        rows.push(row);
      }
      row.items.push(item);
    }
    return rows
      .sort((left, right) => right.y - left.y)
      .map((row) =>
        row.items
          .sort((left, right) => left.x - right.x)
          .map((item) => item.str)
          .join(" ")
          .trim()
          .replace(/\s+/g, " "),
      )
      .filter(Boolean);
  });
}

const monthNumbers = new Map(
  [
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
  ].map((month, index) => [month, index + 1]),
);

function dutchAmount(value: string) {
  const parsed = Number(value.replace(/\s/g, "").replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(parsed)) throw new Error(`Invalid Dutch tax amount: ${value}`);
  return parsed;
}

function amounts(line: string) {
  return [...line.matchAll(/€\s*(-?(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{2})?)/g)].map((match) =>
    dutchAmount(match[1] ?? ""),
  );
}

function amountFor(lines: string[], label: string) {
  const line = lines.find((candidate) => candidate.startsWith(label) && candidate.includes("€"));
  return line ? (amounts(line).at(-1) ?? null) : null;
}

function exactAmount(lines: string[], label: string) {
  const line = lines.find((candidate) => candidate.startsWith(`${label} €`));
  return line ? (amounts(line).at(-1) ?? null) : null;
}

function valueAfter(lines: string[], label: string) {
  const index = lines.findIndex((line) => line === label);
  return index >= 0 ? (lines[index + 1] ?? null) : null;
}

function parseDate(value: string | null) {
  if (!value) throw new Error("Could not identify the assessment date.");
  const match = /^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/i.exec(value);
  if (!match?.[1] || !match[2] || !match[3]) {
    throw new Error("Could not identify the assessment date.");
  }
  const month = monthNumbers.get(match[2].toLowerCase());
  if (!month) throw new Error(`Unsupported Dutch month: ${match[2]}`);
  return `${match[3]}-${String(month).padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

function referenceSuffix(value: string | null) {
  if (!value) return null;
  const parts = value.split(".");
  return parts.length >= 2 ? parts.slice(-2).join(".") : value.slice(-6);
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function parseNetherlandsTaxAssessment(
  bytes: Uint8Array,
  fileName: string,
): Promise<ParsedNetherlandsTaxAssessment> {
  const extracted = await extractTextItems(bytes);
  if (extracted.totalPages < 1 || extracted.totalPages > 6) {
    throw new Error("A Dutch final assessment must contain between one and six pages.");
  }
  return parseNetherlandsTaxAssessmentLines(layoutLines(extracted.items), fileName);
}

export function parseNetherlandsTaxAssessmentLines(
  sourceLines: string[],
  fileName: string,
): ParsedNetherlandsTaxAssessment {
  const lines = sourceLines
    .map((line) => line.replaceAll(String.fromCharCode(0), "").trim().replace(/\s+/g, " "))
    .filter(Boolean);
  const text = lines.join("\n");
  if (
    !text.includes("Belastingdienst") ||
    (!/Aanslag\s+\d{4}/.test(text) && !text.includes("Vermindering")) ||
    !text.includes("Aanslagnummer") ||
    !text.includes("Verzamelinkomen")
  ) {
    throw new Error(
      "This is not a supported Definitieve aanslag inkomstenbelasting from Belastingdienst.",
    );
  }
  const yearText =
    valueAfter(lines, "Jaar") ?? lines.find((line) => /^Aanslag \d{4}$/.test(line))?.slice(-4);
  const taxYear = Number(yearText);
  if (!Number.isInteger(taxYear) || taxYear < 2000 || taxYear > 2200) {
    throw new Error("Could not identify the Dutch tax year.");
  }
  const assessmentDate = parseDate(valueAfter(lines, "Datum") ?? valueAfter(lines, "Dagtekening"));
  const assessmentNumber = valueAfter(lines, "Aanslagnummer");

  const refund = amountFor(lines, "Te ontvangen of te verrekenen");
  const payable = amountFor(lines, "Te betalen");
  const outcomeType = refund !== null ? "refund" : payable !== null ? "payable" : "zero";
  const settlementAmount = refund ?? payable ?? 0;
  const payrollTaxWithheld = amountFor(lines, "Loonheffing") ?? 0;
  const dividendGamingTaxWithheld =
    amountFor(lines, "Dividendbelasting en/of kansspelbelasting") ?? 0;
  const provisionalRefunds = amountFor(lines, "Eerder verleende voorlopige teruggave(n)") ?? 0;
  const priorBalanceAdjustment = amountFor(lines, "Saldo (eerder)") ?? 0;
  const interestLine = lines.find(
    (line) => line.startsWith("Belastingrente") && line.includes("€"),
  );
  const taxInterestAmount = interestLine ? (amounts(interestLine).at(-1) ?? 0) : 0;
  const taxInterest = interestLine?.includes(" af ") ? -taxInterestAmount : taxInterestAmount;
  const finalTaxAndSocialInsurance = exactAmount(
    lines,
    "Inkomstenbelasting en premie volksverzekeringen",
  );
  const aggregateIncome = exactAmount(lines, "Verzamelinkomen");
  if (finalTaxAndSocialInsurance === null || aggregateIncome === null) {
    throw new Error("The final assessment totals could not be identified.");
  }

  const box1TaxableIncome = amountFor(lines, "Belastbaar inkomen uit werk en woning") ?? 0;
  const box1IncomeTax = exactAmount(lines, "Inkomstenbelasting box 1") ?? 0;
  const box2TaxableIncome = amountFor(lines, "Belastbaar inkomen uit aanmerkelijk belang") ?? 0;
  const box2IncomeTax = exactAmount(lines, "Inkomstenbelasting box 2") ?? 0;
  const box3TaxableIncome = amountFor(lines, "Belastbaar inkomen uit sparen en beleggen") ?? 0;
  const box3IncomeTax = exactAmount(lines, "Inkomstenbelasting box 3") ?? 0;
  const socialInsuranceIncome = amountFor(lines, "Premie-inkomen") ?? 0;
  const socialInsurancePremium = amountFor(lines, "Premie volksverzekeringen ") ?? 0;
  const generalTaxCredit = amountFor(lines, "Algemene heffingskorting") ?? 0;
  const employmentTaxCredit = amountFor(lines, "Arbeidskorting") ?? 0;
  const totalTaxCredits = exactAmount(lines, "Heffingskortingen") ?? 0;

  const issues: string[] = [];
  const approximately = (left: number, right: number) => Math.abs(left - right) <= 1;
  const calculatedFinalTax =
    box1IncomeTax + box2IncomeTax + box3IncomeTax + socialInsurancePremium - totalTaxCredits;
  if (!approximately(finalTaxAndSocialInsurance, calculatedFinalTax)) {
    issues.push("Final tax does not reconcile with Box taxes, social insurance and tax credits.");
  }
  const calculatedSettlement =
    payrollTaxWithheld +
    dividendGamingTaxWithheld -
    finalTaxAndSocialInsurance -
    provisionalRefunds -
    priorBalanceAdjustment -
    taxInterest;
  const signedSettlement = outcomeType === "payable" ? -settlementAmount : settlementAmount;
  if (!approximately(signedSettlement, calculatedSettlement)) {
    issues.push("The refund or payable amount does not reconcile with the assessment calculation.");
  }
  if (!approximately(totalTaxCredits, generalTaxCredit + employmentTaxCredit)) {
    issues.push(
      "Total tax credits include credits beyond the recognized general and employment credits.",
    );
  }

  return {
    parserVersion: NETHERLANDS_TAX_PARSER_VERSION,
    taxYear,
    assessmentType:
      text.includes("Vermindering") || /^nieuwe_definitieve/i.test(fileName)
        ? "revised_final"
        : "final",
    assessmentDate,
    assessmentReferenceSuffix: referenceSuffix(assessmentNumber),
    outcomeType,
    settlementAmount: roundMoney(settlementAmount),
    payrollTaxWithheld: roundMoney(payrollTaxWithheld),
    dividendGamingTaxWithheld: roundMoney(dividendGamingTaxWithheld),
    provisionalRefunds: roundMoney(provisionalRefunds),
    priorBalanceAdjustment: roundMoney(priorBalanceAdjustment),
    taxInterest: roundMoney(taxInterest),
    finalTaxAndSocialInsurance: roundMoney(finalTaxAndSocialInsurance),
    box1TaxableIncome: roundMoney(box1TaxableIncome),
    box1IncomeTax: roundMoney(box1IncomeTax),
    box2TaxableIncome: roundMoney(box2TaxableIncome),
    box2IncomeTax: roundMoney(box2IncomeTax),
    box3TaxableIncome: roundMoney(box3TaxableIncome),
    box3IncomeTax: roundMoney(box3IncomeTax),
    socialInsuranceIncome: roundMoney(socialInsuranceIncome),
    socialInsurancePremium: roundMoney(socialInsurancePremium),
    generalTaxCredit: roundMoney(generalTaxCredit),
    employmentTaxCredit: roundMoney(employmentTaxCredit),
    totalTaxCredits: roundMoney(totalTaxCredits),
    aggregateIncome: roundMoney(aggregateIncome),
    validationStatus: issues.length === 0 ? "verified" : "needs_review",
    validationIssues: issues,
  };
}
