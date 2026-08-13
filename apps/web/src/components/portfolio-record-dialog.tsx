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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@portfolio/ui/components/field";
import { Input } from "@portfolio/ui/components/input";
import { Spinner } from "@portfolio/ui/components/spinner";
import { Textarea } from "@portfolio/ui/components/textarea";
import { PencilIcon, PlusIcon, SaveIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export type PortfolioRecordKind = "bank_account" | "fixed_deposit" | "commodity" | "manual_asset";

type Values = Record<string, string | number | boolean | null | undefined>;

const today = new Date().toISOString().slice(0, 10);

function value(values: Values, key: string, fallback = "") {
  const current = values[key];
  return current === null || current === undefined ? fallback : String(current);
}

function TextField({
  values,
  name,
  label,
  type = "text",
  required = true,
  placeholder,
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
  placeholder?: string;
  description?: string;
  min?: string;
  max?: string;
  step?: string;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={value(values, name, type === "date" ? today : "")}
        required={required}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
      />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}

function CommonCurrencyFields({ values }: { values: Values }) {
  return (
    <>
      <TextField
        values={values}
        name="currency"
        label="Currency"
        placeholder="INR"
        description="Three-letter ISO currency code, such as INR or EUR."
      />
      <TextField values={values} name="asOf" label="Valuation date" type="date" />
    </>
  );
}

function RecordFields({ kind, values }: { kind: PortfolioRecordKind; values: Values }) {
  if (kind === "bank_account") {
    return (
      <>
        <TextField values={values} name="institution" label="Institution" />
        <TextField values={values} name="name" label="Account name" />
        <TextField values={values} name="accountType" label="Account type" />
        <TextField
          values={values}
          name="accountLast4"
          label="Last four digits"
          required={false}
          placeholder="1234"
          description="Never enter a full account number or login credential."
        />
        <TextField values={values} name="amount" label="Current balance" type="number" step="any" />
        <CommonCurrencyFields values={values} />
      </>
    );
  }

  if (kind === "fixed_deposit") {
    return (
      <>
        <TextField values={values} name="bank" label="Bank" />
        <TextField values={values} name="depositType" label="Deposit type" />
        <TextField values={values} name="accountLast4" label="Last four digits" required={false} />
        <TextField
          values={values}
          name="principal"
          label="Principal"
          type="number"
          min="0"
          step="any"
        />
        <TextField
          values={values}
          name="interestRate"
          label="Annual interest rate (%)"
          type="number"
          min="0"
          max="100"
          step="any"
        />
        <TextField values={values} name="startDate" label="Start date" type="date" />
        <TextField values={values} name="maturityDate" label="Maturity date" type="date" />
        <TextField
          values={values}
          name="compoundingPerYear"
          label="Compounding periods per year"
          type="number"
          min="1"
          max="365"
        />
        <TextField values={values} name="currency" label="Currency" placeholder="INR" />
      </>
    );
  }

  if (kind === "commodity") {
    return (
      <>
        <TextField values={values} name="name" label="Holding name" />
        <TextField values={values} name="commodityType" label="Commodity type" placeholder="Gold" />
        <TextField values={values} name="location" label="Custody location" required={false} />
        <TextField
          values={values}
          name="quantityGrams"
          label="Gross quantity (g)"
          type="number"
          min="0"
          step="any"
        />
        <TextField
          values={values}
          name="ownershipShare"
          label="Ownership share (%)"
          type="number"
          min="0.0001"
          max="100"
          step="any"
        />
        <TextField
          values={values}
          name="pricePerGram"
          label="Price per gram"
          type="number"
          min="0"
          step="any"
        />
        <CommonCurrencyFields values={values} />
      </>
    );
  }

  return (
    <>
      <TextField values={values} name="name" label="Asset name" />
      <TextField values={values} name="assetType" label="Asset type" placeholder="Real estate" />
      <TextField values={values} name="location" label="Location" required={false} />
      <TextField values={values} name="riskLevel" label="Risk level" placeholder="moderate" />
      <TextField
        values={values}
        name="value"
        label="Current value"
        type="number"
        min="0"
        step="any"
      />
      <TextField
        values={values}
        name="ownershipShare"
        label="Ownership share (%)"
        type="number"
        min="0.0001"
        max="100"
        step="any"
      />
      <CommonCurrencyFields values={values} />
      <Field orientation="horizontal">
        <Checkbox id="isLiquid" name="isLiquid" defaultChecked={Boolean(values.isLiquid)} />
        <div className="flex flex-col gap-1">
          <FieldLabel htmlFor="isLiquid">Liquid or readily sellable</FieldLabel>
          <FieldDescription>Include this asset in liquidity analytics.</FieldDescription>
        </div>
      </Field>
    </>
  );
}

const copy: Record<PortfolioRecordKind, { title: string; description: string }> = {
  bank_account: {
    title: "Bank account",
    description: "Store a safe account identifier and append a dated balance snapshot.",
  },
  fixed_deposit: {
    title: "Fixed deposit",
    description: "Create or update a deposit without overwriting its earlier snapshots.",
  },
  commodity: {
    title: "Commodity holding",
    description: "Track physical inventory, ownership share, custody and valuation history.",
  },
  manual_asset: {
    title: "Manual asset",
    description: "Track real estate, vehicles or any asset not covered by an import.",
  },
};

export function PortfolioRecordDialog({
  kind,
  values = {},
  compact = false,
}: {
  kind: PortfolioRecordKind;
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
    if (kind === "manual_asset") data.isLiquid = formData.has("isLiquid");
    if (kind === "fixed_deposit") data.status = values.status ?? "active";

    try {
      const response = await fetch("/api/portfolio/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, data }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not save record");
      toast.success(`${copy[kind].title} ${editing ? "updated" : "added"}`);
      setOpen(false);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save record");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant={editing ? "ghost" : "default"} size={compact ? "icon-sm" : "sm"} />
        }
      >
        {editing ? <PencilIcon /> : <PlusIcon data-icon="inline-start" />}
        {compact ? (
          <span className="sr-only">Edit {copy[kind].title}</span>
        ) : (
          `Add ${copy[kind].title.toLowerCase()}`
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Update" : "Add"} {copy[kind].title.toLowerCase()}
          </DialogTitle>
          <DialogDescription>{copy[kind].description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-5">
          <FieldGroup>
            <RecordFields kind={kind} values={values} />
            <Field>
              <FieldLabel htmlFor={`${kind}-notes`}>Notes</FieldLabel>
              <Textarea
                id={`${kind}-notes`}
                name="notes"
                defaultValue={value(values, "notes")}
                maxLength={500}
              />
            </Field>
            {error ? (
              <Field data-invalid>
                <FieldError>{error}</FieldError>
              </Field>
            ) : null}
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
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
