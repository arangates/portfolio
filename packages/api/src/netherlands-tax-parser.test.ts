import assert from "node:assert/strict";
import test from "node:test";

import { parseNetherlandsTaxAssessmentLines } from "./netherlands-tax-parser";

const verifiedLines = [
  "Belastingdienst",
  "Aanslag 2024",
  "Inkomstenbelasting",
  "Jaar",
  "2024",
  "Aanslagnummer",
  "1234.56.789.H.46.01",
  "Datum",
  "10 mei 2025",
  "Te ontvangen of te verrekenen € 4.530",
  "Loonheffing € 17.435",
  "Dividendbelasting en/of kansspelbelasting € 12",
  "Inkomstenbelasting en premie volksverzekeringen af € 9.553",
  "Eerder verleende voorlopige teruggave(n) af € 3.364",
  "Inkomstenbelasting en premie volksverzekeringen",
  "Inkomstenbelasting box 1 € 5.350",
  "Premie volksverzekeringen bij € 10.534",
  "Heffingskortingen af € 6.331",
  "Inkomstenbelasting en premie volksverzekeringen € 9.553",
  "Heffingskortingen",
  "Algemene heffingskorting € 2.159",
  "Arbeidskorting bij € 4.172",
  "Heffingskortingen € 6.331",
  "Inkomstenbelasting box 1",
  "Belastbaar inkomen uit werk en woning € 42.967",
  "Inkomstenbelasting box 1 € 5.350",
  "Premie volksverzekeringen",
  "Premie-inkomen € 38.098 (maximum)",
  "Premie volksverzekeringen 27,650% van € 38.098 € 10.534",
  "Inkomstenbelasting box 3",
  "Belastbaar inkomen uit sparen en beleggen € 0",
  "Inkomstenbelasting box 3: 36,000% van € 0 € 0",
  "Verzamelinkomen",
  "Verzamelinkomen € 42.967",
];

test("parses and reconciles a final Dutch assessment", () => {
  const result = parseNetherlandsTaxAssessmentLines(verifiedLines, "assessment.pdf");
  assert.equal(result.taxYear, 2024);
  assert.equal(result.assessmentDate, "2025-05-10");
  assert.equal(result.assessmentReferenceSuffix, "46.01");
  assert.equal(result.aggregateIncome, 42_967);
  assert.equal(result.box3TaxableIncome, 0);
  assert.equal(result.settlementAmount, 4_530);
  assert.equal(result.validationStatus, "verified");
});

test("recognizes a revised reduction and prior balance", () => {
  const result = parseNetherlandsTaxAssessmentLines(
    verifiedLines
      .map((line) =>
        line === "Aanslag 2024"
          ? "Vermindering"
          : line === "2024"
            ? "2021"
            : line === "Te ontvangen of te verrekenen € 4.530"
              ? "Te ontvangen of te verrekenen € 4.454"
              : line,
      )
      .concat("Saldo (eerder) € 76"),
    "nieuwe_definitieve_aanslag.pdf",
  );
  assert.equal(result.assessmentType, "revised_final");
  assert.equal(result.priorBalanceAdjustment, 76);
  assert.equal(result.validationStatus, "verified");
});

test("marks an inconsistent settlement for review", () => {
  const result = parseNetherlandsTaxAssessmentLines(
    verifiedLines.map((line) =>
      line === "Te ontvangen of te verrekenen € 4.530"
        ? "Te ontvangen of te verrekenen € 5.000"
        : line,
    ),
    "assessment.pdf",
  );
  assert.equal(result.validationStatus, "needs_review");
  assert.match(result.validationIssues.join(" "), /refund or payable amount/i);
});
