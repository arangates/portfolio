"use client";

import { useEffect, useState } from "react";
import { Button } from "@portfolio/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@portfolio/ui/components/card";
import { Badge } from "@portfolio/ui/components/badge";
import { Loader2Icon, AlertTriangleIcon, CheckCircle2Icon, ArrowRightIcon } from "lucide-react";
import { cn } from "@portfolio/ui/lib/utils";

type ScenarioAdjustment = {
  type: string;
  label: string;
  amountOrPercent: number;
  durationMonths?: number;
};

type ScenarioResult = {
  label: string;
  adjustments: ScenarioAdjustment[];
  baseline: {
    currentCorpus: number;
    requiredCorpus: number;
    progressPercent: number;
    yearsToFire: number | null;
  };
  projected: {
    currentCorpus: number;
    requiredCorpus: number;
    progressPercent: number;
    yearsToFire: number | null;
    deltaYears: number | null;
  };
  impact: string;
};

const fmt = (n: number) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(n);
const fmtMoney = (n: number) => new Intl.NumberFormat("en-IN").format(Math.round(n));

export function LabsScenarioEngine() {
  const [presets, setPresets] = useState<
    Array<{ label: string; adjustments: ScenarioAdjustment[] }>
  >([]);
  const [loadingPresets, setLoadingPresets] = useState(true);

  const [running, setRunning] = useState<string | null>(null);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/scenarios")
      .then((res) => res.json())
      .then((data) => {
        setPresets(data);
        setLoadingPresets(false);
      })
      .catch(() => setLoadingPresets(false));
  }, []);

  async function handleRunScenario(preset: { label: string; adjustments: ScenarioAdjustment[] }) {
    setRunning(preset.label);
    setError(null);
    try {
      const res = await fetch("/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preset),
      });
      if (!res.ok) throw new Error("Failed to run scenario");
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setRunning(null);
    }
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>What-If Scenarios</CardTitle>
        <CardDescription>
          Hypothetical projection of life events against your FIRE plan running mathematically
          in-memory.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Select a Scenario</h4>
          <div className="flex flex-wrap gap-2">
            {loadingPresets ? (
              <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              presets.map((preset, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  onClick={() => handleRunScenario(preset)}
                  disabled={running !== null}
                >
                  {running === preset.label && (
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {preset.label}
                </Button>
              ))
            )}
          </div>
          {error && <div className="text-sm font-medium text-destructive mt-2">{error}</div>}
        </div>

        {result && (
          <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div
              className={cn(
                "rounded-lg border p-4 flex items-start gap-3",
                result.projected.deltaYears && result.projected.deltaYears > 0
                  ? "bg-red-500/10 border-red-500/20"
                  : "bg-emerald-500/10 border-emerald-500/20",
              )}
            >
              {result.projected.deltaYears && result.projected.deltaYears > 0 ? (
                <AlertTriangleIcon className="h-5 w-5 text-red-500 mt-0.5" />
              ) : (
                <CheckCircle2Icon className="h-5 w-5 text-emerald-500 mt-0.5" />
              )}
              <div>
                <h4 className="font-semibold text-sm">Scenario Impact: {result.label}</h4>
                <p className="text-sm mt-1">{result.impact}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border rounded-lg p-4 bg-muted/30">
              <div className="col-span-1 flex flex-col justify-center">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Baseline
                </span>
              </div>
              <div className="col-span-1 flex flex-col items-center justify-center">
                <ArrowRightIcon className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <div className="col-span-1 flex flex-col justify-center text-right">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Projected
                </span>
              </div>

              {/* Corpus Row */}
              <div className="col-span-1">
                <div className="text-lg font-bold">₹{fmtMoney(result.baseline.currentCorpus)}</div>
                <div className="text-xs text-muted-foreground">Current Corpus</div>
              </div>
              <div className="col-span-1" />
              <div className="col-span-1 text-right">
                <div className="text-lg font-bold">₹{fmtMoney(result.projected.currentCorpus)}</div>
                <div className="text-xs text-muted-foreground">Adjusted Corpus</div>
              </div>

              {/* Years to FIRE Row */}
              <div className="col-span-1">
                <div className="text-lg font-bold">
                  {result.baseline.yearsToFire ? `${fmt(result.baseline.yearsToFire)} yrs` : "N/A"}
                </div>
                <div className="text-xs text-muted-foreground">Time to FIRE</div>
              </div>
              <div className="col-span-1 flex items-center justify-center">
                {result.projected.deltaYears !== null && (
                  <Badge variant={result.projected.deltaYears > 0 ? "destructive" : "default"}>
                    {result.projected.deltaYears > 0 ? "+" : ""}
                    {fmt(result.projected.deltaYears)} yrs
                  </Badge>
                )}
              </div>
              <div className="col-span-1 text-right">
                <div className="text-lg font-bold">
                  {result.projected.yearsToFire
                    ? `${fmt(result.projected.yearsToFire)} yrs`
                    : "N/A"}
                </div>
                <div className="text-xs text-muted-foreground">Time to FIRE</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
