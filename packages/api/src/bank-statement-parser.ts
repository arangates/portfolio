import { createHash } from "node:crypto";

import Papa from "papaparse";
import { extractTextItems, type StructuredTextItem } from "unpdf";

export const BANK_STATEMENT_PARSER_VERSION = "bank-statements-v2";

export const BANK_CATEGORIES = [
  "salary",
  "internal_transfer",
  "investment",
  "housing",
  "groceries",
  "utilities",
  "insurance",
  "childcare",
  "transport",
  "dining",
  "shopping",
  "healthcare",
  "government_tax",
  "cash_withdrawal",
  "bank_fees",
  "refund",
  "other_income",
  "other_expense",
] as const;

export type BankCategory = (typeof BANK_CATEGORIES)[number];

export type ParsedBankTransaction = {
  transactionHash: string;
  bookedAt: string;
  valueAt: string | null;
  amount: number;
  currency: string;
  name: string;
  description: string;
  transactionType: string | null;
  providerCode: string | null;
  counterpartyName: string | null;
  counterpartyAccountLast4: string | null;
  category: BankCategory;
  categoryConfidence: number;
};

export type ParsedBankStatement = {
  provider: "abn_amro" | "ing";
  institution: string;
  accountName: string;
  accountType: string;
  ownershipType: "personal" | "joint";
  accountLast4: string;
  accountFingerprint: string;
  currency: string;
  periodStart: string | null;
  periodEnd: string | null;
  openingBalance: number | null;
  closingBalance: number | null;
  debitTotal: number;
  creditTotal: number;
  validationStatus: "verified" | "parsed" | "needs_review";
  validationIssues: string[];
  transactions: ParsedBankTransaction[];
};

