import { extractTextItems } from "unpdf";

import { layoutLines } from "./netherlands-tax-parser";

export const MORTGAGE_PARSER_VERSION = "ing-hypotheekoverzicht-v1";

export type ParsedMortgageOverview = {
  parserVersion: typeof MORTGAGE_PARSER_VERSION;
  lender: string;
  loanNumber: string;
  asOf: string;
  repaymentType: "annuity" | "linear" | "other";
  startDate: string;
  firstPaymentDate: string;
  endDate: string;
  fixedRateEndDate: string;
  originalAmount: number;
  currentBalance: number;
  monthlyPayment: number;
  statedRate: number;
  discount: number;
  sustainabilityDiscount: boolean;
  registrationAmount: number | null;
  freeRepaymentAllowance: number | null;
  propertyValue: number | null;
  valuationDate: string | null;
  energyLabel: string | null;
  nhg: boolean;
  bouwdepotOriginal: number | null;
  bouwdepotRemaining: number | null;
  validationStatus: "verified" | "needs_review";
  validationIssues: string[];
};

const MONTHS: Record<string, number> = {
  januari: 1,
  january: 1,
  jan: 1,
  februari: 2,
  february: 2,
  feb: 2,
  maart: 3,
  march: 3,
  mrt: 3,
  mar: 3,
  april: 4,
  apr: 4,
  mei: 5,
  may: 5,
  juni: 6,
  june: 6,
  jun: 6,
  juli: 7,
  july: 7,
  jul: 7,
  augustus: 8,
  august: 8,
  aug: 8,
  september: 9,
  sept: 9,
  sep: 9,
  oktober: 10,
  october: 10,
  okt: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

const iso = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const AMOUNT = /-?\d[\d.,\s]*\d|-?\d/;

/** Parses "368.353,25", "368,353.25", "9.000", "1870,47" into a number. */
export function parseMoneyText(value: string): number | null {
  const raw = value.replace(/[€\s]/g, "");
  if (!/\d/.test(raw)) return null;
  const lastComma = raw.lastIndexOf(",");
  const lastDot = raw.lastIndexOf(".");
  let normalised = raw;
  if (lastComma >= 0 && lastDot >= 0) {
    normalised =
      lastComma > lastDot ? raw.replace(/\./g, "").replace(",", ".") : raw.replace(/,/g, "");
  } else if (lastComma >= 0) {
    normalised = /,\d{1,2}$/.test(raw) ? raw.replace(",", ".") : raw.replace(/,/g, "");
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(raw)) {
    normalised = raw.replace(/\./g, "");
  }
  const parsed = Number(normalised);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseDateText(value: string): string | null {
  const numeric = /(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/.exec(value);
  if (numeric) return iso(Number(numeric[3]), Number(numeric[2]), Number(numeric[1]));
  const isoLike = /(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (isoLike) return isoLike[0];
  const named = /(\d{1,2})\s+([A-Za-z]+)\.?\s+(\d{4})/.exec(value);
  if (named) {
    const month = MONTHS[(named[2] ?? "").toLowerCase()];
    if (month) return iso(Number(named[3]), month, Number(named[1]));
  }
  const monthYear = /\b([A-Za-z]+)\s+(\d{4})\b/.exec(value);
  if (monthYear) {
    const month = MONTHS[(monthYear[1] ?? "").toLowerCase()];
    if (month) return iso(Number(monthYear[2]), month, 1);
  }
  return null;
}

/** Text that follows the first matching label, on the same line or else the next one. */
function valueFor(
  lines: string[],
  label: RegExp,
  accept: (value: string) => boolean,
  skip?: RegExp,
): string | null {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (skip?.test(line)) continue;
    const match = label.exec(line);
    if (!match) continue;
    const sameLine = line.slice(match.index + match[0].length).replace(/^[\s:–-]+/, "");
    if (sameLine && accept(sameLine)) return sameLine;
    const next = lines[index + 1];
    if (next && accept(next)) return next;
  }
  return null;
}

const hasDigit = (value: string) => /\d/.test(value);
const hasDate = (value: string) => parseDateText(value) !== null;

function amountFor(lines: string[], label: RegExp, skip?: RegExp) {
  const value = valueFor(lines, label, hasDigit, skip);
  if (!value) return null;
  const match = AMOUNT.exec(value.replace(/^€\s*/, ""));
  return match ? parseMoneyText(match[0]) : null;
}

function percentFor(lines: string[], label: RegExp, skip?: RegExp) {
  const value = valueFor(lines, label, (text) => /\d\s*%/.test(text), skip);
  const match = value ? /(\d+(?:[.,]\d+)?)\s*%/.exec(value) : null;
  return match ? Number((match[1] ?? "").replace(",", ".")) / 100 : null;
}

function dateFor(lines: string[], label: RegExp, skip?: RegExp) {
  const value = valueFor(lines, label, hasDate, skip);
  return value ? parseDateText(value) : null;
}

function yesNoFor(lines: string[], label: RegExp) {
  const value = valueFor(lines, label, (text) => /\b(ja|yes|nee|no|actief|niet)\b/i.test(text));
  if (value === null) return null;
  return /\b(ja|yes|actief)\b/i.test(value) && !/\b(nee|no|niet)\b/i.test(value);
}

function addMonths(isoDate: string, months: number) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const total = (year ?? 0) * 12 + ((month ?? 1) - 1) + months;
  return iso(Math.floor(total / 12), (total % 12) + 1, day ?? 1);
}

export async function parseMortgageOverview(bytes: Uint8Array): Promise<ParsedMortgageOverview> {
  const extracted = await extractTextItems(bytes);
  if (extracted.totalPages < 1 || extracted.totalPages > 8) {
    throw new Error("A mortgage overview must contain between one and eight pages.");
  }
  return parseMortgageOverviewLines(layoutLines(extracted.items));
}

export function parseMortgageOverviewLines(
  sourceLines: string[],
  fallbackAsOf = new Date().toISOString().slice(0, 10),
): ParsedMortgageOverview {
  const lines = sourceLines.map((line) => line.trim()).filter(Boolean);
  const text = lines.join("\n");
  const issues: string[] = [];

  const loanNumber =
    /\b([A-Z]\s?\d{3}[-\s]\d{5,8})\b/.exec(text)?.[1]?.replace(/\s+/g, " ") ??
    valueFor(lines, /(hypotheek|lening)\s?nummer/i, (value) => /\d/.test(value))
      ?.split(/\s{2,}/)[0]
      ?.trim() ??
    null;

  const originalAmount = amountFor(
    lines,
    /oorspronkelijk(?:e)?(?:\s+(?:bedrag|hoofdsom|lening|leningbedrag))?|hoofdsom|original (?:loan )?amount/i,
  );
  const currentBalance = amountFor(
    lines,
    /nog af te lossen|openstaand(?:e)?(?:\s+(?:bedrag|saldo|schuld))?|restschuld|huidige schuld|outstanding/i,
  );
  const monthlyPayment = amountFor(
    lines,
    /(?:bruto\s+)?maandbedrag|(?:bruto\s+)?maandlast|termijnbedrag|monthly payment/i,
  );
  const statedRate = percentFor(
    lines,
    /rentepercentage|rente(?!\w)|interest rate/i,
    /korting|vast|discount|fixed/i,
  );

  const missing = [
    originalAmount === null && "original amount",
    currentBalance === null && "outstanding balance",
    monthlyPayment === null && "monthly payment",
    statedRate === null && "interest rate",
  ].filter((item): item is string => Boolean(item));
  if (missing.length > 1 || originalAmount === null || currentBalance === null) {
    throw new Error(
      `This does not look like a supported mortgage overview (missing ${missing.join(", ")}). You can enter the terms manually instead.`,
    );
  }

  const asOf =
    dateFor(lines, /peildatum|datum overzicht|overzicht (?:per|d\.d\.)|^datum\b|as of|dated/i) ??
    (() => {
      issues.push("The overview date was not found; today was used.");
      return fallbackAsOf;
    })();
  const startDate =
    dateFor(lines, /passeerdatum|ingangsdatum|startdatum|datum (?:van de )?akte|deed date/i) ??
    null;
  const endDate = dateFor(
    lines,
    /einddatum|looptijd tot|einde looptijd|laatste termijn|maturity/i,
    /rente|fixed/i,
  );
  const fixedRateEndDate =
    dateFor(
      lines,
      /rentevast(?:e)?\s*(?:periode)?\s*(?:tot|t\/m|einddatum)?|einddatum rentevaste|fixed[- ]rate (?:period )?(?:until|ends)/i,
    ) ?? null;

  if (!startDate) issues.push("The deed date was not found; the first payment date was estimated.");
  if (!endDate) issues.push("The last instalment date was not found.");
  if (!fixedRateEndDate) issues.push("The fixed-rate end date was not found.");
  if (monthlyPayment === null) issues.push("The monthly payment was not found.");
  if (statedRate === null) issues.push("The interest rate was not found.");
  if (!loanNumber) issues.push("The loan number was not found.");

  const resolvedStart = startDate ?? addMonths(asOf, -29);
  const resolvedEnd = endDate ?? addMonths(resolvedStart, 360 + 1);
  const resolvedFixed = fixedRateEndDate ?? resolvedEnd;

  const discount = percentFor(lines, /rentekorting|betaalkorting|korting|discount/i) ?? 0;
  const sustainability = yesNoFor(lines, /duurzaamheidskorting|sustainability discount/i) ?? false;
  const energyLabel =
    /energie\s?label\s*:?\s*([A-G]\+{0,4})\b/i.exec(text)?.[1]?.toUpperCase() ?? null;
  const nhgValue = yesNoFor(lines, /\bNHG\b|nationale hypotheek garantie/i);
  const repaymentType = /lineair|linear/i.test(text)
    ? "linear"
    : /annu[iï]teit|annuity/i.test(text)
      ? "annuity"
      : "other";
  if (repaymentType !== "annuity") {
    issues.push("Only annuity mortgages are modelled exactly; review the projection.");
  }

  const result: ParsedMortgageOverview = {
    parserVersion: MORTGAGE_PARSER_VERSION,
    lender: /\bING\b/.test(text) ? "ING" : "Mortgage lender",
    loanNumber: loanNumber ?? "unknown",
    asOf,
    repaymentType,
    startDate: resolvedStart,
    firstPaymentDate: addMonths(`${resolvedStart.slice(0, 8)}01`, 2),
    endDate: resolvedEnd,
    fixedRateEndDate: resolvedFixed,
    originalAmount,
    currentBalance,
    monthlyPayment: monthlyPayment ?? 0,
    statedRate: statedRate ?? 0,
    discount,
    sustainabilityDiscount: sustainability,
    registrationAmount: amountFor(
      lines,
      /hypotheekinschrijving|inschrijving|ingeschreven|registered/i,
    ),
    freeRepaymentAllowance: amountFor(
      lines,
      /boetevrij|vrij aflossen|extra aflossen|penalty[- ]free/i,
    ),
    propertyValue: amountFor(
      lines,
      /marktwaarde|woningwaarde|waarde (?:van de )?woning|taxatiewaarde|property value/i,
    ),
    valuationDate: dateFor(
      lines,
      /datum (?:taxatie|waardering)|taxatiedatum|gewaardeerd op|valuation date/i,
    ),
    energyLabel,
    nhg: nhgValue ?? false,
    bouwdepotOriginal: amountFor(
      lines,
      /bouwdepot.*(?:oorspronkelijk|totaal|bedrag)|oorspronkelijk.*bouwdepot/i,
    ),
    bouwdepotRemaining: amountFor(
      lines,
      /bouwdepot.*(?:saldo|restant|resterend|beschikbaar)|resterend.*bouwdepot/i,
    ),
    validationStatus: "verified",
    validationIssues: issues,
  };

  if (result.currentBalance > result.originalAmount + 0.005) {
    issues.push("The outstanding balance exceeds the original amount.");
  }
  if (result.statedRate < 0 || result.statedRate > 0.15) {
    issues.push("The interest rate is outside the expected range.");
  }
  if (result.endDate <= result.asOf) issues.push("The last instalment date is not in the future.");
  if (result.monthlyPayment > result.currentBalance) {
    issues.push("The monthly payment exceeds the outstanding balance.");
  }
  if (issues.length > 0) result.validationStatus = "needs_review";
  return result;
}
