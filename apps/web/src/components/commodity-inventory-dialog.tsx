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
import { Field, FieldDescription, FieldError, FieldLabel } from "@portfolio/ui/components/field";
import { Input } from "@portfolio/ui/components/input";
import { Spinner } from "@portfolio/ui/components/spinner";
import { Textarea } from "@portfolio/ui/components/textarea";
import { PencilIcon, PlusIcon, SaveIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Values = Record<string, string | number | boolean | null | undefined>;
type HoldingOption = { id: string; name: string; commodityType: string };

const today = new Date().toISOString().slice(0, 10);
const getValue = (values: Values, key: string, fallback = "") => {
  const current = values[key];
  return current == null ? fallback : String(current);
};

function InputField({
  values,
  name,
  label,
  type = "text",
  required = false,
  description,
  min,
  max,
  step,
}: {
  values: Values;
  name: string;
  label: string;
  type?: React.HTMLInputTypeAttribute;
  required?: boolean;
  description?: string;
  min?: string;
  max?: string;
  step?: string;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={`inventory-${name}`}>{label}</FieldLabel>
      <Input
        id={`inventory-${name}`}
        name={name}
        type={type}
        required={required}
        min={min}
        max={max}
        step={step}
        defaultValue={getValue(values, name, type === "date" ? today : "")}
      />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}

export function CommodityInventoryDialog({
  holdings,
  values = {},
  compact = false,
}: {
  holdings: HoldingOption[];
  values?: Values;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const editing = Boolean(values.id);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries()) as Record<string, unknown>;
    if (values.id) data.id = values.id;
    data.eligibleForFire = formData.has("eligibleForFire");
    try {
      const response = await fetch("/api/commodity-inventory/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not save inventory item");
      toast.success(`Inventory item ${editing ? "updated" : "added"}`);
      setOpen(false);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save inventory item");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant={editing ? "ghost" : "outline"} size={compact ? "icon-sm" : "sm"} />
        }
      >
        {editing ? <PencilIcon /> : <PlusIcon data-icon="inline-start" />}
        {compact ? <span className="sr-only">Edit inventory item</span> : "Add inventory item"}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Update" : "Add"} physical item</DialogTitle>
          <DialogDescription>
            Preserve item-level provenance and dated measurements without changing the declared
            commodity total.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-5" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="inventory-holding">Commodity holding</FieldLabel>
              <select
                id="inventory-holding"
                name="commodityHoldingId"
                required
                defaultValue={getValue(values, "commodityHoldingId", holdings[0]?.id)}
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              >
                {holdings.map((holding) => (
                  <option key={holding.id} value={holding.id}>
                    {holding.name} · {holding.commodityType}
                  </option>
                ))}
              </select>
            </Field>
            <InputField values={values} name="name" label="Item name" required />
            <InputField
              values={values}
              name="itemCount"
              label="Quantity"
              type="number"
              min="0"
              step="any"
              required
            />
            <InputField
              values={values}
              name="countUnit"
              label="Unit"
              required
              description="For example: piece, pair or set."
            />
            <InputField
              values={values}
              name="grossWeightGrams"
              label="Gross weight (g)"
              type="number"
              min="0"
              step="any"
            />
            <InputField
              values={values}
              name="purityPercent"
              label="Purity (%)"
              type="number"
              min="0"
              max="100"
              step="any"
              description="Leave blank unless verified."
            />
            <InputField
              values={values}
              name="ownershipPercent"
              label="Ownership share (%)"
              type="number"
              min="0"
              max="100"
              step="any"
            />
            <InputField
              values={values}
              name="ownerLabel"
              label="Owner label"
              description="Optional family member or ownership note."
            />
            <InputField values={values} name="location" label="Custody location" />
            <InputField
              values={values}
              name="provenance"
              label="Provenance"
              description="How or when the item was acquired."
            />
            <InputField
              values={values}
              name="appraisalValue"
              label="Appraisal value"
              type="number"
              min="0"
              step="any"
            />
            <InputField
              values={values}
              name="appraisalCurrency"
              label="Appraisal currency"
              description="Required only with an appraisal value."
            />
            <InputField
              values={values}
              name="liquidationPercent"
              label="Liquidation factor (%)"
              type="number"
              min="0"
              max="100"
              step="any"
              description="Conservative percentage expected after sale costs."
            />
            <InputField values={values} name="asOf" label="Measurement date" type="date" required />
          </div>
          <Field orientation="horizontal">
            <Checkbox
              id="inventory-fire"
              name="eligibleForFire"
              defaultChecked={Boolean(values.eligibleForFire)}
            />
            <div className="grid gap-1">
              <FieldLabel htmlFor="inventory-fire">Eligible for FIRE corpus</FieldLabel>
              <FieldDescription>
                Enable only when the family genuinely intends to liquidate this item. A liquidation
                factor and defensible valuation are required before it contributes.
              </FieldDescription>
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="inventory-notes">Notes</FieldLabel>
            <Textarea
              id="inventory-notes"
              name="notes"
              defaultValue={getValue(values, "notes")}
              maxLength={1000}
            />
          </Field>
          {error ? (
            <Field data-invalid>
              <FieldError>{error}</FieldError>
            </Field>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || holdings.length === 0}>
              {pending ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <SaveIcon data-icon="inline-start" />
              )}
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
