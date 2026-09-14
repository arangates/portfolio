export type PayslipEvidence = {
  id: string;
  payPeriod: string;
  netPay: number;
};

export type SalaryCreditEvidence = {
  id: string;
  bookedAt: string;
  amount: number;
};

export type SalaryReconciliationRow = {
  payslipId: string;
  payPeriod: string;
  expectedAmount: number;
  creditId: string | null;
  creditDate: string | null;
  creditedAmount: number | null;
  difference: number | null;
  status: "matched" | "amount_mismatch" | "missing_credit";
};

export function reconcileSalaryPayouts(
  payslips: PayslipEvidence[],
  credits: SalaryCreditEvidence[],
  tolerance = 0.02,
) {
  const available = new Set(credits.map((credit) => credit.id));
  const rows: SalaryReconciliationRow[] = payslips
    .toSorted((left, right) => left.payPeriod.localeCompare(right.payPeriod))
    .map((payslip) => {
      const month = payslip.payPeriod.slice(0, 7);
      const candidates = credits
        .filter((credit) => available.has(credit.id) && credit.bookedAt.slice(0, 7) === month)
        .toSorted(
          (left, right) =>
            Math.abs(left.amount - payslip.netPay) - Math.abs(right.amount - payslip.netPay),
        );
      const credit = candidates[0];
      if (!credit)
        return {
          payslipId: payslip.id,
          payPeriod: payslip.payPeriod,
          expectedAmount: payslip.netPay,
          creditId: null,
          creditDate: null,
          creditedAmount: null,
          difference: null,
          status: "missing_credit" as const,
        };
      available.delete(credit.id);
      const difference = Math.round((credit.amount - payslip.netPay) * 100) / 100;
      return {
        payslipId: payslip.id,
        payPeriod: payslip.payPeriod,
        expectedAmount: payslip.netPay,
        creditId: credit.id,
        creditDate: credit.bookedAt,
        creditedAmount: credit.amount,
        difference,
        status:
          Math.abs(difference) <= tolerance ? ("matched" as const) : ("amount_mismatch" as const),
      };
    });
  return {
    rows,
    matched: rows.filter((row) => row.status === "matched").length,
    mismatched: rows.filter((row) => row.status === "amount_mismatch").length,
    missing: rows.filter((row) => row.status === "missing_credit").length,
    payslips: rows.length,
  };
}
