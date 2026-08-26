import { EmptyDataState } from "@/components/empty-data-state";
import { HouseholdArchiveButton } from "@/components/household-archive-button";
import { HouseholdCharts } from "@/components/household-charts";
import { HouseholdRecordDialog } from "@/components/household-record-dialog";
import { PageHeader } from "@/components/page-header";
import { SectionCards } from "@/components/section-cards";
import { TableCard } from "@/components/table-card";
import { formatCurrency, formatPercent } from "@/lib/format";
import { getHouseholdDashboard } from "@portfolio/api/household-queries";
import { auth } from "@portfolio/auth";
import { Badge } from "@portfolio/ui/components/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@portfolio/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@portfolio/ui/components/table";
import {
  CalendarClockIcon,
  CarFrontIcon,
  HandCoinsIcon,
  HouseIcon,
  ReceiptTextIcon,
  ShieldAlertIcon,
} from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

function healthLabel(health: string) {
  return health === "needs_review"
    ? "Review overdue"
    : health === "renewal_due"
      ? "Renewal due"
      : health.replace("_", " ");
}

export default async function HouseholdPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const data = await getHouseholdDashboard(session.user.id);
  if (!data.configured || !data.profile) {
    return (
      <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 sm:py-5 md:gap-5 md:py-6">
          <PageHeader
            title="Household"
            description="Track the recurring cost of running your household, government refunds, contracts and one-time purchases."
          />
          <div className="px-4 lg:px-6">
            <EmptyDataState
              icon={HouseIcon}
              title="Set up your household"
              description="Choose a name, currency and the number of adults sharing costs. All records remain private to this account."
              action={
                <HouseholdRecordDialog
                  kind="household_profile"
                  values={{ name: "My household", currency: "EUR", adultsCount: 1 }}
                  label="Create household"
                />
              }
            />
          </div>
        </div>
      </div>
    );
  }

  const budgetOptions = data.budget
    .filter((item) => item.flowType === "expense")
    .map((item) => ({ id: item.id, name: item.name }));
  const scenarioOptions = data.scenarios
    .filter((scenario) => !scenario.usesCurrentBudget)
    .map((scenario) => ({ id: scenario.id, name: scenario.name }));
  const scenarioLines = data.scenarios.flatMap((scenario) =>
    scenario.usesCurrentBudget
      ? []
      : scenario.lines.map((line) => ({
          ...line,
          scenarioId: scenario.id,
          scenarioName: scenario.name,
        })),
  );

  return (
    <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col">
      <div className="flex flex-col gap-4 py-4 sm:py-5 md:gap-5 md:py-6">
        <PageHeader
          title={data.profile.name}
          description="A refund-aware household budget with historical amounts, stress scenarios, contract checks and one-time spending."
          action={
            <HouseholdRecordDialog
              kind="household_profile"
              values={data.profile}
              currency={data.currency}
              label="Household settings"
            />
          }
        />

        <SectionCards
          items={[
            {
              label: "Net monthly household cost",
              value: formatCurrency(data.metrics.netMonthly, data.currency),
              badge: `${data.adultsCount} adults`,
              note: `${formatCurrency(data.metrics.perAdult, data.currency)} per adult`,
              detail: "Gross expenses minus allowances and refunds",
              icon: HouseIcon,
            },
            {
              label: "Gross monthly expenses",
              value: formatCurrency(data.metrics.grossExpenses, data.currency),
              badge: `${data.budget.filter((item) => item.flowType === "expense").length} items`,
              note: `${formatCurrency(data.metrics.annualNet, data.currency)} annual net cost`,
              detail: `${formatCurrency(data.metrics.essentialExpenses, data.currency)} essential`,
              icon: ReceiptTextIcon,
            },
            {
              label: "Monthly refunds",
              value: formatCurrency(data.metrics.refunds, data.currency),
              badge: formatPercent(data.metrics.refundCoverage, 0),
              note: "Government support and housing refunds",
              detail: "Refunds remain visible instead of hiding the gross cost",
              icon: HandCoinsIcon,
            },
            {
              label: "Contracts to review",
              value: String(data.metrics.contractsNeedingReview),
              badge: `${data.metrics.budgetMismatches} budget mismatches`,
              note: `${formatCurrency(data.metrics.contractMonthlyCost, data.currency)} listed contract cost`,
              detail: "Expired terms and contract-to-budget differences",
              icon: CalendarClockIcon,
            },
          ]}
        />

        <HouseholdCharts
          categories={data.categoryBreakdown}
          scenarios={data.scenarios}
          currency={data.currency}
          essentialExpenses={data.metrics.essentialExpenses}
          flexibleExpenses={data.metrics.flexibleExpenses}
        />

        <div className="px-4 lg:px-6">
          <TableCard
            title="Monthly budget"
            description="Every amount is effective-dated. Editing with a new date preserves the previous snapshot."
            action={
              <HouseholdRecordDialog
                kind="household_budget_item"
                values={{
                  flowType: "expense",
                  essential: true,
                  effectiveFrom: new Date().toISOString().slice(0, 10),
                }}
                currency={data.currency}
              />
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Effective</TableHead>
                  <TableHead className="text-right">Monthly</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.budget.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.name}
                      <div className="text-xs text-muted-foreground">
                        {item.essential ? "Essential" : "Flexible"}
                      </div>
                    </TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      <Badge variant={item.flowType === "refund" ? "secondary" : "outline"}>
                        {item.flowType}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.effectiveFrom}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.flowType === "refund" ? "−" : ""}
                      {formatCurrency(item.monthlyAmount, data.currency)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <HouseholdRecordDialog
                          kind="household_budget_item"
                          values={item}
                          currency={data.currency}
                          label="Edit"
                        />
                        <HouseholdArchiveButton
                          kind="household_budget_item"
                          id={item.id}
                          label={item.name}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </div>

        <div className="px-4 lg:px-6">
          <TableCard
            title="Household scenarios"
            description="Compare complete household-level arithmetic; refunds are never subtracted twice."
            action={
              <HouseholdRecordDialog
                kind="household_scenario"
                values={{
                  scenarioType: "custom",
                  adultsCount: data.adultsCount,
                  usesCurrentBudget: false,
                  isDefault: false,
                }}
                currency={data.currency}
              />
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scenario</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Refunds</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead className="text-right">Per adult</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.scenarios.map((scenario) => (
                  <TableRow key={scenario.id}>
                    <TableCell className="font-medium">
                      {scenario.name}
                      <div className="text-xs text-muted-foreground">
                        {scenario.usesCurrentBudget
                          ? "Follows current budget"
                          : `${scenario.lines.length} scenario lines`}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(scenario.grossExpenses, data.currency)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(scenario.refunds, data.currency)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(scenario.netMonthly, data.currency)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(scenario.perAdult, data.currency)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <HouseholdRecordDialog
                          kind="household_scenario"
                          values={{
                            id: scenario.id,
                            name: scenario.name,
                            scenarioType: scenario.scenarioType,
                            description: scenario.description,
                            adultsCount: scenario.adultsCount,
                            usesCurrentBudget: scenario.usesCurrentBudget,
                            isDefault: scenario.isDefault,
                          }}
                          currency={data.currency}
                          label="Edit"
                        />
                        <HouseholdArchiveButton
                          kind="household_scenario"
                          id={scenario.id}
                          label={scenario.name}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </div>

        {scenarioOptions.length > 0 ? (
          <div className="px-4 lg:px-6">
            <TableCard
              title="Scenario assumptions"
              description="Independent expense and refund lines used by minimum and stress cases."
              action={
                <HouseholdRecordDialog
                  kind="household_scenario_line"
                  scenarioOptions={scenarioOptions}
                  values={{
                    scenarioId: scenarioOptions[0]?.id,
                    flowType: "expense",
                    essential: true,
                    sortOrder: scenarioLines.length + 1,
                  }}
                  currency={data.currency}
                />
              }
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scenario</TableHead>
                    <TableHead>Line</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Monthly</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scenarioLines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>{line.scenarioName}</TableCell>
                      <TableCell className="font-medium">{line.name}</TableCell>
                      <TableCell>{line.category}</TableCell>
                      <TableCell>
                        <Badge variant={line.flowType === "refund" ? "secondary" : "outline"}>
                          {line.flowType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(line.monthlyAmount, data.currency)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <HouseholdRecordDialog
                            kind="household_scenario_line"
                            values={line}
                            scenarioOptions={scenarioOptions}
                            currency={data.currency}
                            label="Edit"
                          />
                          <HouseholdArchiveButton
                            kind="household_scenario_line"
                            id={line.id}
                            label={line.name}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableCard>
          </div>
        ) : null}

        <div className="px-4 lg:px-6">
          <TableCard
            title="Service contracts"
            description="Renewal dates and contract amounts are checked against the matching monthly budget item."
            action={
              <HouseholdRecordDialog
                kind="household_service_contract"
                budgetOptions={budgetOptions}
                values={{
                  effectiveFrom: new Date().toISOString().slice(0, 10),
                  renewalType: "unknown",
                  status: "active",
                }}
                currency={data.currency}
              />
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Renewal</TableHead>
                  <TableHead>Budget check</TableHead>
                  <TableHead className="text-right">Contract</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.contracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">
                      {contract.service}
                      <div className="text-xs text-muted-foreground">
                        {contract.billingDay
                          ? `Bills on day ${contract.billingDay}`
                          : "Billing day unknown"}
                      </div>
                    </TableCell>
                    <TableCell>{contract.provider}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          contract.health === "needs_review" || contract.health === "renewal_due"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {healthLabel(contract.health)}
                      </Badge>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {contract.contractEndDate ?? contract.renewalType}
                      </div>
                    </TableCell>
                    <TableCell>
                      {contract.budgetItemName ? (
                        <>
                          <span>{contract.budgetItemName}</span>
                          <div
                            className={`text-xs ${contract.hasBudgetMismatch ? "text-destructive" : "text-muted-foreground"}`}
                          >
                            {contract.difference === null
                              ? "No cost to compare"
                              : `${contract.difference >= 0 ? "+" : ""}${formatCurrency(contract.difference, data.currency)} vs budget`}
                          </div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Not linked</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {contract.monthlyCost === null
                        ? "—"
                        : formatCurrency(contract.monthlyCost, data.currency)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <HouseholdRecordDialog
                          kind="household_service_contract"
                          values={contract}
                          budgetOptions={budgetOptions}
                          currency={data.currency}
                          label="Edit"
                        />
                        <HouseholdArchiveButton
                          kind="household_service_contract"
                          id={contract.id}
                          label={contract.service}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </div>

        <div className="px-4 lg:px-6">
          <TableCard
            title="One-time household and car expenses"
            description={`${formatCurrency(data.metrics.oneTimeTotal, data.currency)} recorded across house setup, improvements and vehicle costs.`}
            action={
              <HouseholdRecordDialog
                kind="household_purchase"
                values={{ scope: "house_setup", currency: data.currency }}
                currency={data.currency}
              />
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Expense</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Paid from</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.oneTimeExpenses.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-medium">
                      {purchase.name}
                      <div className="text-xs text-muted-foreground">{purchase.category}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{purchase.scope.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell>{purchase.purchasedOn ?? "Unknown"}</TableCell>
                    <TableCell>{purchase.paymentSource ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(purchase.amount, purchase.currency)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <HouseholdRecordDialog
                          kind="household_purchase"
                          values={purchase}
                          currency={data.currency}
                          label="Edit"
                        />
                        <HouseholdArchiveButton
                          kind="household_purchase"
                          id={purchase.id}
                          label={purchase.name}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </div>

        <div className="grid gap-4 px-4 md:grid-cols-3 lg:px-6">
          <Card>
            <CardHeader>
              <ShieldAlertIcon className="size-5 text-muted-foreground" />
              <CardTitle className="text-base">Refund dependency</CardTitle>
              <CardDescription>
                {formatPercent(data.metrics.refundCoverage, 0)} of gross monthly expenses is offset
                by current allowances. Stress scenarios make changes explicit.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CarFrontIcon className="size-5 text-muted-foreground" />
              <CardTitle className="text-base">Car cost, not only purchase price</CardTitle>
              <CardDescription>
                Monthly fuel, tax and insurance remain in the budget while purchase, APK and repairs
                stay as one-time events.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CalendarClockIcon className="size-5 text-muted-foreground" />
              <CardTitle className="text-base">Contract review queue</CardTitle>
              <CardDescription>
                Old end dates are flagged for review instead of silently assuming a contract
                renewed.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
