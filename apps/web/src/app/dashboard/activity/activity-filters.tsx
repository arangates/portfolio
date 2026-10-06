"use client";

import { usePathname, useRouter } from "next/navigation";
import type { Route } from "next";
import { useState, useTransition } from "react";
import { ListFilterIcon } from "@portfolio/ui/components/icons";

import { Button } from "@portfolio/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@portfolio/ui/components/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@portfolio/ui/components/select";

const moduleOptions = [
  "All modules",
  "Portfolio",
  "Cash accounts",
  "Investments",
  "Salary",
  "Household",
  "FIRE planning",
  "Imports",
  "Mortgage",
  "Tax",
  "Settings",
];

const rangeOptions = [
  { value: "all", label: "All time" },
  { value: "day", label: "Last day" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

export function ActivityFilters({
  initialModule,
  initialRange,
}: {
  initialModule: string;
  initialRange: string;
}) {
  const [module, setModule] = useState(initialModule);
  const [range, setRange] = useState(initialRange);
  const [pending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();

  function apply() {
    const params = new URLSearchParams();
    if (module !== "All modules") params.set("module", module);
    if (range !== "all") params.set("range", range);
    const query = params.toString();
    startTransition(() => router.push((query ? `${pathname}?${query}` : pathname) as Route));
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-end sm:justify-between">
      <FieldGroup className="grid gap-3 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="activity-module">Module</FieldLabel>
          <Select value={module} onValueChange={(value) => value && setModule(value)}>
            <SelectTrigger id="activity-module" className="w-full sm:min-w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {moduleOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="activity-range">Date range</FieldLabel>
          <Select value={range} onValueChange={(value) => value && setRange(value)}>
            <SelectTrigger id="activity-range" className="w-full sm:min-w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {rangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>
      <Button type="button" onClick={apply} disabled={pending}>
        <ListFilterIcon data-icon="inline-start" />
        {pending ? "Applying…" : "Apply filters"}
      </Button>
    </div>
  );
}
