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
import { Textarea } from "@portfolio/ui/components/textarea";
import { PencilIcon, PlusIcon, SaveIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export type HouseholdRecordKind =
  | "household_profile"
  | "household_budget_item"
  | "household_scenario"
  | "household_scenario_line"
  | "household_service_contract"
  | "household_purchase";

type Values = Record<string, string | number | boolean | null | undefined>;
type Option = { id: string; name: string };

const titles: Record<HouseholdRecordKind, string> = {
  household_profile: "household settings",
  household_budget_item: "monthly budget item",
  household_scenario: "scenario",
  household_scenario_line: "scenario line",
  household_service_contract: "service contract",
  household_purchase: "one-time expense",
};

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
  min,
  max,
  step,
  description,
}: {
  values: Values;
  name: string;
  label: string;
  type?: React.HTMLInputTypeAttribute;
  required?: boolean;
  min?: string;
  max?: string;
  step?: string;
  description?: string;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={`household-${name}`}>{label}</FieldLabel>
      <Input
        id={`household-${name}`}
        name={name}
        type={type}
        defaultValue={value(values, name)}
        required={required}
        min={min}
        max={max}
        step={step}
      />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}

function SelectField({
  values,
  name,
  label,
  fallback,
  options,
}: {
  values: Values;
  name: string;
  label: string;
  fallback: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={`household-${name}`}>{label}</FieldLabel>
      <select
        id={`household-${name}`}
        name={name}
        defaultValue={value(values, name, fallback)}
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

function BooleanField({
  values,
  name,
  label,
  fallback = false,
  description,
}: {
  values: Values;
  name: string;
  label: string;
  fallback?: boolean;
  description?: string;
}) {
  const current = values[name];
  return (
    <Field orientation="horizontal">
      <Checkbox
        id={`household-${name}`}
        name={name}
        defaultChecked={typeof current === "boolean" ? current : fallback}
      />
      <div className="space-y-1">
        <FieldLabel htmlFor={`household-${name}`}>{label}</FieldLabel>
        {description ? <FieldDescription>{description}</FieldDescription> : null}
      </div>
    </Field>
  );
}

function Notes({ values }: { values: Values }) {
  return (
    <Field>
      <FieldLabel htmlFor="household-notes">Notes</FieldLabel>
      <Textarea id="household-notes" name="notes" defaultValue={value(values, "notes")} />
    </Field>
  );
}

function Fields({
  kind,
  values,
  budgetOptions,
  scenarioOptions,
  currency,
}: {
  kind: HouseholdRecordKind;
  values: Values;
  budgetOptions: Option[];
  scenarioOptions: Option[];
  currency: string;
}) {
  if (kind === "household_profile") {
    return (
      <>
        <TextField values={values} name="name" label="Household name" />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField values={values} name="currency" label="Currency" />
          <TextField
            values={values}
            name="adultsCount"
            label="Adults sharing costs"
            type="number"
            min="1"
            max="12"
          />
        </div>
      </>
    );
  }
  if (kind === "household_budget_item") {
    return (
      <>
        <TextField values={values} name="name" label="Item" />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField values={values} name="category" label="Category" />
          <SelectField
            values={values}
            name="flowType"
            label="Cash-flow type"
            fallback="expense"
            options={[
              { value: "expense", label: "Expense" },
              { value: "refund", label: "Refund / allowance" },
            ]}
          />
          <TextField
            values={values}
            name="monthlyAmount"
            label={`Monthly amount (${currency})`}
            type="number"
            min="0"
            step="0.01"
          />
          <TextField
            values={values}
            name="effectiveFrom"
            label="Effective from"
            type="date"
            required={false}
            description="A new effective date preserves the previous amount in history."
          />
        </div>
        <BooleanField values={values} name="essential" label="Essential expense" fallback />
        <Notes values={values} />
      </>
    );
  }
  if (kind === "household_scenario") {
    return (
      <>
        <TextField values={values} name="name" label="Scenario name" />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            values={values}
            name="scenarioType"
            label="Scenario type"
            fallback="custom"
            options={[
              { value: "baseline", label: "Current household" },
              { value: "minimum", label: "Minimum / away" },
              { value: "worst", label: "Stress case" },
              { value: "custom", label: "Custom" },
            ]}
          />
          <TextField
            values={values}
            name="adultsCount"
            label="Adults sharing costs"
            type="number"
            min="1"
            max="12"
          />
        </div>
        <BooleanField
          values={values}
          name="usesCurrentBudget"
          label="Use the live monthly budget"
          description="When enabled, this scenario automatically follows the latest budget snapshots."
        />
        <BooleanField values={values} name="isDefault" label="Primary scenario" />
        <Notes values={values} />
      </>
    );
  }
  if (kind === "household_scenario_line") {
    return (
      <>
        <SelectField
          values={values}
          name="scenarioId"
          label="Scenario"
          fallback={scenarioOptions[0]?.id ?? ""}
          options={scenarioOptions.map((option) => ({ value: option.id, label: option.name }))}
        />
        <TextField values={values} name="name" label="Line item" />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField values={values} name="category" label="Category" />
          <SelectField
            values={values}
            name="flowType"
            label="Cash-flow type"
            fallback="expense"
            options={[
              { value: "expense", label: "Expense" },
              { value: "refund", label: "Refund / allowance" },
            ]}
          />
          <TextField
            values={values}
            name="monthlyAmount"
            label={`Monthly amount (${currency})`}
            type="number"
            min="0"
            step="0.01"
          />
          <TextField values={values} name="sortOrder" label="Display order" type="number" min="0" />
        </div>
        <BooleanField values={values} name="essential" label="Essential expense" fallback />
        <Notes values={values} />
      </>
    );
  }
  if (kind === "household_service_contract") {
    return (
      <>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField values={values} name="service" label="Service" />
          <TextField values={values} name="provider" label="Provider" />
        </div>
        <SelectField
          values={values}
          name="budgetItemId"
          label="Matching monthly budget item"
          fallback=""
          options={[
            { value: "", label: "Not linked" },
            ...budgetOptions.map((option) => ({ value: option.id, label: option.name })),
          ]}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            values={values}
            name="monthlyCost"
            label={`Contract cost (${currency})`}
            type="number"
            min="0"
            step="0.01"
            required={false}
          />
          <TextField
            values={values}
            name="billingDay"
            label="Billing day"
            type="number"
            min="1"
            max="31"
            required={false}
          />
          <TextField
            values={values}
            name="effectiveFrom"
            label="Terms effective from"
            type="date"
            required={false}
          />
          <TextField
            values={values}
            name="contractEndDate"
            label="Contract end date"
            type="date"
            required={false}
          />
          <TextField
            values={values}
            name="durationMonths"
            label="Duration (months)"
            type="number"
            min="1"
            required={false}
          />
          <SelectField
            values={values}
            name="renewalType"
            label="Renewal"
            fallback="unknown"
            options={[
              { value: "fixed", label: "Fixed end" },
              { value: "automatic", label: "Automatic renewal" },
              { value: "indefinite", label: "Indefinite" },
              { value: "unknown", label: "Unknown" },
            ]}
          />
          <SelectField
            values={values}
            name="status"
            label="Status"
            fallback="active"
            options={[
              { value: "active", label: "Active" },
              { value: "ended", label: "Ended" },
              { value: "cancelled", label: "Cancelled" },
              { value: "unknown", label: "Unknown" },
            ]}
          />
        </div>
        <Notes values={values} />
      </>
    );
  }
  return (
    <>
      <TextField values={values} name="name" label="Expense" />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          values={values}
          name="scope"
          label="Area"
          fallback="house_setup"
          options={[
            { value: "house_setup", label: "House setup" },
            { value: "car", label: "Car" },
            { value: "home_improvement", label: "Home improvement" },
            { value: "other", label: "Other" },
          ]}
        />
        <TextField values={values} name="category" label="Category" />
        <TextField values={values} name="vendor" label="Vendor" required={false} />
        <TextField values={values} name="amount" label="Amount" type="number" min="0" step="0.01" />
        <TextField values={values} name="currency" label="Currency" />
        <TextField
          values={values}
          name="purchasedOn"
          label="Purchase date"
          type="date"
          required={false}
        />
        <TextField values={values} name="paymentSource" label="Payment source" required={false} />
      </div>
      <Notes values={values} />
    </>
  );
}

const booleanFields: Record<HouseholdRecordKind, string[]> = {
  household_profile: [],
  household_budget_item: ["essential"],
  household_scenario: ["usesCurrentBudget", "isDefault"],
  household_scenario_line: ["essential"],
  household_service_contract: [],
  household_purchase: [],
};

export function HouseholdRecordDialog({
  kind,
  values = {},
  budgetOptions = [],
  scenarioOptions = [],
  currency = "EUR",
  label,
}: {
  kind: HouseholdRecordKind;
  values?: Values;
  budgetOptions?: Option[];
  scenarioOptions?: Option[];
  currency?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const editing = Boolean(values.id) || kind === "household_profile";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const formData = new FormData(event.currentTarget);
    const data: Record<string, unknown> = Object.fromEntries(formData);
    for (const field of booleanFields[kind]) data[field] = formData.has(field);
    if (values.id) data.id = String(values.id);
    try {
      const response = await fetch("/api/household/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, data }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not save household record");
      toast.success("Household record saved");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save household record");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={editing ? "outline" : "default"} size="sm" />}>
        {editing ? <PencilIcon data-icon="inline-start" /> : <PlusIcon data-icon="inline-start" />}
        {label ?? `${editing ? "Edit" : "Add"} ${titles[kind]}`}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit" : "Add"} {titles[kind]}
          </DialogTitle>
          <DialogDescription>
            Amounts and household details remain private to the signed-in account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <FieldGroup>
            <Fields
              kind={kind}
              values={values}
              budgetOptions={budgetOptions}
              scenarioOptions={scenarioOptions}
              currency={currency}
            />
          </FieldGroup>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <SaveIcon data-icon="inline-start" />
              )}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
