import { ArchiveRecordButton } from "@/components/archive-record-button";
import { EmptyDataState } from "@/components/empty-data-state";
import { PortfolioRecordDialog } from "@/components/portfolio-record-dialog";
import { SectionCards } from "@/components/section-cards";
import { TableCard } from "@/components/table-card";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { getCurrentFixedDeposits } from "@portfolio/api/portfolio-queries";
import { auth } from "@portfolio/auth";
import { Badge } from "@portfolio/ui/components/badge";
import { Progress } from "@portfolio/ui/components/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@portfolio/ui/components/table";
import { CalendarClockIcon, HistoryIcon, LandmarkIcon, PercentIcon } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

function maturityValue(deposit: {
  principal: number;
  interestRate: number;
  startDate: string;
  maturityDate: string;
  compoundingPerYear: number;
}) {
  const years =
    (new Date(deposit.maturityDate).getTime() - new Date(deposit.startDate).getTime()) /
    31_557_600_000;
  return (
    deposit.principal *
    (1 + deposit.interestRate / deposit.compoundingPerYear) ** (deposit.compoundingPerYear * years)
  );
}

export default async function FixedDepositsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const deposits = await getCurrentFixedDeposits(session.user.id);

  if (deposits.length === 0) {
    return (
      <div className="px-4 py-6 lg:px-6">
        <EmptyDataState
          icon={LandmarkIcon}
          title="No fixed deposits"
          description="Add your first deposit. Future updates append snapshots, preserving its entire history."
          action={
            <PortfolioRecordDialog
              kind="fixed_deposit"
              values={{ currency: "INR", compoundingPerYear: 4 }}
            />
          }
        />
      </div>
    );
  }

  const active = deposits.filter((deposit) => deposit.status === "active");
  const totalPrincipal = active.reduce((sum, deposit) => sum + deposit.principal, 0);
  const projected = active.reduce((sum, deposit) => sum + maturityValue(deposit), 0);
  const weightedRate = active.reduce(
    (sum, deposit) =>
      sum + deposit.interestRate * (totalPrincipal === 0 ? 0 : deposit.principal / totalPrincipal),
    0,
  );
  const nextMaturity = active
    .filter((deposit) => new Date(deposit.maturityDate) >= new Date())
    .reduce<(typeof active)[number] | null>(
      (current, deposit) =>
        !current || deposit.maturityDate < current.maturityDate ? deposit : current,
      null,
    );
  const banks = [...new Set(active.map((deposit) => deposit.bank))];

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SectionCards
          items={[
            {
              label: "Active principal",
              value: formatCurrency(totalPrincipal, "INR"),
              badge: `${active.length} deposits`,
              note: "Latest active snapshots",
              detail: `Across ${banks.length} institutions`,
              icon: LandmarkIcon,
            },
            {
              label: "Projected maturity",
              value: formatCurrency(projected, "INR"),
              badge: formatCurrency(projected - totalPrincipal, "INR"),
              note: "Compounding estimate",
              detail: "Uses each deposit’s stored frequency",
              icon: CalendarClockIcon,
            },
            {
              label: "Weighted rate",
              value: formatPercent(weightedRate, 2),
              badge: "Portfolio rate",
              note: "Weighted by active principal",
              detail: "No shared benchmark assumptions",
              icon: PercentIcon,
            },
            {
              label: "Next maturity",
              value: nextMaturity ? formatDate(nextMaturity.maturityDate) : "—",
              badge: nextMaturity?.bank,
              note: nextMaturity
                ? formatCurrency(nextMaturity.principal, nextMaturity.currency)
                : "No upcoming maturity",
              detail: "Review upcoming rollover needs",
              icon: HistoryIcon,
            },
          ]}
        />
        <div className="grid gap-4 px-4 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)] lg:px-6">
          <TableCard
            title="Deposit register"
            description="Current records; edits create historical snapshots."
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bank</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Maturity</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">Projected</TableHead>
                  <TableHead className="w-24">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deposits.map((deposit) => (
                  <TableRow key={deposit.id}>
                    <TableCell className="font-medium">{deposit.bank}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{deposit.type}</Badge>
                    </TableCell>
                    <TableCell>{formatPercent(deposit.interestRate, 2)}</TableCell>
                    <TableCell>{formatDate(deposit.maturityDate)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(deposit.principal, deposit.currency)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(maturityValue(deposit), deposit.currency)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <PortfolioRecordDialog
                          compact
                          kind="fixed_deposit"
                          values={{
                            ...deposit,
                            asOf: deposit.asOf.toISOString().slice(0, 10),
                            depositType: deposit.type,
                            interestRate: deposit.interestRate * 100,
                          }}
                        />
                        <ArchiveRecordButton
                          kind="fixed_deposit"
                          id={deposit.id}
                          label={`${deposit.bank} deposit`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
          <TableCard title="Institution concentration" description="Share of active principal.">
            <div className="flex flex-col gap-5 px-4">
              {banks.map((bank) => {
                const amount = active
                  .filter((deposit) => deposit.bank === bank)
                  .reduce((sum, deposit) => sum + deposit.principal, 0);
                const share = totalPrincipal === 0 ? 0 : amount / totalPrincipal;
                return (
                  <div key={bank} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="font-medium">{bank}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatPercent(share, 0)}
                      </span>
                    </div>
                    <Progress value={share * 100} />
                  </div>
                );
              })}
            </div>
          </TableCard>
        </div>
      </div>
    </div>
  );
}
