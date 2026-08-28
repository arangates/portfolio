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

export type FireRecordKind =
  | "fire_profile"
  | "family_member"
  | "fire_expense"
  | "fire_one_time_cost"
  | "fire_income_stream"
  | "fire_scenario";

type Values = Record<string, string | number | boolean | null | undefined>;
type MemberOption = { id: string; name: string; relationship: string };

const titles: Record<FireRecordKind, string> = {
  fire_profile: "FIRE assumptions",
  family_member: "family member",
  fire_expense: "monthly expense",
  fire_one_time_cost: "one-time cost",
  fire_income_stream: "retirement income",
  fire_scenario: "scenario",
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
  placeholder,
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
  placeholder?: string;
  description?: string;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={`fire-${name}`}>{label}</FieldLabel>
      <Input
        id={`fire-${name}`}
        name={name}
        type={type}
        defaultValue={value(values, name)}
        required={required}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
      />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}

function SelectField({
  values,
  name,
  label,
  options,
  fallback,
}: {
  values: Values;
  name: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  fallback: string;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={`fire-${name}`}>{label}</FieldLabel>
      <select
        id={`fire-${name}`}
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
  fallback = true,
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
        id={`fire-${name}`}
        name={name}
        defaultChecked={typeof current === "boolean" ? current : fallback}
      />
      <div className="space-y-1">
        <FieldLabel htmlFor={`fire-${name}`}>{label}</FieldLabel>
        {description ? <FieldDescription>{description}</FieldDescription> : null}
      </div>
    </Field>
  );
}

function MemberField({ values, members }: { values: Values; members: MemberOption[] }) {
  return (
    <SelectField
      values={values}
      name="memberId"
      label="Family member"
      fallback=""
      options={[
        { value: "", label: "Whole family" },
        ...members.map((member) => ({
          value: member.id,
          label: `${member.name} · ${member.relationship}`,
        })),
      ]}
    />
  );
}

