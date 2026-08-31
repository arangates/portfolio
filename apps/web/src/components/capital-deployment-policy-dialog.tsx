"use client";

import { Button } from "@portfolio/ui/components/button";
import { Checkbox } from "@portfolio/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@portfolio/ui/components/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@portfolio/ui/components/field";
import { Input } from "@portfolio/ui/components/input";
import { Spinner } from "@portfolio/ui/components/spinner";
import { Settings2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Bucket =
  | "indian_equity"
  | "global_equity"
  | "fixed_income"
  | "hybrid"
  | "cash"
  | "other_marketable";

type Allocation = {
  bucket: Bucket;
  label: string;
  currentWeight: number;
  targetWeight: number | null;
  minimumWeight: number | null;
  maximumWeight: number | null;
};

function percentage(value: number) {
  return Math.round(value * 1000) / 10;
}

function initialTargets(allocation: Allocation[]) {
  const values = Object.fromEntries(
    allocation.map((item) => [
      item.bucket,
      item.targetWeight === null ? percentage(item.currentWeight) : percentage(item.targetWeight),
    ]),
  ) as Record<Bucket, number>;
  const total = Object.values(values).reduce((sum, value) => sum + value, 0);
  const largest = [...allocation].sort((a, b) => b.currentWeight - a.currentWeight)[0];
  if (largest && Math.abs(total - 100) > 0.001) {
    values[largest.bucket] = Math.max(0, values[largest.bucket] + (100 - total));
  }
  return values;
}

export function CapitalDeploymentPolicyDialog({
  policy,
  allocation,
  stagingCandidates,
  baseCurrency,
}: {
  policy: {
    configured: boolean;
    stagingInstrumentId: string | null;
    monthlyDeploymentAmount: number;
    deploymentCurrency: string;
    reserveFloor: number;
    fixedDepositHorizonDays: number;
    transferMatchWindowDays: number;
    transferMatchTolerance: number;
    includeBankCash: boolean;
    enabled: boolean;
  };
  allocation: Allocation[];
  stagingCandidates: Array<{ instrumentId: string; name: string }>;
  baseCurrency: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [targets, setTargets] = useState<Record<Bucket, number>>(() => initialTargets(allocation));
  const router = useRouter();
  const targetTotal = Object.values(targets).reduce((sum, value) => sum + Number(value || 0), 0);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      stagingInstrumentId: form.get("stagingInstrumentId") || null,
      monthlyDeploymentAmount: form.get("monthlyDeploymentAmount"),
      deploymentCurrency: String(form.get("deploymentCurrency") ?? baseCurrency).toUpperCase(),
      reserveFloor: form.get("reserveFloor"),
      fixedDepositHorizonDays: form.get("fixedDepositHorizonDays"),
      transferMatchWindowDays: form.get("transferMatchWindowDays"),
      transferMatchTolerancePercent: form.get("transferMatchTolerancePercent"),
      includeBankCash: form.has("includeBankCash"),
      enabled: form.has("enabled"),
      targets: allocation.map((item) => ({
        bucket: item.bucket,
        targetPercent: targets[item.bucket],
        minimumPercent: form.get(`minimum_${item.bucket}`),
        maximumPercent: form.get(`maximum_${item.bucket}`),
      })),
    };
    try {
      const response = await fetch("/api/capital-deployment/policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not save deployment policy");
      toast.success("Capital deployment policy saved");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save deployment policy");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Settings2Icon data-icon="inline-start" />
        {policy.configured ? "Edit policy" : "Configure policy"}
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Capital deployment policy</DialogTitle>
          <DialogDescription>
            Targets are your instructions. Selvam never invents an allocation or places a trade.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-6">
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="stagingInstrumentId">Staging reserve</FieldLabel>
              <select
                id="stagingInstrumentId"
                name="stagingInstrumentId"
                defaultValue={policy.stagingInstrumentId ?? ""}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="">Auto-detect from debt holdings</option>
                {stagingCandidates.map((candidate) => (
                  <option key={candidate.instrumentId} value={candidate.instrumentId}>
                    {candidate.name}
                  </option>
                ))}
              </select>
              <FieldDescription>
                Used only to identify possible STP flows and capital available for deployment.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="monthlyDeploymentAmount">Planned monthly deployment</FieldLabel>
              <Input
                id="monthlyDeploymentAmount"
                name="monthlyDeploymentAmount"
                type="number"
                min="0"
                step="any"
                defaultValue={policy.monthlyDeploymentAmount}
              />
              <FieldDescription>Set zero to keep recommendations amount-free.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="deploymentCurrency">Policy currency</FieldLabel>
              <Input
                id="deploymentCurrency"
                name="deploymentCurrency"
                maxLength={3}
                defaultValue={policy.deploymentCurrency || baseCurrency}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="reserveFloor">Staging reserve floor</FieldLabel>
              <Input
                id="reserveFloor"
                name="reserveFloor"
                type="number"
                min="0"
                step="any"
                defaultValue={policy.reserveFloor}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="fixedDepositHorizonDays">FD planning horizon</FieldLabel>
              <Input
                id="fixedDepositHorizonDays"
                name="fixedDepositHorizonDays"
                type="number"
                min="30"
                max="3650"
                defaultValue={policy.fixedDepositHorizonDays}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="transferMatchWindowDays">Possible STP match window</FieldLabel>
              <Input
                id="transferMatchWindowDays"
                name="transferMatchWindowDays"
                type="number"
                min="0"
                max="31"
                defaultValue={policy.transferMatchWindowDays}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="transferMatchTolerancePercent">Amount tolerance (%)</FieldLabel>
              <Input
                id="transferMatchTolerancePercent"
                name="transferMatchTolerancePercent"
                type="number"
                min="0"
                max="100"
                step="0.1"
                defaultValue={policy.transferMatchTolerance * 100}
              />
            </Field>
            <Field orientation="horizontal" className="items-center rounded-lg border p-3">
              <Checkbox
                id="includeBankCash"
                name="includeBankCash"
                defaultChecked={policy.includeBankCash}
              />
              <div>
                <FieldLabel htmlFor="includeBankCash">Include bank cash</FieldLabel>
                <FieldDescription>
                  Off by default because household and minimum-balance cash is usually operational.
                </FieldDescription>
              </div>
            </Field>
            <Field orientation="horizontal" className="items-center rounded-lg border p-3">
              <Checkbox id="enabled" name="enabled" defaultChecked={policy.enabled} />
              <div>
                <FieldLabel htmlFor="enabled">Policy enabled</FieldLabel>
                <FieldDescription>
                  Disabling preserves targets but hides action amounts.
                </FieldDescription>
              </div>
            </Field>
          </FieldGroup>

          <div className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h3 className="font-medium">Target allocation</h3>
                <p className="text-sm text-muted-foreground">
                  Minimum ≤ target ≤ maximum for every investable bucket.
                </p>
              </div>
              <p
                className={`text-sm font-medium tabular-nums ${Math.abs(targetTotal - 100) <= 0.01 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}
              >
                {targetTotal.toFixed(1)}%
              </p>
            </div>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-muted/40 text-left text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Bucket</th>
                    <th className="px-3 py-2 font-medium">Current</th>
                    <th className="px-3 py-2 font-medium">Minimum</th>
                    <th className="px-3 py-2 font-medium">Target</th>
                    <th className="px-3 py-2 font-medium">Maximum</th>
                  </tr>
                </thead>
                <tbody>
                  {allocation.map((item) => {
                    const target = targets[item.bucket];
                    return (
                      <tr key={item.bucket} className="border-t">
                        <td className="px-3 py-2 font-medium">{item.label}</td>
                        <td className="px-3 py-2 tabular-nums">
                          {percentage(item.currentWeight).toFixed(1)}%
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            name={`minimum_${item.bucket}`}
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            className="w-24"
                            defaultValue={
                              item.minimumWeight === null
                                ? Math.max(0, target - 5)
                                : percentage(item.minimumWeight)
                            }
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            className="w-24"
                            value={target}
                            onChange={(event) =>
                              setTargets((current) => ({
                                ...current,
                                [item.bucket]: Number(event.target.value),
                              }))
                            }
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            name={`maximum_${item.bucket}`}
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            className="w-24"
                            defaultValue={
                              item.maximumWeight === null
                                ? Math.min(100, target + 5)
                                : percentage(item.maximumWeight)
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending || Math.abs(targetTotal - 100) > 0.01}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              Save policy
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
