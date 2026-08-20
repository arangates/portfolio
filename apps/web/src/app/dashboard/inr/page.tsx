import { ArchiveRecordButton } from "@/components/archive-record-button";
import { EmptyDataState } from "@/components/empty-data-state";
import { PageHeader } from "@/components/page-header";
import { PortfolioRecordDialog } from "@/components/portfolio-record-dialog";
import { SectionCards } from "@/components/section-cards";
import { TableCard } from "@/components/table-card";
import { formatCurrency, formatPercent } from "@/lib/format";
import { getBankAccounts } from "@portfolio/api/portfolio-queries";
import { auth } from "@portfolio/auth";
import { Badge } from "@portfolio/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@portfolio/ui/components/table";
import { BanknoteIcon, CircleGaugeIcon, LandmarkIcon, PieChartIcon } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function InrPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const accounts = await getBankAccounts(session.user.id, "INR");
  const total = accounts.reduce((sum, account) => sum + account.amount, 0);
  const funded = accounts.filter((account) => account.amount !== 0);
  const nre = accounts
    .filter((account) => account.accountType.toUpperCase().includes("NRE"))
    .reduce((sum, account) => sum + account.amount, 0);
  const largest = accounts.reduce<(typeof accounts)[number] | null>(
    (current, account) => (!current || account.amount > current.amount ? account : current),
    null,
  );
  const requiredMinimum = accounts.reduce(
    (sum, account) =>
      sum +
      (typeof account.minimumBalance === "number" && !Number.isNaN(account.minimumBalance)
        ? account.minimumBalance
        : 0),
    0,
  );
  const belowMinimum = accounts.filter(
    (account) =>
      typeof account.minimumBalance === "number" &&
      !Number.isNaN(account.minimumBalance) &&
      account.amount < account.minimumBalance,
  ).length;

  return (
    <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col">
      <div className="flex flex-col gap-4 py-4 sm:py-5 md:gap-5 md:py-6">
        <PageHeader
          title="INR accounts"
          description="Track INR cash, concentration and minimum-balance headroom from dated account snapshots."
          action={<PortfolioRecordDialog kind="bank_account" values={{ currency: "INR" }} />}
        />
        {accounts.length === 0 ? (
          <div className="px-4 lg:px-6">
            <EmptyDataState
              icon={BanknoteIcon}
              title="No INR accounts"
              description="Add your first account and balance to begin a dated cash history."
              action={<PortfolioRecordDialog kind="bank_account" values={{ currency: "INR" }} />}
            />
          </div>
        ) : (
          <>
            <SectionCards
              items={[
                {
                  label: "INR cash",
                  value: formatCurrency(total, "INR"),
                  badge: `${funded.length} funded`,
                  note: "Latest balance from each account",
                  detail: `${accounts.length} registered accounts`,
                  icon: BanknoteIcon,
                },
                {
                  label: "NRE balances",
                  value: formatCurrency(nre, "INR"),
                  badge: formatPercent(total === 0 ? 0 : nre / total, 0),
                  note: "Accounts labelled as NRE",
                  detail: "Calculated from current snapshots",
                  icon: LandmarkIcon,
                },
                {
                  label: "Largest concentration",
                  value: formatPercent(total === 0 ? 0 : (largest?.amount ?? 0) / total, 0),
                  badge: largest?.institution,
                  note: largest
                    ? `${formatCurrency(largest.amount, "INR")} in ${largest.name}`
                    : "No account",
                  detail: "Share of total INR cash",
                  icon: PieChartIcon,
                },
                {
                  label: "Above minimums",
                  value: formatCurrency(total - requiredMinimum, "INR"),
                  badge: belowMinimum === 0 ? "All covered" : `${belowMinimum} below minimum`,
                  note: `${formatCurrency(requiredMinimum, "INR")} required across accounts`,
                  detail: "Based on configured minimum balances",
                  icon: CircleGaugeIcon,
                },
              ]}
            />
            <div className="px-4 lg:px-6">
              <TableCard
                title="Bank accounts"
                description="Latest balance per account; updates append history."
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Institution</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Minimum</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="w-24">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.institution}</TableCell>
                        <TableCell>{account.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{account.accountType}</Badge>
                        </TableCell>
                        <TableCell>
                          {account.accountLast4 ? `•••• ${account.accountLast4}` : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {typeof account.minimumBalance === "number" &&
                          !Number.isNaN(account.minimumBalance)
                            ? formatCurrency(account.minimumBalance, "INR")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(account.amount, "INR")}
                          {typeof account.minimumBalance === "number" &&
                          !Number.isNaN(account.minimumBalance) &&
                          account.amount < account.minimumBalance ? (
                            <div className="mt-2">
                              <Badge variant="destructive">Below minimum</Badge>
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <PortfolioRecordDialog
                              compact
                              kind="bank_account"
                              values={{
                                ...account,
                                asOf: account.asOf?.toISOString().slice(0, 10),
                              }}
                            />
                            <ArchiveRecordButton
                              kind="bank_account"
                              id={account.id}
                              label={account.name}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableCard>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