function RecordFields({
  kind,
  values,
  members,
  defaultCurrency,
}: {
  kind: FireRecordKind;
  values: Values;
  members: MemberOption[];
  defaultCurrency: string;
}) {
  if (kind === "fire_profile") {
    return (
      <>
        <TextField
          values={values}
          name="birthDate"
          label="Your date of birth"
          type="date"
          required={false}
        />
        <TextField
          values={values}
          name="plannedRetirementYear"
          label="Planned retirement year"
          type="number"
          min="2020"
          max="2200"
        />
        <TextField
          values={values}
          name="planEndAge"
          label="Plan through age"
          type="number"
          min="50"
          max="120"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            values={values}
            name="inflationRate"
            label="Expected inflation (%)"
            type="number"
            step="0.01"
            min="-2"
            max="30"
          />
          <TextField
            values={values}
            name="expectedReturnRate"
            label="Expected nominal return (%)"
            type="number"
            step="0.01"
            min="-20"
            max="100"
          />
          <TextField
            values={values}
            name="returnVolatility"
            label="Annual volatility (%)"
            type="number"
            step="0.01"
            min="0"
            max="100"
            description="Used by the probability simulation."
          />
          <TextField
            values={values}
            name="safeWithdrawalRate"
            label="Safe withdrawal rate (%)"
            type="number"
            step="0.01"
            min="0.1"
            max="20"
            description="Sets the minimum recurring reserve used by every scenario."
          />
          <TextField
            values={values}
            name="safetyBuffer"
            label="Safety Max buffer (%)"
            type="number"
            step="0.01"
            min="0"
            max="100"
          />
          <TextField
            values={values}
            name="targetLegacy"
            label="Desired ending legacy"
            type="number"
            min="0"
            step="any"
          />
        </div>
        <TextField
          values={values}
          name="annualSavings"
          label="Annual investable savings"
          type="number"
          min="0"
          step="any"
          description="Amount added to the investment portfolio each year before retirement."
        />
        <TextField
          values={values}
          name="savingsCurrency"
          label="Savings and legacy currency"
          placeholder={defaultCurrency}
        />
        <SelectField
          values={values}
          name="spendingPolicy"
          label="Retirement spending policy"
          fallback="essential_floor"
          options={[
            { value: "essential_floor", label: "Protect essentials, flex wants" },
            { value: "fixed_real", label: "Fixed inflation-adjusted spending" },
          ]}
        />
      </>
    );
  }

  if (kind === "family_member") {
    return (
      <>
        <TextField values={values} name="name" label="Name" />
        <SelectField
          values={values}
          name="relationship"
          label="Relationship"
          fallback="partner"
          options={[
            { value: "self", label: "Self" },
            { value: "partner", label: "Partner" },
            { value: "child", label: "Child" },
            { value: "dependent", label: "Dependent" },
            { value: "other", label: "Other" },
          ]}
        />
        <TextField
          values={values}
          name="birthDate"
          label="Date of birth"
          type="date"
          required={false}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            values={values}
            name="netWorth"
            label="Net worth"
            type="number"
            min="0"
            step="any"
          />
          <TextField
            values={values}
            name="investableAssets"
            label="Investable assets"
            type="number"
            min="0"
            step="any"
            description="Only this amount is added to the FIRE corpus."
          />
          <TextField
            values={values}
            name="annualNetIncome"
            label="Annual net income"
            type="number"
            min="0"
            step="any"
          />
          <TextField
            values={values}
            name="currency"
            label="Currency"
            placeholder={defaultCurrency}
          />
        </div>
        <BooleanField
          values={values}
          name="linkedToPortfolio"
          label="Use this Selvam portfolio"
          fallback={false}
          description="Prevents manually entered assets from being counted twice."
        />
        <BooleanField values={values} name="includedInPlan" label="Include in the family plan" />
      </>
    );
  }

  if (kind === "fire_expense") {
    return (
      <>
        <TextField values={values} name="name" label="Expense" />
        <TextField values={values} name="category" label="Category" />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            values={values}
            name="monthlyAmount"
            label="Monthly amount"
            type="number"
            min="0"
            step="any"
          />
          <TextField
            values={values}
            name="currency"
            label="Currency"
            placeholder={defaultCurrency}
          />
          <TextField
            values={values}
            name="startYear"
            label="Start year"
            type="number"
            required={false}
            min="1900"
            max="2300"
          />
          <TextField
            values={values}
            name="endYear"
            label="End year"
            type="number"
            required={false}
            min="1900"
            max="2300"
            description="Useful for education, childcare or a temporary mortgage."
          />
          <TextField
            values={values}
            name="inflationRateOverride"
            label="Custom inflation (%)"
            type="number"
            required={false}
            min="-20"
            max="150"
            step="0.01"
          />
        </div>
        <MemberField values={values} members={members} />
        <BooleanField
          values={values}
          name="essential"
          label="Essential expense"
          description="Essential spending is protected when flexible-spending guardrails activate."
        />
        <Field>
          <FieldLabel htmlFor="fire-expense-notes">Notes</FieldLabel>
          <Textarea id="fire-expense-notes" name="notes" defaultValue={value(values, "notes")} />
        </Field>
      </>
    );
  }

  if (kind === "fire_one_time_cost") {
    return (
      <>
        <TextField values={values} name="name" label="Planned purchase or event" />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            values={values}
            name="amount"
            label="Current cost"
            type="number"
            min="0"
            step="any"
          />
          <TextField
            values={values}
            name="currency"
            label="Currency"
            placeholder={defaultCurrency}
          />
          <TextField
            values={values}
            name="plannedYear"
            label="Planned year"
            type="number"
            min="2020"
            max="2300"
          />
          <SelectField
            values={values}
            name="priority"
            label="Priority"
            fallback="important"
            options={[
              { value: "essential", label: "Essential" },
              { value: "important", label: "Important" },
              { value: "optional", label: "Optional" },
            ]}
          />
        </div>
        <MemberField values={values} members={members} />
        <BooleanField values={values} name="inflationLinked" label="Increase cost with inflation" />
        <Field>
          <FieldLabel htmlFor="fire-cost-notes">Notes</FieldLabel>
          <Textarea id="fire-cost-notes" name="notes" defaultValue={value(values, "notes")} />
        </Field>
      </>
    );
  }

  if (kind === "fire_income_stream") {
    return (
      <>
        <TextField values={values} name="name" label="Income stream" />
        <SelectField
          values={values}
          name="incomeType"
          label="Type"
          fallback="pension"
          options={[
            { value: "pension", label: "Pension" },
            { value: "rental", label: "Rental income" },
            { value: "annuity", label: "Annuity" },
            { value: "part_time", label: "Part-time work" },
            { value: "other", label: "Other" },
          ]}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            values={values}
            name="annualAmount"
            label="Annual amount"
            type="number"
            min="0"
            step="any"
          />
          <TextField
            values={values}
            name="currency"
            label="Currency"
            placeholder={defaultCurrency}
          />
          <TextField
            values={values}
            name="startYear"
            label="Start year"
            type="number"
            min="2020"
            max="2300"
          />
          <TextField
            values={values}
            name="endYear"
            label="End year"
            type="number"
            required={false}
            min="2020"
            max="2300"
          />
        </div>
        <MemberField values={values} members={members} />
        <BooleanField values={values} name="inflationLinked" label="Income rises with inflation" />
      </>
    );
  }

  return (
    <>
      <TextField values={values} name="name" label="Scenario name" />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          values={values}
          name="spendingMultiplier"
          label="Spending level (%)"
          type="number"
          min="1"
          max="300"
          step="0.01"
        />
        <TextField
          values={values}
          name="bufferRate"
          label="Additional buffer (%)"
          type="number"
          min="0"
          max="100"
          step="0.01"
        />
        <TextField
          values={values}
          name="returnRateOverride"
          label="Return override (%)"
          type="number"
          required={false}
          min="-20"
          max="150"
          step="0.01"
        />
        <TextField
          values={values}
          name="inflationRateOverride"
          label="Inflation override (%)"
          type="number"
          required={false}
          min="-20"
          max="150"
          step="0.01"
        />
        <TextField
          values={values}
          name="retirementYearOverride"
          label="Retirement year override"
          type="number"
          required={false}
          min="2020"
          max="2300"
        />
      </div>
      <BooleanField values={values} name="enabled" label="Include this scenario" />
    </>
  );
}

