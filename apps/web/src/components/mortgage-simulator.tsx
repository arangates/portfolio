"use client";

import { MortgageScenarioChart } from "@/components/mortgage-charts";
import { formatFullCurrency, formatPercent } from "@/lib/format";
import { simulateScenario, type MortgageModel } from "@portfolio/api/mortgage-calculations";
import { Badge } from "@portfolio/ui/components/badge";
import { Button } from "@portfolio/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@portfolio/ui/components/card";
import { Label } from "@portfolio/ui/components/label";
import { cn } from "@portfolio/ui/lib/utils";
import { useMemo, useState } from "react";

const eur = (value: number) => formatFullCurrency(value, "EUR");
const monthYear = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("en-GB", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${iso}T12:00:00Z`))
    : "—";
const span = (months: number) => `${Math.floor(Math.abs(months) / 12)}y ${Math.abs(months) % 12}m`;

function Slider({
  id,
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        <span className="text-sm font-semibold tabular-nums">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer accent-primary"
      />
    </div>
  );
}

function Result({
  label,
  value,
  note,
  good,
}: {
  label: string;
  value: string;
  note?: string;
  good?: boolean;
}) {
  return (
    <div className="space-y-1 rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-lg font-semibold tabular-nums",
          good && "text-emerald-600 dark:text-emerald-400",
        )}
      >
        {value}
      </p>
      {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
    </div>
  );
}

export function MortgageSimulator({ model }: { model: MortgageModel }) {
  const { terms, summary } = model;
  const [extraMonthly, setExtraMonthly] = useState(0);
  const [lumpSum, setLumpSum] = useState(0);
  const [resetRate, setResetRate] = useState<number | null>(null);
  const maxLump = Math.min(terms.currentBalance, Math.round(terms.freeRepaymentAllowance * 1.5));

  const result = useMemo(
    () =>
      simulateScenario(model, {
        extraMonthly,
        lumpSum,
        rateAfterFixed: resetRate ?? undefined,
      }),
    [model, extraMonthly, lumpSum, resetRate],
  );
  const reset =
    resetRate !== null
      ? result.scenario.rows.find((row) => row.date === terms.fixedRateEndDate)
      : null;
  const untouched = extraMonthly === 0 && lumpSum === 0 && resetRate === null;

  return (
    <>
      <Card className="gap-0 py-0 shadow-xs">
        <CardHeader className="border-b px-4 py-4 sm:px-5">
          <CardTitle className="text-base">What-if simulator</CardTitle>
          <CardDescription>
            Try extra repayments or a different renewal rate. Results compare against your current
            plan from the balance reported by the lender.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 p-4 sm:p-5 lg:grid-cols-3">
          <Slider
            id="extra-monthly"
            label="Extra repayment each month"
            value={extraMonthly}
            min={0}
            max={2000}
            step={25}
            display={eur(extraMonthly)}
            onChange={setExtraMonthly}
          />
          <div className="space-y-2">
            <Slider
              id="lump-sum"
              label="One-off lump sum now"
              value={lumpSum}
              min={0}
              max={maxLump}
              step={500}
              display={eur(lumpSum)}
              onChange={setLumpSum}
            />
            {lumpSum > terms.freeRepaymentAllowance ? (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Above the {eur(terms.freeRepaymentAllowance)} penalty-free allowance — the excess
                may trigger a prepayment penalty.
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Slider
              id="reset-rate"
              label={`Renewal rate from ${monthYear(terms.fixedRateEndDate)}`}
              value={resetRate ?? summary.rate}
              min={0.01}
              max={0.09}
              step={0.0025}
              display={resetRate === null ? "unchanged" : formatPercent(resetRate, 2)}
              onChange={setResetRate}
            />
            {resetRate !== null ? (
              <Button variant="ghost" size="xs" onClick={() => setResetRate(null)}>
                Keep current rate
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:col-span-3">
            <span className="text-xs text-muted-foreground">Presets</span>
            <Button variant="outline" size="xs" onClick={() => setExtraMonthly(100)}>
              +€100 / month
            </Button>
            <Button variant="outline" size="xs" onClick={() => setExtraMonthly(250)}>
              +€250 / month
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() =>
                setLumpSum(Math.min(terms.freeRepaymentAllowance, terms.currentBalance))
              }
            >
              Full free allowance
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                setExtraMonthly(0);
                setLumpSum(0);
                setResetRate(null);
              }}
            >
              Reset
            </Button>
            {lumpSum <= terms.freeRepaymentAllowance && lumpSum > 0 ? (
              <Badge variant="secondary">Within free allowance</Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Result
          label="Interest saved"
          value={eur(result.interestSaved)}
          note={
            untouched
              ? "Move a slider to compare"
              : `Remaining interest ${eur(result.scenario.totalInterest)}`
          }
          good={result.interestSaved > 0}
        />
        <Result
          label="Debt-free date"
          value={monthYear(result.payoffDate)}
          note={
            result.monthsSaved !== 0
              ? `${span(result.monthsSaved)} ${result.monthsSaved > 0 ? "sooner" : "later"} than the current plan (${monthYear(model.baseline.payoffDate)})`
              : "Same as the current plan"
          }
          good={result.monthsSaved > 0}
        />
        <Result
          label="Extra cash you put in"
          value={eur(result.extraOutlay)}
          note={
            result.extraOutlay > 0
              ? `Return: ${((result.interestSaved / result.extraOutlay) * 100).toFixed(0)}% of every extra euro comes back as interest saved`
              : "No extra repayments selected"
          }
        />
        <Result
          label={
            reset
              ? `Payment from ${monthYear(terms.fixedRateEndDate)}`
              : "Total interest over the loan"
          }
          value={reset ? eur(reset.payment) : eur(result.lifetimeInterest)}
          note={
            reset
              ? `${reset.payment >= terms.monthlyPayment ? "+" : ""}${eur(reset.payment - terms.monthlyPayment)} versus today`
              : `Currently ${eur(summary.lifetimeInterest)}`
          }
        />
      </div>

      <MortgageScenarioChart model={model} result={result} />
    </>
  );
}
