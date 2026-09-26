"use client";

import { useState } from "react";
import { Button } from "@portfolio/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@portfolio/ui/components/card";
import { Input } from "@portfolio/ui/components/input";
import { Badge } from "@portfolio/ui/components/badge";
import { Loader2Icon, SparklesIcon, WalletIcon } from "lucide-react";

type DeploymentLineItem = {
  bucket: string;
  label: string;
  amount: number;
  reason: string;
  priority: "high" | "medium" | "low";
};

type DeploymentPlan = {
  availableCash: number;
  currency: string;
  items: DeploymentLineItem[];
  totalDeployed: number;
  remainder: number;
  summary: string;
};

const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(Math.round(n));

export function LabsDeploymentPlan() {
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<DeploymentPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/deployment-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(amount ? { amount: parseFloat(amount) } : {}),
      });
      if (!res.ok) throw new Error("Failed to generate plan");
      const data = await res.json();
      setPlan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Capital Deployment Plan</CardTitle>
        <CardDescription>
          Generates a deterministic purchase plan for your surplus cash based on your exact target
          drift.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Input
            placeholder="Override deployment amount (optional)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={loading}
          />
          <Button onClick={handleGenerate} disabled={loading} className="shrink-0">
            {loading ? (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <SparklesIcon className="mr-2 h-4 w-4" />
            )}
            Generate Plan
          </Button>
        </div>

        {error && <div className="text-sm font-medium text-destructive">{error}</div>}

        {plan && (
          <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm font-medium leading-relaxed">{plan.summary}</p>
              <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <WalletIcon className="h-3 w-3" />
                  Available: {plan.currency} {fmt(plan.availableCash)}
                </span>
                <span className="flex items-center gap-1">
                  Total Deployed: {plan.currency} {fmt(plan.totalDeployed)}
                </span>
                <span className="flex items-center gap-1">
                  Remainder: {plan.currency} {fmt(plan.remainder)}
                </span>
              </div>
            </div>

            {plan.items.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Shopping List</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {plan.items.map((item, idx) => (
                    <Card key={idx} className="shadow-none">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-sm font-semibold">{item.label}</CardTitle>
                          <Badge variant={item.priority === "high" ? "default" : "secondary"}>
                            {item.priority} priority
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold tracking-tight text-primary">
                          {plan.currency} {fmt(item.amount)}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{item.reason}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