function sha(value: string | Uint8Array) {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * PDF text layers occasionally contain NUL/control characters (for example,
 * an apostrophe encoded as NUL in older ABN AMRO statements). PostgreSQL does
 * not allow NUL in text values, so normalize extracted text before it is used
 * for display, hashing, categorization, or persistence.
 */
function databaseSafeText(value: string, preserveCsvLayout = false) {
  return Array.from(value, (character) => {
    const code = character.charCodeAt(0);
    if (code === 0) return "'";
    if (code < 32 || code === 127) {
      if (preserveCsvLayout && (code === 9 || code === 10 || code === 13)) return character;
      return " ";
    }
    return character;
  }).join("");
}

function normalizedText(value: string) {
  return databaseSafeText(value).replace(/\s+/g, " ").trim();
}

function euroAmount(value: string) {
  const number = Number(value.trim().replace(/\s/g, "").replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(number)) throw new Error(`Invalid amount: ${value}`);
  return Math.round(number * 100) / 100;
}

function isoDate(value: string) {
  if (/^\d{8}$/.test(value)) return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6)}`;
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
  if (!match) throw new Error(`Invalid date: ${value}`);
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function last4(value: string) {
  return value.replace(/\s/g, "").slice(-4) || null;
}

function categoryFor(
  value: string,
  amount: number,
): { category: BankCategory; confidence: number } {
  const text = value.toLowerCase();
  const rule = (category: BankCategory, confidence = 0.95) => ({ category, confidence });
  if (/salaris|salary|payroll|loon\b|asml netherlands/.test(text)) return rule("salary", 0.99);
  if (/joint account/.test(text)) return rule("internal_transfer", 0.95);
  if (/flatex|degiro|zerodha|coin\b|mutual fund|cash order|beleg|invest/.test(text))
    return rule("investment", 0.97);
  if (/hypotheek|mortgage|huur\b|rent\b|vve\b|woning|woonhuis/.test(text)) return rule("housing");
  if (/albert heijn|jumbo|lidl|aldi|plus supermarkt|supermarket|boodschap|picnic/.test(text))
    return rule("groceries");
  if (
    /essent|eneco|vattenfall|waternet|brabant water|ziggo|kpn|odido|vodafone|internet|energie/.test(
      text,
    )
  )
    return rule("utilities");
  if (/verzekering|insurance|achmea|cz groep|vgz|zilverenkruis|asr\b/.test(text))
    return rule("insurance");
  if (/kinderopvang|daycare|toeslagen|svb\b|kindgebonden/.test(text))
    return amount > 0 ? rule("refund") : rule("childcare");
  if (/shell|esso|bp\b|q8\b|ns\b|ovpay|parking|parkeren|anwb|auto|garage|fuel|benzine/.test(text))
    return rule("transport");
  if (/restaurant|cafe|café|kapsalon|thuisbezorgd|deliveroo|uber eats|mcdonald|bakker/.test(text))
    return rule("dining", 0.9);
  if (/amazon|bol\.com|hema|action|ikea|mediamarkt|shopping/.test(text))
    return rule("shopping", 0.9);
  if (/apotheek|pharmacy|tandarts|dentist|huisarts|hospital|ziekenhuis/.test(text))
    return rule("healthcare");
  if (/belastingdienst|gemeente|government|tax\b|duo\b/.test(text))
    return amount > 0 ? rule("refund") : rule("government_tax");
  if (/geldautomaat|cash withdrawal|atm\b/.test(text)) return rule("cash_withdrawal");
  if (/basispakket betalen|bankkosten|bank fee|kosten betaalrekening/.test(text))
    return rule("bank_fees");
  if (amount > 0 && /refund|terugbetaling|restitutie/.test(text)) return rule("refund", 0.9);
  return amount > 0 ? rule("other_income", 0.5) : rule("other_expense", 0.5);
}

function transactionHash(parts: Array<string | number | null>) {
  return sha(
    parts
      .map((part) =>
        String(part ?? "")
          .trim()
          .toLowerCase(),
      )
      .join("\u001f"),
  );
}

function layoutLines(pages: StructuredTextItem[][]) {
  return pages.flatMap((page) => {
    const rows: { y: number; items: StructuredTextItem[] }[] = [];
    for (const item of [...page].sort((a, b) => b.y - a.y || a.x - b.x)) {
      let row = rows.find((candidate) => Math.abs(candidate.y - item.y) <= 1.5);
      if (!row) rows.push((row = { y: item.y, items: [] }));
      row.items.push(item);
    }
    return rows
      .map((row) =>
        row.items
          .sort((a, b) => a.x - b.x)
          .map((item) => normalizedText(item.str))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim(),
      )
      .filter(Boolean);
  });
}

function amountBelowLabel(pages: StructuredTextItem[][], label: string) {
  for (const page of pages) {
    const heading = page.find((item) => item.str.trim() === label);
    if (!heading) continue;
    const value = page.find(
      (item) =>
        Math.abs(item.x - heading.x) < 4 &&
        item.y < heading.y &&
        heading.y - item.y < 18 &&
        /^[\d.]+,\d{2}/.test(item.str.trim()),
    );
    const match = /([\d.]+,\d{2})/.exec(value?.str ?? "");
    if (match?.[1]) return euroAmount(match[1]);
  }
  return null;
}

function dateForAbn(dayMonth: string, statementDate: string) {
  const [day, month] = dayMonth.split("-").map(Number);
  if (!day || !month || month > 12 || day > 31)
    throw new Error(`Invalid ABN AMRO transaction date: ${dayMonth}`);
  const statement = new Date(`${statementDate}T12:00:00Z`);
  let year = statement.getUTCFullYear();
  if ((month ?? 0) > statement.getUTCMonth() + 1) year -= 1;
  const result = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const parsed = new Date(`${result}T12:00:00Z`);
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() + 1 !== month ||
    parsed.getUTCDate() !== day
  )
    throw new Error(`Invalid ABN AMRO transaction date: ${dayMonth}`);
  return result;
}

function optionalDateForAbn(dayMonth: string | undefined, statementDate: string) {
  if (!dayMonth || dayMonth === "00-00") return null;
  try {
    return dateForAbn(dayMonth, statementDate);
  } catch {
    return null;
  }
}

export async function parseAbnAmroStatement(bytes: Uint8Array): Promise<ParsedBankStatement> {
  const extracted = await extractTextItems(bytes);
  const pages = extracted.items;
  const lines = layoutLines(pages);
  const text = lines.join("\n");
  if (
    !/Statement of Account/i.test(text) ||
    !/(?:ABN AMRO|ABNANL2A)/i.test(text) ||
    !/Amount debit/i.test(text)
  ) {
    throw new Error("This is not a supported ABN AMRO Statement of Account.");
  }
  const iban = /\b(NL\d{2}ABNA\d{10})\b/.exec(text)?.[1];
  const statementDateRaw = /\b\d{2}-\d{2}-\d{4}\b/.exec(text)?.[0];
  if (!iban || !statementDateRaw)
    throw new Error("Could not identify the ABN AMRO account or statement date.");
  const statementDate = isoDate(statementDateRaw);
  const openingBalance = amountBelowLabel(pages, "Previous balance");
  const closingBalance = amountBelowLabel(pages, "New balance");
  const statedDebits = amountBelowLabel(pages, "Total amount debit");
  const statedCredits = amountBelowLabel(pages, "Total amount credit");

  const ordered = pages.flatMap((page, pageIndex) =>
    [...page]
      .filter((item) => item.str.trim())
      .sort((a, b) => b.y - a.y || a.x - b.x)
      .map((item) => ({ ...item, pageIndex })),
  );
  const starts = ordered
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.x < 80 && /^\d{2}-\d{2}$/.test(item.str.trim()));
  const transactions: ParsedBankTransaction[] = starts.map(({ item, index }, transactionIndex) => {
    const end = starts[transactionIndex + 1]?.index ?? ordered.length;
    const chunk = ordered.slice(index, end);
    const amountItem = pages[item.pageIndex]?.find(
      (candidate) =>
        Math.abs(candidate.y - item.y) <= 2 &&
        candidate.x >= 360 &&
        /^[\d.]+,\d{2}$/.test(candidate.str.trim()),
    );
    if (!amountItem)
      throw new Error(`Could not read the amount for ABN AMRO transaction ${item.str}.`);
    const amount = euroAmount(amountItem.str) * (amountItem.x < 480 ? -1 : 1);
    const descriptionParts = chunk
      .filter(
        (candidate) =>
          candidate.x >= 80 &&
          candidate.x < 360 &&
          !/^(Description|Account Type|Account number|Date|No of pages|Page|Stmt no|ABN AMRO Bank)/i.test(
            normalizedText(candidate.str),
          ),
      )
      .map((candidate) => normalizedText(candidate.str))
      .filter(Boolean);
    const description = descriptionParts.join(" ").replace(/\s+/g, " ").slice(0, 2000);
    const name = descriptionParts[0] ?? "ABN AMRO transaction";
    const counterpartyIban = /IBAN:\s*([A-Z]{2}\d{2}[A-Z0-9]+)/i.exec(description)?.[1] ?? null;
    const counterpartyName =
      /Naam:\s*(.*?)(?=\s+(?:Omschrijving|Kenmerk|ID debiteur|BIC):|$)/i
        .exec(description)?.[1]
        ?.trim() ?? null;
    const bookedAt = dateForAbn(item.str.trim(), statementDate);
    const valueDate = /^\((\d{2}-\d{2})\)$/.exec(
      chunk
        .find((candidate) => candidate.x < 80 && /^\(\d{2}-\d{2}\)$/.test(candidate.str.trim()))
        ?.str.trim() ?? "",
    )?.[1];
    const categorized = categoryFor(`${name} ${description}`, amount);
    return {
      transactionHash: transactionHash(["abn_amro", iban, bookedAt, amount, description]),
      bookedAt,
      valueAt: optionalDateForAbn(valueDate, statementDate),
      amount,
      currency: "EUR",
      name,
      description,
      transactionType: name,
      providerCode: null,
      counterpartyName,
      counterpartyAccountLast4: counterpartyIban ? last4(counterpartyIban) : null,
      category: categorized.category,
      categoryConfidence: categorized.confidence,
    };
  });
  const debitTotal =
    Math.round(
      -transactions.filter((row) => row.amount < 0).reduce((sum, row) => sum + row.amount, 0) * 100,
    ) / 100;
  const creditTotal =
    Math.round(
      transactions.filter((row) => row.amount > 0).reduce((sum, row) => sum + row.amount, 0) * 100,
    ) / 100;
  const issues: string[] = [];
  if (statedDebits === null || Math.abs(debitTotal - statedDebits) > 0.01)
    issues.push("Transaction debits do not reconcile to the statement control total.");
  if (statedCredits === null || Math.abs(creditTotal - statedCredits) > 0.01)
    issues.push("Transaction credits do not reconcile to the statement control total.");
  if (
    openingBalance === null ||
    closingBalance === null ||
    Math.abs(openingBalance + creditTotal - debitTotal - closingBalance) > 0.02
  )
    issues.push("Opening balance, cash movements, and closing balance do not reconcile.");
  return {
    provider: "abn_amro",
    institution: "ABN AMRO",
    accountName: "ABN AMRO personal",
    accountType: "Personal current account",
    ownershipType: "personal",
    accountLast4: last4(iban) ?? "",
    accountFingerprint: sha(iban),
    currency: "EUR",
    periodStart: transactions.map((row) => row.bookedAt).sort()[0] ?? statementDate,
    periodEnd: statementDate,
    openingBalance,
    closingBalance,
    debitTotal,
    creditTotal,
    validationStatus: issues.length ? "needs_review" : "verified",
    validationIssues: issues,
    transactions,
  };
}

type IngRow = Record<string, string>;

export function parseIngCsv(text: string): ParsedBankStatement {
  const result = Papa.parse<IngRow>(databaseSafeText(text.replace(/^\uFEFF/, ""), true), {
    header: true,
    skipEmptyLines: "greedy",
  });
  if (result.errors.length)
    throw new Error(`ING CSV could not be read: ${result.errors[0]?.message ?? "invalid CSV"}`);
  const required = [
    "Date",
    "Name / Description",
    "Account",
    "Debit/credit",
    "Amount (EUR)",
    "Transaction type",
  ];
  if (!required.every((column) => result.meta.fields?.includes(column)))
    throw new Error("This is not a supported ING transaction CSV.");
  const accounts = new Set(result.data.map((row) => row.Account).filter(Boolean));
  if (accounts.size !== 1) throw new Error("Import one ING bank account per CSV file.");
  const iban = [...accounts][0];
  if (!iban || !/^NL\d{2}INGB/.test(iban)) throw new Error("Could not identify the ING account.");
  const transactions = result.data.map((row, index) => {
    try {
      const bookedAt = isoDate(row.Date ?? "");
      const unsigned = euroAmount(row["Amount (EUR)"] ?? "");
      const amount = row["Debit/credit"] === "Debit" ? -unsigned : unsigned;
      const name = (row["Name / Description"] ?? "ING transaction").trim();
      const description = (row.Notifications ?? "").trim().replace(/\s+/g, " ").slice(0, 2000);
      const counterparty = (row.Counterparty ?? "").replace(/\s/g, "");
      const categorized = categoryFor(`${name} ${description} ${counterparty}`, amount);
      return {
        transactionHash: transactionHash([
          "ing",
          iban,
          bookedAt,
          amount,
          name,
          row.Code ?? null,
          row["Transaction type"] ?? null,
          description,
        ]),
        bookedAt,
        valueAt: null,
        amount,
        currency: "EUR",
        name,
        description,
        transactionType: row["Transaction type"] || null,
        providerCode: row.Code || null,
        counterpartyName: null,
        counterpartyAccountLast4: counterparty ? last4(counterparty) : null,
        category: categorized.category,
        categoryConfidence: categorized.confidence,
      } satisfies ParsedBankTransaction;
    } catch (error) {
      throw new Error(
        `ING row ${index + 2}: ${error instanceof Error ? error.message : "could not be parsed"}`,
      );
    }
  });
  const dates = transactions.map((row) => row.bookedAt).sort();
  const debitTotal =
    Math.round(
      -transactions.filter((row) => row.amount < 0).reduce((sum, row) => sum + row.amount, 0) * 100,
    ) / 100;
  const creditTotal =
    Math.round(
      transactions.filter((row) => row.amount > 0).reduce((sum, row) => sum + row.amount, 0) * 100,
    ) / 100;
  return {
    provider: "ing",
    institution: "ING",
    accountName: "ING current",
    accountType: "Current account",
    ownershipType: "personal",
    accountLast4: last4(iban) ?? "",
    accountFingerprint: sha(iban),
    currency: "EUR",
    periodStart: dates[0] ?? null,
    periodEnd: dates.at(-1) ?? null,
    openingBalance: null,
    closingBalance: null,
    debitTotal,
    creditTotal,
    validationStatus: "parsed",
    validationIssues: [
      "ING exports do not include independent opening and closing balance controls.",
    ],
    transactions,
  };
}

export async function parseBankStatement(bytes: Uint8Array, fileName: string) {
  if (new TextDecoder("ascii").decode(bytes.slice(0, 5)) === "%PDF-")
    return parseAbnAmroStatement(bytes);
  if (fileName.toLowerCase().endsWith(".csv"))
    return parseIngCsv(new TextDecoder("utf-8").decode(bytes));
  throw new Error("Select an ABN AMRO PDF statement or ING CSV export.");
}
