"use client";

import { formatFullCurrency, formatPercent } from "@/lib/format";
import type {
  ExtraRepayment,
  MortgageTerms,
  RateBasis,
} from "@portfolio/api/mortgage-calculations";
import { Button } from "@portfolio/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@portfolio/ui/components/card";
import { Input } from "@portfolio/ui/components/input";
import { Label } from "@portfolio/ui/components/label";
import { PlusIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

export type MortgageSettingsState = {
  terms: MortgageTerms;
  rateBasis: RateBasis;
  extras: ExtraRepayment[];
  /** Annual property appreciation as a fraction. */
  appreciation: number;
};

const eur = (value: number) => formatFullCurrency(value, "EUR");

type MoneyKey =
  | "originalAmount"
  | "currentBalance"
  | "monthlyPayment"
  | "propertyValue"
  | "freeRepaymentAllowance"
  | "registrationAmount";
type DateKey =
  | "startDate"
  | "firstPaymentDate"
  | "endDate"
  | "fixedRateEndDate"
  | "asOf"
  | "valuationDate";

const MONEY_FIELDS: Array<{ key: MoneyKey; label: string }> = [
  { key: "originalAmount", label: "Original loan amount" },
  { key: "currentBalance", label: "Outstanding (nog af te lossen)" },
  { key: "monthlyPayment", label: "Monthly payment" },
  { key: "propertyValue", label: "Property value" },
  { key: "freeRepaymentAllowance", label: "Penalty-free repayment / year" },
  { key: "registrationAmount", label: "Registered mortgage amount" },
];
const DATE_FIELDS: Array<{ key: DateKey; label: string }> = [
  { key: "startDate", label: "Deed date (passeerdatum)" },
  { key: "firstPaymentDate", label: "First instalment" },
  { key: "endDate", label: "Last instalment (einddatum)" },
  { key: "fixedRateEndDate", label: "Fixed-rate period ends" },
  { key: "asOf", label: "Balance as of" },
  { key: "valuationDate", label: "Valuation date" },
];

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

export function MortgageSettings({
  settings,
  defaultSettings,
  onChange,
  onReset,
  impliedRate,
  balanceGap,
}: {
  settings: MortgageSettingsState;
  defaultSettings: MortgageSettingsState;
  onChange: (next: MortgageSettingsState) => void;
  onReset: () => void;
  impliedRate: number;
  balanceGap: number;
}) {
  const { terms } = settings;
  const [extraDate, setExtraDate] = useState("");
  const [extraAmount, setExtraAmount] = useState("");
  const setTerms = (patch: Partial<MortgageTerms>) =>
    onChange({ ...settings, terms: { ...terms, ...patch } });
  const addExtra = () => {
    const amount = Number(extraAmount);
    if (!extraDate || !Number.isFinite(amount) || amount <= 0) return;
    onChange({
      ...settings,
      extras: [...settings.extras, { date: extraDate, amount }].toSorted((a, b) =>
        a.date.localeCompare(b.date),
      ),
    });
    setExtraDate("");
    setExtraAmount("");
  };
  const rateOptions: Array<{ value: RateBasis; label: string; rate: number }> = [
    { value: "implied", label: "Implied by payment", rate: impliedRate },
    { value: "stated", label: "Stated rate", rate: terms.statedRate },
    {
      value: "net",
      label: "Stated minus discount",
      rate: Math.max(0, terms.statedRate - terms.discount),
    },
  ];

  return (
    <>
      <Card className="gap-0 py-0 shadow-xs">
        <CardHeader className="border-b px-4 py-4 sm:px-5">
          <CardTitle className="text-base">Mortgage terms</CardTitle>
          <CardDescription>
            Prefilled from the ING overview. Edit after a new overview or rate renewal — changes are
            saved in this browser and every chart recalculates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {MONEY_FIELDS.map(({ key, label }) => (
              <Field key={key} id={`mortgage-${key}`} label={label}>
                <Input
                  id={`mortgage-${key}`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={terms[key]}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (Number.isFinite(value) && value >= 0) setTerms({ [key]: value });
                  }}
                />
              </Field>
            ))}
            <Field id="mortgage-statedRate" label="Stated interest rate (%)">
              <Input
                id="mortgage-statedRate"
                type="number"
                step="0.01"
                min={0}
                value={Number((terms.statedRate * 100).toFixed(4))}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  if (Number.isFinite(value) && value >= 0) setTerms({ statedRate: value / 100 });
                }}
              />
            </Field>
            <Field id="mortgage-discount" label="Active discount (%)">
              <Input
                id="mortgage-discount"
                type="number"
                step="0.01"
                min={0}
                value={Number((terms.discount * 100).toFixed(4))}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  if (Number.isFinite(value) && value >= 0) setTerms({ discount: value / 100 });
                }}
              />
            </Field>
            <Field id="mortgage-appreciation" label="Assumed property growth / year (%)">
              <Input
                id="mortgage-appreciation"
                type="number"
                step="0.1"
                value={Number((settings.appreciation * 100).toFixed(2))}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  if (Number.isFinite(value)) onChange({ ...settings, appreciation: value / 100 });
                }}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {DATE_FIELDS.map(({ key, label }) => (
              <Field key={key} id={`mortgage-${key}`} label={label}>
                <Input
                  id={`mortgage-${key}`}
                  type="date"
                  value={terms[key]}
                  onChange={(event) => {
                    if (event.target.value) setTerms({ [key]: event.target.value });
                  }}
                />
              </Field>
            ))}
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Interest rate used for the schedule</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {rateOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <input
                    type="radio"
                    name="mortgage-rate-basis"
                    className="mt-1 accent-primary"
                    checked={settings.rateBasis === option.value}
                    onChange={() => onChange({ ...settings, rateBasis: option.value })}
                  />
                  <span className="text-sm">
                    <span className="block font-medium">{option.label}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {formatPercent(option.rate, 3)}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              “Implied” is the rate at which {eur(terms.monthlyPayment)} a month exactly repays{" "}
              {eur(terms.originalAmount)} by the end date — it reproduces your payment best.
            </p>
          </fieldset>
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcwIcon /> Restore ING overview values
          </Button>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0 shadow-xs">
        <CardHeader className="border-b px-4 py-4 sm:px-5">
          <CardTitle className="text-base">Extra repayments</CardTitle>
          <CardDescription>
            {balanceGap > 250
              ? `The lender's balance is ${eur(balanceGap)} below a plain annuity. Record known extra repayments here until the gap closes.`
              : "Record any lump-sum repayments you made so the history matches reality."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Field id="extra-date" label="Date">
              <Input
                id="extra-date"
                type="date"
                value={extraDate}
                min={terms.startDate}
                max={terms.asOf}
                onChange={(event) => setExtraDate(event.target.value)}
              />
            </Field>
            <Field id="extra-amount" label="Amount (€)">
              <Input
                id="extra-amount"
                type="number"
                min={0}
                step="0.01"
                value={extraAmount}
                onChange={(event) => setExtraAmount(event.target.value)}
              />
            </Field>
            <Button onClick={addExtra} disabled={!extraDate || !(Number(extraAmount) > 0)}>
              <PlusIcon /> Add
            </Button>
          </div>
          {settings.extras.length > 0 ? (
            <ul className="divide-y rounded-lg border">
              {settings.extras.map((extra, index) => (
                <li
                  key={`${extra.date}-${index}`}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                >
                  <span>{extra.date}</span>
                  <span className="ml-auto font-medium tabular-nums">{eur(extra.amount)}</span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Remove extra repayment on ${extra.date}`}
                    onClick={() =>
                      onChange({
                        ...settings,
                        extras: settings.extras.filter((_, position) => position !== index),
                      })
                    }
                  >
                    <Trash2Icon />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No extra repayments recorded.</p>
          )}
          <p className="text-xs text-muted-foreground">
            Defaults: {formatPercent(defaultSettings.terms.statedRate, 2)} stated rate,{" "}
            {eur(defaultSettings.terms.monthlyPayment)} per month.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
