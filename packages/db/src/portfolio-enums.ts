// Shared by forms, API validation and database schema. No server dependencies.
export const bankNameValues = [
  "SBI",
  "HDFC",
  "ICICI",
  "Kotak",
  "INDUSIND",
  "Axis Bank",
  "Bank of Baroda",
  "Canara Bank",
  "IDFC FIRST",
  "Yes Bank",
  "ABN AMRO",
  "ING",
  "Rabobank",
  "Wise",
  "Bunq",
  "N26",
  "Revolut",
  "PNB",
  "UNION",
  "RBI",
  "Other",
] as const;
export const depositTypeValues = [
  "NRE",
  "NRO",
  "RESIDENT",
  "RECURRING",
  "TAX_SAVER",
  "CORPORATE",
  "OTHER",
] as const;
export const currencyValues = [
  "INR",
  "EUR",
  "USD",
  "GBP",
  "CHF",
  "SGD",
  "AED",
  "JPY",
  "CAD",
  "AUD",
] as const;
export const accountTypeValues = [
  "NRE",
  "NRO",
  "PIS",
  "SALARY",
  "RESIDENT SB",
  "Personal current account",
  "Joint current account",
  "JOINT SAVINGS",
  "NEO",
  "RDG",
  "Broker cash",
  "Current account",
  "Other",
] as const;
export const commodityTypeValues = [
  "Gold",
  "Silver",
  "Brass",
  "Platinum",
  "Palladium",
  "Other",
] as const;
export const assetTypeValues = [
  "Vehicle",
  "Insurance",
  "Provident fund",
  "Pension",
  "Bond",
  "Cash",
  "Collectible",
  "Business interest",
  "Real estate",
  "Other",
] as const;
export const riskLevelValues = ["low", "moderate", "high"] as const;

export function normalizeBankName(value: unknown) {
  if (typeof value !== "string") return value;
  const aliases: Record<string, string> = {
    KOTAK: "Kotak",
    CANARA: "Canara Bank",
    AXIS: "Axis Bank",
    BOB: "Bank of Baroda",
  };
  const trimmed = value.trim();
  return (
    aliases[trimmed.toUpperCase()] ??
    bankNameValues.find((bank) => bank.toLowerCase() === trimmed.toLowerCase()) ??
    trimmed
  );
}
