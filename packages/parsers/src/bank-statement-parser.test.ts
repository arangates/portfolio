import assert from "node:assert/strict";
import test from "node:test";

import { parseIngCsv } from "./bank-statement-parser";

const header =
  "Date,Name / Description,Account,Counterparty,Code,Debit/credit,Amount (EUR),Transaction type,Notifications";

test("ING CSV preserves signed cash flows and account metadata", () => {
  const parsed = parseIngCsv(
    [
      header,
      '20260125,ASML Netherlands BV,NL89INGB0102253102,NL26CITI2032289458,GT,Credit,"5.274,02",Transfer,Payroll salary',
      '20260126,Albert Heijn,NL89INGB0102253102,,BA,Debit,"84,20",Payment terminal,Groceries',
    ].join("\n"),
  );
  assert.equal(parsed.ownershipType, "personal");
  assert.equal(parsed.transactions[0]?.amount, 5274.02);
  assert.equal(parsed.transactions[0]?.category, "salary");
  assert.equal(parsed.transactions[1]?.amount, -84.2);
  assert.equal(parsed.transactions[1]?.category, "groceries");
  assert.equal(parsed.debitTotal, 84.2);
  assert.equal(parsed.creditTotal, 5274.02);
});

test("ING CSV rejects files containing multiple accounts", () => {
  assert.throws(
    () =>
      parseIngCsv(
        [
          header,
          '20260125,Income,NL89INGB0102253102,,GT,Credit,"10,00",Transfer,',
          '20260126,Income,NL00INGB0000000000,,GT,Credit,"10,00",Transfer,',
        ].join("\n"),
      ),
    /one ING bank account/i,
  );
});
