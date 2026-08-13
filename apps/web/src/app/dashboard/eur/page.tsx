import { ArchiveRecordButton } from "@/components/archive-record-button";
import { EmptyDataState } from "@/components/empty-data-state";
import { PageHeader } from "@/components/page-header";
import { PortfolioRecordDialog } from "@/components/portfolio-record-dialog";
import { SectionCards } from "@/components/section-cards";
import { TableCard } from "@/components/table-card";
import { UploadDialog } from "@/components/upload-dialog";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  getBankAccounts,
  getDegiroAnalytics,
  getRecentDegiroEntries,
} from "@portfolio/api/portfolio-queries";
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
import { ArrowLeftRightIcon, BanknoteIcon, DatabaseIcon, EuroIcon } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function EurPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const [accounts, entries, analytics] = await Promise.all([
    getBankAccounts(session.user.id, "EUR"),
    getRecentDegiroEntries(session.user.id),
    getDegiroAnalytics(session.user.id),
  ]);
  const bankCash = accounts.reduce((total, account) => total + account.amount, 0);
  const brokerCash = analytics.balances
    .filter((balance) => balance.currency === "EUR")
    .reduce((total, balance) => total + balance.balance, 0);

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <PageHeader
          title="EUR & European activity"
          description="European cash accounts and the complete Degiro ledger. Overlapping exports are deduplicated per account without removing history."
          action={
            <div className="flex flex-wrap gap-2">
              <PortfolioRecordDialog kind="bank_account" values={{ currency: "EUR" }} />
              <UploadDialog
                kind="degiro"
                title="Import Degiro exports"
                description="Select Transactions and Account CSV exports."
                accept=".csv,text/csv"
                multiple
              />
            </div>
          }
        />
        {accounts.length === 0 && entries.length === 0 ? (
          <div className="px-4 lg:px-6">
            <EmptyDataState
              icon={EuroIcon}
              title="No EUR data"
              description="Add a cash account or import your Degiro exports to begin."
              action={<PortfolioRecordDialog kind="bank_account" values={{ currency: "EUR" }} />}
            />
          </div>
        ) : (
          <>
            <SectionCards
              items={[
                {
                  label: "EUR cash",
                  value: formatCurrency(bankCash + brokerCash, "EUR"),
                  badge: `${accounts.length} accounts`,
                  note: "Bank plus latest broker ledger balance",
                  detail: `${formatCurrency(brokerCash, "EUR")} reported by broker`,
                  icon: EuroIcon,
                },
                {
                  label: "Dividend income",
                  value: formatCurrency(analytics.dividends, "EUR"),
                  badge: "Ledger derived",
                  note: "Imported dividend cash flows",
                  detail: "Historical ledger rows are never replaced",
                  icon: ArrowLeftRightIcon,
                },
                {
                  label: "Fees",
                  value: formatCurrency(Math.abs(analytics.fees), "EUR"),
                  badge: "Tracked",
                  note: "Transaction and account fees",
                  detail: "Useful for net-return calculations",
                  icon: BanknoteIcon,
                },
                {
                  label: "Ledger activity",
                  value: analytics.rowCount.toLocaleString("en"),
                  badge: "Rows",
                  note: "Trades, income, fees and cash movements",
                  detail: "Source hashes prevent duplicates",
                  icon: DatabaseIcon,
                },
              ]}
            />
            <div className="grid gap-4 px-4 xl:grid-cols-2 lg:px-6">
              <TableCard title="EUR accounts" description="Latest safe balance snapshots.">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Institution</TableHead>
                      <TableHead>Account</TableHead>
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
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(account.amount, "EUR")}
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
              <TableCard
                title="Recent Degiro activity"
                description="Most recent account-scoped ledger entries."
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{formatDate(entry.occurredAt)}</TableCell>
                        <TableCell className="max-w-52 truncate font-medium">
                          {entry.product ?? entry.description ?? "Activity"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{entry.entryType.replaceAll("_", " ")}</Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(Number(entry.netAmount ?? 0), entry.currency)}
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
