"use client";

import { useAmountFormat } from "@/components/amount-preferences";
import { HouseholdRecordDialog } from "@/components/household-record-dialog";
import { formatPercent } from "@/lib/format";
import type {
  HouseAcquisitionCosts,
  HouseSetupCategory,
  HouseSetupGroup,
} from "@portfolio/api/household-queries";
import { Badge } from "@portfolio/ui/components/badge";
import { Button } from "@portfolio/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@portfolio/ui/components/card";
import { ChevronDownIcon, ChevronUpIcon } from "@portfolio/ui/components/icons";
import { cn } from "@portfolio/ui/lib/utils";
import { useId, useMemo, useState } from "react";

const CATEGORY_CONFIG: Record<
  HouseSetupCategory,
  {
    label: string;
    color: string;
    pillClass: string;
    bgClass: string;
  }
> = {
  Taxes: {
    label: "Property transfer tax",
    color: "#f97316",
    pillClass: "bg-[#f97316]",
    bgClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  "Broker commission": {
    label: "Broker commission",
    color: "#3b82f6",
    pillClass: "bg-[#3b82f6]",
    bgClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  Notary: {
    label: "Notary fees",
    color: "#eab308",
    pillClass: "bg-[#eab308]",
    bgClass: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  },
  "Mortgage advisor": {
    label: "Mortgage advisor",
    color: "#8b5cf6",
    pillClass: "bg-[#8b5cf6]",
    bgClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  "Other expenses": {
    label: "Other expenses",
    color: "#ef4444",
    pillClass: "bg-[#ef4444]",
    bgClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
};

const PRIMARY_COLOR = "#00bba6";
const PRIMARY_PILL = "bg-[#00bba6]";

const SIZE = 260;
const CENTER = SIZE / 2;
const RADIUS = 85;
const STROKE_WIDTH = 24;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const BRACKET_RADIUS = 104;
const BRACKET_STROKE = 2.5;
const BRACKET_CIRCUMFERENCE = 2 * Math.PI * BRACKET_RADIUS;

export function HouseCostBreakdownChart({
  costs,
  className,
}: {
  costs?: HouseAcquisitionCosts | null;
  className?: string;
}) {
  const { formatCurrency } = useAmountFormat();
  const filterId = useId();

  // View mode: "mortgage_paid" (total mortgage amount paid every month so far) or "purchase_price" (total purchase price)
  const hasPurchasePrice = Boolean(costs?.purchasePrice && costs.purchasePrice > 0);
  const [viewMode, setViewMode] = useState<"mortgage_paid" | "purchase_price">(
    hasPurchasePrice ? "mortgage_paid" : "mortgage_paid",
  );
  const [isExpanded, setIsExpanded] = useState(true);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const currency = costs?.currency ?? "EUR";
  const primaryAmount =
    viewMode === "purchase_price" && costs?.purchasePrice
      ? costs.purchasePrice
      : (costs?.mortgagePaidSoFar ?? 0);

  const primaryLabel =
    viewMode === "purchase_price" ? "Purchase price" : "Total mortgage paid so far";

  const primaryDetail =
    viewMode === "purchase_price"
      ? costs?.propertyValue
        ? `Valuation: ${formatCurrency(costs.propertyValue, currency)}`
        : "Initial deed loan amount"
      : costs?.mortgagePaymentsCount
        ? `${costs.mortgagePaymentsCount} monthly payments`
        : "Instalments paid to date";

  const setupTotal = costs?.oneTimeSetupTotal ?? 0;
  const grandTotal = primaryAmount + setupTotal;

  // Slices data for chart
  const slicesData = useMemo(() => {
    if (!costs) return [];

    const items: Array<{
      key: string;
      label: string;
      value: number;
      color: string;
      pillClass: string;
      percentage: number;
      isPrimary?: boolean;
      group?: HouseSetupGroup;
    }> = [
      {
        key: "primary",
        label: primaryLabel,
        value: primaryAmount,
        color: PRIMARY_COLOR,
        pillClass: PRIMARY_PILL,
        percentage: grandTotal > 0 ? (primaryAmount / grandTotal) * 100 : 0,
        isPrimary: true,
      },
    ];

    for (const group of costs.groups) {
      if (group.amount > 0) {
        const config = CATEGORY_CONFIG[group.category];
        items.push({
          key: group.category,
          label: config.label,
          value: group.amount,
          color: config.color,
          pillClass: config.pillClass,
          percentage: grandTotal > 0 ? (group.amount / grandTotal) * 100 : 0,
          group,
        });
      }
    }

    return items;
  }, [costs, primaryAmount, primaryLabel, grandTotal]);

  // SVG calculations for donut arcs and outer bracket
  const { arcs, bracketDash, bracketOffset } = useMemo(() => {
    if (grandTotal <= 0 || slicesData.length === 0) {
      return { arcs: [], bracketDash: "0 1000", bracketOffset: 0 };
    }

    let accumulated = 0;
    const computedArcs = slicesData.map((slice) => {
      const fraction = slice.value / grandTotal;
      const arcLength = fraction * CIRCUMFERENCE;
      const gap = slicesData.length > 1 && arcLength > 5 ? 2.5 : 0;
      const dash = Math.max(0, arcLength - gap);
      const offset = -accumulated;
      accumulated += arcLength;
      return {
        ...slice,
        fraction,
        dash: `${dash} ${CIRCUMFERENCE - dash}`,
        offset,
      };
    });

    // Outer bracket arc curving around the additional cost slices
    const setupFraction = setupTotal / grandTotal;
    const primaryFraction = primaryAmount / grandTotal;
    const bracketTotalLength = setupFraction * BRACKET_CIRCUMFERENCE;
    const bracketStartOffset = primaryFraction * BRACKET_CIRCUMFERENCE;

    const pad = 6;
    const bracketVisible = Math.max(0, bracketTotalLength - pad * 2);
    const bDash = `${bracketVisible} ${BRACKET_CIRCUMFERENCE - bracketVisible}`;
    const bOffset = -(bracketStartOffset + pad);

    return {
      arcs: computedArcs,
      bracketDash: bDash,
      bracketOffset: bOffset,
    };
  }, [grandTotal, slicesData, setupTotal, primaryAmount]);

  const activeSlice = slicesData.find((s) => s.key === hoveredKey);

  return (
    <Card className={cn("overflow-hidden border border-border shadow-sm", className)}>
      <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg font-semibold tracking-tight">
            House purchase & setup costs
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Complete cost breakdown: mortgage paid every month and itemized one-time setup expenses.
          </CardDescription>
        </div>
        <CardAction className="flex flex-wrap items-center gap-2">
          {hasPurchasePrice ? (
            <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("mortgage_paid")}
                className={cn(
                  "cursor-pointer rounded-md px-2.5 py-1 font-medium transition-colors",
                  viewMode === "mortgage_paid"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Mortgage paid so far
              </button>
              <button
                type="button"
                onClick={() => setViewMode("purchase_price")}
                className={cn(
                  "cursor-pointer rounded-md px-2.5 py-1 font-medium transition-colors",
                  viewMode === "purchase_price"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Purchase price
              </button>
            </div>
          ) : null}

          <HouseholdRecordDialog
            kind="household_purchase"
            values={{ scope: "house_setup", currency }}
            currency={currency}
            label="Add house expense"
          />
        </CardAction>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="grid min-w-0 items-center gap-8 md:grid-cols-[280px_minmax(0,1fr)] lg:gap-12">
          {/* Left Column: Donut Chart with Center Text and Outer Accent Bracket */}
          <div className="relative mx-auto flex size-[260px] shrink-0 items-center justify-center">
            {grandTotal > 0 ? (
              <svg
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                className="size-[260px] drop-shadow-xs"
                aria-label="House cost breakdown donut chart"
              >
                <defs>
                  <filter id={`glow-${filterId}`} x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Background Ring */}
                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={RADIUS}
                  fill="none"
                  stroke="currentColor"
                  className="text-muted/30"
                  strokeWidth={STROKE_WIDTH}
                />

                {/* Slices Ring */}
                <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
                  {arcs.map((slice) => {
                    const isHovered = hoveredKey === slice.key;
                    return (
                      <circle
                        key={slice.key}
                        cx={CENTER}
                        cy={CENTER}
                        r={RADIUS}
                        fill="none"
                        stroke={slice.color}
                        strokeWidth={isHovered ? STROKE_WIDTH + 3 : STROKE_WIDTH}
                        strokeDasharray={slice.dash}
                        strokeDashoffset={slice.offset}
                        className="cursor-pointer transition-[stroke-width,opacity] duration-200"
                        style={{
                          opacity: hoveredKey && !isHovered ? 0.35 : 1,
                        }}
                        onMouseEnter={() => setHoveredKey(slice.key)}
                        onMouseLeave={() => setHoveredKey(null)}
                      />
                    );
                  })}

                  {/* Outer Accent Bracket (curves around additional cost slices) */}
                  {setupTotal > 0 && primaryAmount > 0 ? (
                    <circle
                      cx={CENTER}
                      cy={CENTER}
                      r={BRACKET_RADIUS}
                      fill="none"
                      stroke={PRIMARY_COLOR}
                      strokeWidth={BRACKET_STROKE}
                      strokeDasharray={bracketDash}
                      strokeDashoffset={bracketOffset}
                      strokeLinecap="round"
                      className="transition-opacity duration-300"
                      style={{ opacity: 0.9 }}
                    />
                  ) : null}
                </g>
              </svg>
            ) : (
              <div className="flex size-full items-center justify-center rounded-full border-4 border-dashed border-muted text-center text-xs text-muted-foreground p-4">
                No house costs recorded
              </div>
            )}

            {/* Center Text (Total Costs / Hover State) */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-bold tracking-tight text-foreground sm:text-2xl tabular-nums">
                {activeSlice
                  ? formatCurrency(activeSlice.value, currency)
                  : formatCurrency(grandTotal, currency)}
              </span>
              <span className="mt-0.5 max-w-[130px] truncate text-xs font-medium text-muted-foreground">
                {activeSlice ? activeSlice.label : "Total costs"}
              </span>
            </div>
          </div>

          {/* Right Column: Breakdown Cards and Breakdown Table */}
          <div className="flex flex-col gap-4">
            {/* Primary Cost (Purchase Price / Mortgage Paid So Far) */}
            <div
              className={cn(
                "group relative rounded-xl border border-border/80 bg-card/60 p-4 transition-[border-color,background-color]",
                hoveredKey === "primary" && "border-teal-500/60 bg-teal-500/5",
              )}
              onMouseEnter={() => setHoveredKey("primary")}
              onMouseLeave={() => setHoveredKey(null)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                    {formatCurrency(primaryAmount, currency)}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">{primaryLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs font-normal">
                    {primaryDetail}
                  </Badge>
                  {grandTotal > 0 ? (
                    <span className="text-xs font-semibold tabular-nums text-foreground">
                      {formatPercent(primaryAmount / grandTotal, 1)}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Additional Setup Costs Header with Chevron Toggle */}
            <div className="flex flex-col rounded-xl border border-border/80 bg-card/60 p-4">
              <div
                className="flex cursor-pointer items-start justify-between gap-3"
                onClick={() => setIsExpanded((prev) => !prev)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setIsExpanded((prev) => !prev);
                  }
                }}
                aria-expanded={isExpanded}
              >
                <div className="flex flex-col">
                  <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                    {formatCurrency(setupTotal, currency)}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    Additional house setup costs
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {costs?.groups.reduce((sum, g) => sum + g.itemCount, 0) ?? 0} expenses
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="size-7 text-muted-foreground"
                    aria-label={isExpanded ? "Collapse breakdown" : "Expand breakdown"}
                  >
                    {isExpanded ? (
                      <ChevronUpIcon className="size-4" />
                    ) : (
                      <ChevronDownIcon className="size-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Slices Breakdown List */}
              {isExpanded && costs?.groups ? (
                <div className="mt-4 flex flex-col divide-y divide-border/60 border-t border-border/60 pt-2">
                  {costs.groups.map((group) => {
                    const config = CATEGORY_CONFIG[group.category];
                    const isHovered = hoveredKey === group.category;
                    const isRowExpanded = expandedCategory === group.category;
                    const pctOfBase = primaryAmount > 0 ? (group.amount / primaryAmount) * 100 : 0;

                    return (
                      <div key={group.category} className="flex flex-col">
                        <div
                          className={cn(
                            "flex cursor-pointer items-center justify-between gap-3 py-2.5 px-2 rounded-lg transition-colors",
                            isHovered && "bg-muted/60",
                            group.amount === 0 && "opacity-40",
                          )}
                          onMouseEnter={() => setHoveredKey(group.category)}
                          onMouseLeave={() => setHoveredKey(null)}
                          onClick={() => {
                            if (group.itemCount > 0) {
                              setExpandedCategory((prev) =>
                                prev === group.category ? null : group.category,
                              );
                            }
                          }}
                          role="button"
                          tabIndex={group.itemCount > 0 ? 0 : -1}
                        >
                          {/* Left: Pill and Label */}
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={cn("h-4 w-1.5 shrink-0 rounded-full", config.pillClass)}
                              aria-hidden="true"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-medium text-foreground truncate">
                                {config.label}
                              </span>
                              {group.itemCount > 0 ? (
                                <span className="text-[11px] text-muted-foreground">
                                  {group.itemCount} {group.itemCount === 1 ? "record" : "records"}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {/* Right: Amount and Percentage */}
                          <div className="flex items-center gap-4 text-right tabular-nums">
                            <span className="text-sm font-semibold text-foreground">
                              {formatCurrency(group.amount, currency)}
                            </span>
                            <span className="w-16 text-right text-xs font-semibold text-muted-foreground">
                              {pctOfBase.toFixed(2)} %
                            </span>
                          </div>
                        </div>

                        {/* Itemized List when clicked */}
                        {isRowExpanded && group.items.length > 0 ? (
                          <div className="mb-2 ml-5 flex flex-col gap-1.5 rounded-lg border border-border/70 bg-muted/30 p-2.5 text-xs">
                            {group.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between gap-2 py-0.5 text-muted-foreground hover:text-foreground"
                              >
                                <div className="flex items-center gap-2 min-w-0 truncate">
                                  <span className="font-medium text-foreground truncate">
                                    {item.name}
                                  </span>
                                  {item.purchasedOn ? (
                                    <span className="text-[10px] text-muted-foreground">
                                      · {item.purchasedOn}
                                    </span>
                                  ) : null}
                                </div>
                                <span className="font-medium tabular-nums text-foreground shrink-0">
                                  {formatCurrency(item.amount, currency)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
