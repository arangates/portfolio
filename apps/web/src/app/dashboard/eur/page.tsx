import { ArchiveRecordButton } from "@/components/archive-record-button";
import { EmptyDataState } from "@/components/empty-data-state";
import { PageHeader } from "@/components/page-header";
import { PortfolioRecordDialog } from "@/components/portfolio-record-dialog";
import { SectionCards } from "@/components/section-cards";
import { TableCard } from "@/components/table-card";
import { formatCurrency, formatDate } from "@/lib/format";
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
import { Building2Icon, EuroIcon, LandmarkIcon, ShieldCheckIcon } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function EurPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const accounts = await getBankAccounts(session.user.id, "EUR");
  const total = accounts.reduce((sum, account) => sum + account.amount, 0);
  const funded = accounts.filter((account) => account.amount !== 0);
  const largest = accounts.reduce<(typeof accounts)[number] | null>(
    (current, account) => (!current || account.amount > current.amount ? account : current),
    null,
  );
  const latest = accounts.reduce<Date | null>(
    (current, account) =>
      !account.asOf || (current && account.asOf <= current) ? current : account.asOf,
    null,
  );

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <PageHeader
          title="EUR accounts"
          description="EUR bank accounts are kept separate from broker investments. Updates append dated balance snapshots without replacing history."
          action={<PortfolioRecordDialog kind="bank_account" values={{ currency: "EUR" }} />}
        />
        {accounts.length === 0 ? (
          <div className="px-4 lg:px-6">
            <EmptyDataState
              icon={EuroIcon}
              title="No EUR accounts"
              description="Add your first EUR bank account and current balance. Global investments belong on the Global equity page."
              action={<PortfolioRecordDialog kind="bank_account" values={{ currency: "EUR" }} />}
            />
          </div>
        ) : (
          <>
            <SectionCards
              items={[
                {
                  label: "EUR cash",
                  value: formatCurrency(total, "EUR"),
                  badge: `${funded.length} funded`,
                  note: "Latest bank balance snapshots",
                  detail: `${accounts.length} registered accounts`,
                  icon: EuroIcon,
                },
                {
                  label: "Active accounts",
                  value: accounts.length.toLocaleString("en"),
                  badge: "Bank only",
                  note: "Broker cash is not mixed into this page",
                  detail: latest ? `Updated ${formatDate(latest)}` : "No dated snapshot",
                  icon: LandmarkIcon,
                },
                {
                  label: "Largest balance",
                  value: largest ? formatCurrency(largest.amount, "EUR") : "—",
                  badge: largest?.institution,
                  note: largest ? `${largest.institution} · ${largest.name}` : "No account",
                  detail: "Largest current cash concentration",
                  icon: Building2Icon,
                },
                {
                  label: "Data protection",
                  value: "Account scoped",
                  badge: "Masked",
                  note: "Only last four digits are retained",
                  detail: "Every query is filtered by the session user",
                  icon: ShieldCheckIcon,
                },
              ]}
            />
            <div className="px-4 lg:px-6">
              <TableCard
                title="EUR bank accounts"
                description="Latest balance per account; updates append history."
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Institution</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
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
                        <TableCell>
                          <Badge variant="outline">{account.accountType}</Badge>
                        </TableCell>
                        <TableCell>
                          {account.accountLast4 ? `•••• ${account.accountLast4}` : "—"}
                        </TableCell>
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}
