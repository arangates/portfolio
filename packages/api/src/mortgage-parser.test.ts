import assert from "node:assert/strict";
import test from "node:test";

import { parseDateText, parseMoneyText, parseMortgageOverviewLines } from "./mortgage-parser";

const lines = [
  "ING Hypotheekoverzicht",
  "Datum 3 oktober 2026",
  "Hypotheeknummer R 106-784564",
  "Passeerdatum 8 april 2024",
  "Aflossingsvorm Annuïteit",
  "Oorspronkelijk bedrag € 394.000,00",
  "Nog af te lossen € 368.353,25",
  "Afgelost € 25.646,75",
  "Bruto maandbedrag € 1.870,47",
  "Rentepercentage 4,15%",
  "Actieve betaalrentekorting 0,25%",
  "Duurzaamheidskorting Ja",
  "Rentevaste periode tot 1 mei 2034",
  "Einddatum 1 mei 2054",
  "Hypotheekinschrijving € 469.000,00",
  "Boetevrij extra aflossen € 39.400,00",
  "Marktwaarde woning € 385.000,00",
  "Datum taxatie 28 augustus 2023",
  "Energielabel A",
  "NHG Ja",
  "Bouwdepot oorspronkelijk € 9.000,00",
  "Bouwdepot saldo € 0,00",
];

test("parses amounts and dates in Dutch and English notation", () => {
  assert.equal(parseMoneyText("€ 368.353,25"), 368353.25);
  assert.equal(parseMoneyText("368,353.25"), 368353.25);
  assert.equal(parseMoneyText("9.000"), 9000);
  assert.equal(parseMoneyText("1870,47"), 1870.47);
  assert.equal(parseDateText("1 mei 2034"), "2034-05-01");
  assert.equal(parseDateText("03-10-2026"), "2026-10-03");
  assert.equal(parseDateText("3 Oct 2026"), "2026-10-03");
});

test("parses the ING mortgage overview", () => {
  const result = parseMortgageOverviewLines(lines);
  assert.equal(result.loanNumber, "R 106-784564");
  assert.equal(result.asOf, "2026-10-03");
  assert.equal(result.startDate, "2024-04-08");
  assert.equal(result.firstPaymentDate, "2024-06-01");
  assert.equal(result.endDate, "2054-05-01");
  assert.equal(result.fixedRateEndDate, "2034-05-01");
  assert.equal(result.originalAmount, 394_000);
  assert.equal(result.currentBalance, 368_353.25);
  assert.equal(result.monthlyPayment, 1_870.47);
  assert.equal(result.statedRate, 0.0415);
  assert.equal(result.discount, 0.0025);
  assert.equal(result.sustainabilityDiscount, true);
  assert.equal(result.registrationAmount, 469_000);
  assert.equal(result.freeRepaymentAllowance, 39_400);
  assert.equal(result.propertyValue, 385_000);
  assert.equal(result.valuationDate, "2023-08-28");
  assert.equal(result.energyLabel, "A");
  assert.equal(result.nhg, true);
  assert.equal(result.bouwdepotOriginal, 9_000);
  assert.equal(result.bouwdepotRemaining, 0);
  assert.equal(result.repaymentType, "annuity");
  assert.equal(result.validationStatus, "verified");
});

test("reads a value printed on the line after its label", () => {
  const stacked = lines.flatMap((line) => {
    const match = /^(Oorspronkelijk bedrag|Nog af te lossen|Bruto maandbedrag) (.+)$/.exec(line);
    return match ? [match[1] as string, match[2] as string] : [line];
  });
  const result = parseMortgageOverviewLines(stacked);
  assert.equal(result.originalAmount, 394_000);
  assert.equal(result.currentBalance, 368_353.25);
  assert.equal(result.monthlyPayment, 1_870.47);
});

test("rejects documents that are not a mortgage overview", () => {
  assert.throws(() => parseMortgageOverviewLines(["Salarisstrook", "Netto € 3.000,00"]));
});

test("flags incomplete overviews for review", () => {
  const result = parseMortgageOverviewLines(
    lines.filter((line) => !line.startsWith("Rentevaste") && !line.startsWith("Passeerdatum")),
  );
  assert.equal(result.validationStatus, "needs_review");
  assert.ok(result.validationIssues.length > 0);
});