const booleanFields: Record<FireRecordKind, string[]> = {
  fire_profile: [],
  family_member: ["linkedToPortfolio", "includedInPlan"],
  fire_expense: ["essential"],
  fire_one_time_cost: ["inflationLinked"],
  fire_income_stream: ["inflationLinked"],
  fire_scenario: ["enabled"],
};

export function FireRecordDialog({
  kind,
  values = {},
  members = [],
  defaultCurrency,
  label,
}: {
  kind: FireRecordKind;
  values?: Values;
  members?: MemberOption[];
  defaultCurrency: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const editing = Boolean(values.id) || kind === "fire_profile";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const formData = new FormData(event.currentTarget);
    const data: Record<string, unknown> = Object.fromEntries(formData);
    for (const field of booleanFields[kind]) data[field] = formData.has(field);
    if (values.id) data.id = String(values.id);
    try {
      const response = await fetch("/api/fire/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, data }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not save FIRE record");
      toast.success(`${titles[kind][0]?.toUpperCase()}${titles[kind].slice(1)} saved`);
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save FIRE record");
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
            Values are private to this account and feed the FIRE scenarios immediately.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <FieldGroup>
            <RecordFields
              kind={kind}
              values={values}
              members={members}
              defaultCurrency={defaultCurrency}
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
