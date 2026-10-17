import assert from "node:assert/strict";
import test from "node:test";

import { parseIndiaItrJson } from "./income-tax-parser";

function fixture(overrides: Record<string, unknown> = {}) {
  return new TextEncoder().encode(
    JSON.stringify({
      ITR: {
        ITR2: {
          CreationInfo: { JSONCreationDate: "2026-05-27" },
          Form_ITR2: {
            AssessmentYear: "2026",
            FormName: "ITR-2",
            SchemaVer: "Ver1.0",
            FormVer: "Ver1.0",
          },
          PartA_GEN1: {
            FilingStatus: { ReturnFileSec: 11, ResidentialStatus: "NRI", NewTaxRegime: "N" },
          },
          "PartB-TI": {
            Salaries: 100,
            IncomeFromHP: 0,
            CapGain: { TotalCapGains: 25 },
            IncFromOS: { TotIncFromOS: 10 },
            GrossTotalIncome: 135,
            DeductionsUnderScheduleVIA: 5,
            TotalIncome: 130,
          },
          PartB_TTI: {
            ComputationOfTaxLiability: {
              NetTaxLiability: 20,
              IntrstPay: { TotalIntrstPay: 2 },
              AggregateTaxInterestLiability: 22,
            },
            TaxPaid: {
              TaxesPaid: {
                AdvanceTax: 0,
                TDS: 30,
                TCS: 0,
                SelfAssessmentTax: 0,
                TotalTaxesPaid: 30,
              },
              BalTaxPayable: 0,
            },
            Refund: { RefundDue: 8 },
          },
          ...overrides,
        },
      },
    }),
  );
}

test("normalizes an ITR-2 filing and derives FY/AY labels", () => {
  const result = parseIndiaItrJson(fixture(), "970878590270526.json");
  assert.equal(result.assessmentYearLabel, "2026-27");
  assert.equal(result.financialYearLabel, "2025-26");
  assert.equal(result.acknowledgementNumber, "970878590270526");
  assert.equal(result.filingSection, "139(1)");
  assert.equal(result.capitalGains, 25);
  assert.equal(result.taxRegime, "old");
  assert.equal(result.validationStatus, "verified");
});

test("reads nested ITR-3 business income and deductions", () => {
  const bytes = new TextEncoder().encode(
    JSON.stringify({
      ITR: {
        ITR3: {
          Form_ITR3: { AssessmentYear: "2022", FormName: "ITR-3" },
          PartA_GEN1: { FilingStatus: { ReturnFileSec: 11 } },
          "PartB-TI": {
            ProfBusGain: { TotProfBusGain: 873 },
            CapGain: { TotalCapGains: 241750 },
            IncFromOS: { TotIncFromOS: 34566 },
            DeductionsUndSchVIADtl: { TotDeductUndSchVIA: 176727 },
            GrossTotalIncome: 1296381,
            TotalIncome: 1119650,
          },
          PartB_TTI: {
            ComputationOfTaxLiability: {
              NetTaxLiability: 129317,
              IntrstPay: { TotalIntrstPay: 0 },
              AggregateTaxInterestLiability: 129317,
            },
            TaxPaid: {
              TaxesPaid: { TDS: 300095, TotalTaxesPaid: 300095 },
              BalTaxPayable: 0,
            },
            Refund: { RefundDue: 170778 },
          },
        },
      },
    }),
  );
  const result = parseIndiaItrJson(bytes, "return.json");
  assert.equal(result.businessIncome, 873);
  assert.equal(result.chapterViDeductions, 176727);
  assert.equal(result.validationStatus, "verified");
});

test("flags internally inconsistent tax totals", () => {
  const bad = fixture({
    PartB_TTI: {
      ComputationOfTaxLiability: {
        NetTaxLiability: 20,
        IntrstPay: { TotalIntrstPay: 2 },
        AggregateTaxInterestLiability: 50,
      },
      TaxPaid: {
        TaxesPaid: { TDS: 30, TotalTaxesPaid: 10 },
        BalTaxPayable: 1,
      },
      Refund: { RefundDue: 8 },
    },
  });
  const result = parseIndiaItrJson(bad, "return.json");
  assert.equal(result.validationStatus, "needs_review");
  assert.equal(result.validationIssues.length, 3);
});

test("rejects unsupported JSON", () => {
  assert.throws(
    () => parseIndiaItrJson(new TextEncoder().encode('{"ITR":{"ITR1":{}}}'), "return.json"),
    /Only Indian ITR-2 and ITR-3/,
  );
});
