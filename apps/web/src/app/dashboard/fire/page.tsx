import { EmptyDataState } from "@/components/empty-data-state";
import { FireArchiveButton } from "@/components/fire-archive-button";
import { FireCharts } from "@/components/fire-charts";
import { FireRecordDialog } from "@/components/fire-record-dialog";
import { PageHeader } from "@/components/page-header";
import { SectionCards } from "@/components/section-cards";
import { TableCard } from "@/components/table-card";
import { formatCurrency, formatPercent } from "@/lib/format";
import { getFirePlan } from "@portfolio/api/fire-queries";
import { auth } from "@portfolio/auth";
import { Badge } from "@portfolio/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@portfolio/ui/components/card";
import { Progress } from "@portfolio/ui/components/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@portfolio/ui/components/table";
import {
  CalendarRangeIcon,
  CircleGaugeIcon,
  LandmarkIcon,
  PiggyBankIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

function ageOn(birthDate: string | null, year: number) {
  if (!birthDate) return null;
  return year - Number(birthDate.slice(0, 4));
}

function profileValues(
  plan: Extract<Awaited<ReturnType<typeof getFirePlan>>, { configured: true }>,
) {
  return {
    birthDate: plan.profile.birthDate,
    plannedRetirementYear: plan.profile.plannedRetirementYear,
    planEndAge: plan.profile.planEndAge,
    inflationRate: plan.profile.inflationRate * 100,
    expectedReturnRate: plan.profile.expectedReturnRate * 100,
    returnVolatility: plan.profile.returnVolatility * 100,
    safeWithdrawalRate: plan.profile.safeWithdrawalRate * 100,
    safetyBuffer: plan.profile.safetyBuffer * 100,
    annualSavings: plan.profile.annualSavingsInput,
    savingsCurrency: plan.profile.savingsCurrency,
    targetLegacy: plan.profile.targetLegacyInput,
    spendingPolicy: plan.profile.spendingPolicy,
  };
}

export default async function FirePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const plan = await getFirePlan(session.user.id);
  const currentYear = new Date().getUTCFullYear();
  const memberOptions = plan.family.map((member) => ({
    id: member.id,
    name: member.name,
    relationship: member.relationship,
  }));

  if (!plan.configured) {
    return (
      <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 sm:py-5 md:gap-5 md:py-6">
          <PageHeader
            title="FIRE planner"
            description="Turn your family expenses, investable assets and future life events into a transparent retirement plan."
          />
          <div className="px-4 lg:px-6">
            <EmptyDataState
              icon={PiggyBankIcon}
              title="Set up your FIRE assumptions"
              description="Choose a retirement year, longevity horizon, inflation, returns and annual savings. Your plan starts empty and remains private to this account."
              action={
                <FireRecordDialog
                  kind="fire_profile"
                  defaultCurrency={plan.baseCurrency}
                  label="Create FIRE plan"
                  values={{
                    plannedRetirementYear: currentYear + 10,
                    planEndAge: 95,
                    inflationRate: 3,
                    expectedReturnRate: 6,
                    returnVolatility: 12,
                    safeWithdrawalRate: 3.5,
                    safetyBuffer: 15,
                    annualSavings: 0,
                    savingsCurrency: plan.baseCurrency,
                    targetLegacy: 0,
                    spendingPolicy: "essential_floor",
                  }}
                />
              }
            />
          </div>
        </div>
      </div>
    );
  }

  const primary = plan.results[0];
  const progress = Math.min(100, Math.max(0, (primary?.progress ?? 0) * 100));

  return (
    <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col">
      <div className="flex flex-col gap-4 py-4 sm:py-5 md:gap-5 md:py-6">
        <PageHeader
          title="FIRE planner"
          description="A family-wide plan combining current investable assets, phase-aware expenses, one-time goals, retirement income and probability-based risk ranges."
          action={
            <FireRecordDialog
              kind="fire_profile"
              values={profileValues(plan)}
              defaultCurrency={plan.baseCurrency}
              members={memberOptions}
            />
          }
        />

        {plan.unconvertedCurrencies.length > 0 ? (
          <div className="px-4 lg:px-6">
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="text-base">Currency conversion needed</CardTitle>
                <CardDescription>
                  Add stored {plan.baseCurrency} rates for {plan.unconvertedCurrencies.join(", ")}.
                  Those records are visible below but excluded from calculated totals.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        ) : null}

        <SectionCards
          items={[
            {
              label: "Family investable assets",
              value: formatCurrency(plan.currentInvestableAssets, plan.baseCurrency),
              badge: `${plan.family.filter((member) => member.includedInPlan).length} people`,
              note: `Family net worth ${formatCurrency(plan.familyNetWorth, plan.baseCurrency)}`,
              detail:
                "Only liquid portfolio value and explicitly investable family assets fund FIRE",
              icon: LandmarkIcon,
            },
            {
              label: `${primary?.name ?? "Primary"} corpus`,
              value: formatCurrency(primary?.requiredCorpus ?? 0, plan.baseCurrency),
              badge: formatPercent(primary?.withdrawalRate ?? 0, 1),
              note: `Gap ${formatCurrency(primary?.gap ?? 0, plan.baseCurrency)}`,
              detail: `Retirement year ${primary?.retirementYear ?? plan.profile.plannedRetirementYear}`,
              icon: PiggyBankIcon,
            },
            {
              label: "Readiness",
              value: formatPercent(primary?.progress ?? 0, 0),
              badge:
                primary?.yearsToTarget === null
                  ? "Savings needed"
                  : primary.yearsToTarget === 0
                    ? "Funded"
                    : `${primary.yearsToTarget} years`,
              note: `Coast number today ${formatCurrency(primary?.coastNumberToday ?? 0, plan.baseCurrency)}`,
              detail: "Based on the selected return and annual savings assumptions",
              icon: CircleGaugeIcon,
            },
            {
              label: "Probability range",
              value: formatPercent(primary?.successProbability ?? 0, 0),
              badge: "1,000 paths",
              note: `${formatCurrency(plan.monthlyExpenses, plan.baseCurrency)} current monthly spending`,
              detail: "Tests return order, volatility and inflation uncertainty",
              icon: ShieldCheckIcon,
            },
          ]}
        />

        <div className="px-4 lg:px-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-4 text-base">
                <span>Progress toward {primary?.name ?? "the primary plan"}</span>
                <span className="tabular-nums">{progress.toFixed(0)}%</span>
              </CardTitle>
              <CardDescription>
                Current investable assets divided by the modeled corpus—not total household net
                worth.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={progress} />
            </CardContent>
          </Card>
        </div>

        <div className="px-4 lg:px-6">
          <TableCard
            title="Scenario comparison"
            description="Doable, Safety Max and any custom scenarios all use the same underlying family records."
            action={
              <FireRecordDialog
                kind="fire_scenario"
                defaultCurrency={plan.baseCurrency}
                members={memberOptions}
                values={{ spendingMultiplier: 100, bufferRate: 0, enabled: true }}
              />
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scenario</TableHead>
                  <TableHead className="text-right">Retire</TableHead>
                  <TableHead className="text-right">Annual spending</TableHead>
                  <TableHead className="text-right">Corpus</TableHead>
                  <TableHead className="text-right">Funded</TableHead>
                  <TableHead className="text-right">Success range</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {plan.results.map((result) => {
                  const scenario = plan.scenarios.find((item) => item.id === result.id);
                  return (
                    <TableRow key={result.id}>
                      <TableCell className="font-medium">{result.name}</TableCell>
                      <TableCell className="text-right">{result.retirementYear}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(result.annualExpensesAtRetirement, plan.baseCurrency)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(result.requiredCorpus, plan.baseCurrency)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatPercent(result.progress, 0)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatPercent(result.successProbability, 0)}
                      </TableCell>
                      <TableCell>
                        {scenario ? (
                          <div className="flex justify-end">
                            <FireRecordDialog
                              kind="fire_scenario"
                              defaultCurrency={plan.baseCurrency}
                              members={memberOptions}
                              values={{
                                id: scenario.id,
                                name: scenario.name,
                                spendingMultiplier: scenario.spendingMultiplier * 100,
                                bufferRate: scenario.bufferRate * 100,
                                returnRateOverride:
                                  scenario.returnRateOverride === null
                                    ? null
                                    : scenario.returnRateOverride * 100,
                                inflationRateOverride:
                                  scenario.inflationRateOverride === null
                                    ? null
                                    : scenario.inflationRateOverride * 100,
                                retirementYearOverride: scenario.retirementYearOverride,
                                enabled: scenario.enabled,
                              }}
                              label="Edit"
                            />
                            <FireArchiveButton
                              kind="fire_scenario"
                              id={scenario.id}
                              label={scenario.name}
                            />
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableCard>
        </div>

        <FireCharts results={plan.results} currency={plan.baseCurrency} />

        <div className="grid gap-4 px-4 xl:grid-cols-2 lg:px-6">
          <TableCard
            title="Family plan"
            description="Portfolio-linked members use Selvam assets; manually entered assets are never double counted."
            action={
              <FireRecordDialog
                kind="family_member"
                defaultCurrency={plan.baseCurrency}
                members={memberOptions}
                values={{
                  currency: plan.baseCurrency,
                  netWorth: 0,
                  investableAssets: 0,
                  annualNetIncome: 0,
                  includedInPlan: true,
                }}
              />
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead className="text-right">Age now</TableHead>
                  <TableHead className="text-right">Age at FIRE</TableHead>
                  <TableHead className="text-right">Investable</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {plan.family.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{member.relationship}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {ageOn(member.birthDate, currentYear) ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {ageOn(
                        member.birthDate,
                        primary?.retirementYear ?? plan.profile.plannedRetirementYear,
                      ) ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {member.linkedToPortfolio
                        ? "Linked portfolio"
                        : formatCurrency(member.investableAssets, member.currency)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <FireRecordDialog
                          kind="family_member"
                          defaultCurrency={plan.baseCurrency}
                          members={memberOptions}
                          values={member}
                          label="Edit"
                        />
                        <FireArchiveButton
                          kind="family_member"
                          id={member.id}
                          label={member.name}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>

          <TableCard
            title="Monthly family expenses"
            description={`${formatCurrency(plan.monthlyEssentialExpenses, plan.baseCurrency)} essential of ${formatCurrency(plan.monthlyExpenses, plan.baseCurrency)} total.`}
            action={
              <FireRecordDialog
                kind="fire_expense"
                defaultCurrency={plan.baseCurrency}
                members={memberOptions}
                values={{ currency: plan.baseCurrency, essential: true }}
              />
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Expense</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Monthly</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {plan.expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">
                      {expense.name}
                      <div className="text-xs text-muted-foreground">
                        {expense.memberName ?? "Family"} ·{" "}
                        {expense.essential ? "Essential" : "Flexible"}
                      </div>
                    </TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell>
                      {expense.startYear ?? "Now"}–{expense.endYear ?? "Ongoing"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(expense.monthlyAmount, expense.currency)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <FireRecordDialog
                          kind="fire_expense"
                          defaultCurrency={plan.baseCurrency}
                          members={memberOptions}
                          values={{
                            ...expense,
                            inflationRateOverride:
                              expense.inflationRateOverride === null
                                ? null
                                : expense.inflationRateOverride * 100,
                          }}
                          label="Edit"
                        />
                        <FireArchiveButton
                          kind="fire_expense"
                          id={expense.id}
                          label={expense.name}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </div>

        <div className="grid gap-4 px-4 xl:grid-cols-2 lg:px-6">
          <TableCard
            title="One-time life events"
            description={`${formatCurrency(plan.oneTimeCostTotal, plan.baseCurrency)} in current-value planned costs.`}
            action={
              <FireRecordDialog
                kind="fire_one_time_cost"
                defaultCurrency={plan.baseCurrency}
                members={memberOptions}
                values={{
                  currency: plan.baseCurrency,
                  plannedYear: plan.profile.plannedRetirementYear,
                  priority: "important",
                  inflationLinked: true,
                }}
              />
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {plan.oneTimeCosts.map((cost) => (
                  <TableRow key={cost.id}>
                    <TableCell className="font-medium">
                      {cost.name}
                      <div className="text-xs text-muted-foreground">
                        {cost.memberName ?? "Family"}
                      </div>
                    </TableCell>
                    <TableCell>{cost.plannedYear}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{cost.priority}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(cost.amount, cost.currency)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <FireRecordDialog
                          kind="fire_one_time_cost"
                          defaultCurrency={plan.baseCurrency}
                          members={memberOptions}
                          values={cost}
                          label="Edit"
                        />
                        <FireArchiveButton
                          kind="fire_one_time_cost"
                          id={cost.id}
                          label={cost.name}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>

          <TableCard
            title="Retirement income streams"
            description="Pensions, rent, annuities and part-time income reduce portfolio withdrawals only while active."
            action={
              <FireRecordDialog
                kind="fire_income_stream"
                defaultCurrency={plan.baseCurrency}
                members={memberOptions}
                values={{
                  currency: plan.baseCurrency,
                  startYear: plan.profile.plannedRetirementYear,
                  incomeType: "pension",
                  inflationLinked: true,
                }}
              />
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Income</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Annual</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {plan.incomeStreams.map((income) => (
                  <TableRow key={income.id}>
                    <TableCell className="font-medium">
                      {income.name}
                      <div className="text-xs text-muted-foreground">
                        {income.memberName ?? "Family"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {income.startYear}–{income.endYear ?? "Lifetime"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{income.incomeType.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(income.annualAmount, income.currency)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <FireRecordDialog
                          kind="fire_income_stream"
                          defaultCurrency={plan.baseCurrency}
                          members={memberOptions}
                          values={income}
                          label="Edit"
                        />
                        <FireArchiveButton
                          kind="fire_income_stream"
                          id={income.id}
                          label={income.name}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </div>

        {primary ? (
          <div className="px-4 lg:px-6">
            <TableCard
              title={`${primary.name} annual simulation`}
              description="Every year is auditable: opening assets, return, savings or withdrawals, life-event costs and closing balance."
            >
              <div className="max-h-[520px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow>
                      <TableHead>Year</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Phase</TableHead>
                      <TableHead className="text-right">Opening</TableHead>
                      <TableHead className="text-right">Return</TableHead>
                      <TableHead className="text-right">Savings</TableHead>
                      <TableHead className="text-right">Expenses</TableHead>
                      <TableHead className="text-right">Income</TableHead>
                      <TableHead className="text-right">Events</TableHead>
                      <TableHead className="text-right">Closing</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {primary.deterministic.map((row) => (
                      <TableRow key={row.year}>
                        <TableCell className="font-medium">{row.year}</TableCell>
                        <TableCell>{row.age ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={row.phase === "retirement" ? "secondary" : "outline"}>
                            {row.phase}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(row.openingBalance, plan.baseCurrency)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(row.investmentReturn, plan.baseCurrency)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(row.contributions, plan.baseCurrency)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(row.expenses, plan.baseCurrency)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(row.income, plan.baseCurrency)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(row.oneTimeCosts, plan.baseCurrency)}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatCurrency(row.closingBalance, plan.baseCurrency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TableCard>
          </div>
        ) : null}

        <div className="grid gap-4 px-4 md:grid-cols-3 lg:px-6">
          <Card>
            <CardHeader>
              <CalendarRangeIcon className="size-5 text-muted-foreground" />
              <CardTitle className="text-base">Phase-aware costs</CardTitle>
              <CardDescription>
                Education, childcare and loans can end; health or care costs can start later.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <UsersIcon className="size-5 text-muted-foreground" />
              <CardTitle className="text-base">Family without double counting</CardTitle>
              <CardDescription>
                Partner assets can be entered manually while your own wealth remains linked to the
                portfolio.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <ShieldCheckIcon className="size-5 text-muted-foreground" />
              <CardTitle className="text-base">Risk, not false precision</CardTitle>
              <CardDescription>
                Expected projections sit beside probability ranges and a clear list of assumptions.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
