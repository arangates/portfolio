import { EmptyDataState } from "@/components/empty-data-state";
import { PageHeader } from "@/components/page-header";
import { SalaryCharts } from "@/components/salary-charts";
import { SalaryUploadDialog } from "@/components/salary-upload-dialog";
import { SectionCards } from "@/components/section-cards";
import { TableCard } from "@/components/table-card";
import { formatCurrency, formatPercent } from "@/lib/format";
import { getRecentSalaryImports } from "@portfolio/api/salary-import";
import { getSalaryLineItemTotals, getSalaryPayslips } from "@portfolio/api/salary-queries";
import { auth } from "@portfolio/auth";
import { Badge } from "@portfolio/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@portfolio/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@portfolio/ui/components/table";
import {
  BanknoteIcon,
  CalendarClockIcon,
  CircleGaugeIcon,
  HandCoinsIcon,
  ReceiptTextIcon,
} from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

function monthLabel(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", year: "2-digit", timeZone: "UTC" }).format(
    new Date(`${value}T12:00:00Z`),
  );
}

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function missingPeriods(periods: string[]) {
  if (periods.length < 2) return [];
  const known = new Set(periods.map((period) => period.slice(0, 7)));
  const current = new Date(`${periods[0]}T12:00:00Z`);
  const end = new Date(`${periods.at(-1)}T12:00:00Z`);
  const missing: string[] = [];
  current.setUTCMonth(current.getUTCMonth() + 1);
  while (current < end) {
    const key = current.toISOString().slice(0, 7);
    if (!known.has(key)) missing.push(monthLabel(`${key}-01`));
    current.setUTCMonth(current.getUTCMonth() + 1);
  }
  return missing;
}

export default async function SalaryPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const [payslips, imports] = await Promise.all([
    getSalaryPayslips(session.user.id),
    getRecentSalaryImports(session.user.id),
  ]);
  const currency = payslips.at(-1)?.currency ?? "EUR";
  const lineItemTotals = await getSalaryLineItemTotals(
    session.user.id,
    payslips.map((payslip) => payslip.id),
  );

  if (payslips.length === 0) {
    return (
      <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 sm:py-5 md:gap-5 md:py-6">
          <PageHeader
            title="Salary"
            description="Turn PDF payslips into a private, queryable income history with earnings, taxes, pension and reimbursement analytics."
            action={<SalaryUploadDialog />}
          />
          <div className="px-4 lg:px-6">
            <EmptyDataState
              icon={HandCoinsIcon}
              title="No payslips yet"
              description="Bulk import up to 50 PDF payslips. Exact duplicate files are ignored automatically."
              action={<SalaryUploadDialog />}
            />
          </div>
        </div>
      </div>
    );
  }

  const totalGross = payslips.reduce((sum, payslip) => sum + payslip.grossPay, 0);
  const totalNet = payslips.reduce((sum, payslip) => sum + payslip.netPay, 0);
  const totalTax = payslips.reduce((sum, payslip) => sum + payslip.wageTax, 0);
  const totalTaxable = payslips.reduce((sum, payslip) => sum + payslip.taxableWage, 0);
  const totalPension = payslips.reduce((sum, payslip) => sum + payslip.pensionContribution, 0);
  const latest = payslips.at(-1);
  const typicalNet = median(
    payslips.filter((payslip) => payslip.supplementalGross === 0).map((payslip) => payslip.netPay),
  );
  const gaps = missingPeriods(payslips.map((payslip) => payslip.payPeriod));
  const chartData = payslips.map((payslip) => ({
    month: monthLabel(payslip.payPeriod),
    baseSalary: payslip.baseSalary,
    supplementalGross: payslip.supplementalGross,
    netPay: payslip.netPay,
    wageTax: payslip.wageTax,
    pensionContribution: payslip.pensionContribution,
    socialInsurance: payslip.socialInsurance,
  }));

  const annual = new Map<
    string,
    {
      year: string;
      months: number;
      gross: number;
      net: number;
      tax: number;
      pension: number;
      reportedYtdNet: number | null;
    }
  >();
  for (const payslip of payslips) {
    const year = payslip.payPeriod.slice(0, 4);
    const current = annual.get(year) ?? {
      year,
      months: 0,
      gross: 0,
      net: 0,
      tax: 0,
      pension: 0,
      reportedYtdNet: null,
    };
    current.months += 1;
    current.gross += payslip.grossPay;
    current.net += payslip.netPay;
    current.tax += payslip.wageTax;
    current.pension += payslip.pensionContribution;
    if (payslip.ytdNetPay !== null) {
      current.reportedYtdNet = payslip.ytdNetPay;
    }
    annual.set(year, current);
  }
  const ytdCoverageGaps = [...annual.values()]
    .map((year) => ({
      year: year.year,
      amount: (year.reportedYtdNet ?? year.net) - year.net,
    }))
    .filter((gap) => gap.amount > 0.02);

  return (
    <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col">
      <div className="flex flex-col gap-4 py-4 sm:py-5 md:gap-5 md:py-6">
        <PageHeader
          title="Salary intelligence"
          description="Verified payslip history with recurring salary, special earnings, taxes, pension, reimbursements and take-home pay kept separate."
          action={<SalaryUploadDialog />}
        />
        <SectionCards
          items={[
            {
              label: "Net income imported",
              value: formatCurrency(totalNet, currency),
              badge: `${payslips.length} months`,
              note: `Typical recurring month ${formatCurrency(typicalNet, currency)}`,
              detail: "Payable amounts from the latest version of each period",
              icon: BanknoteIcon,
            },
            {
              label: "Gross earnings",
              value: formatCurrency(totalGross, currency),
              badge: formatPercent(totalGross === 0 ? 0 : totalNet / totalGross, 1),
              note: "Net retained versus gross earnings",
              detail: "Base salary plus bonuses and special payments",
              icon: HandCoinsIcon,
            },
            {
              label: "Wage tax",
              value: formatCurrency(totalTax, currency),
              badge: formatPercent(totalTaxable === 0 ? 0 : totalTax / totalTaxable, 1),
              note: "Effective rate on imported taxable wage",
              detail: `Pension contributions ${formatCurrency(totalPension, currency)}`,
              icon: ReceiptTextIcon,
            },
            {
              label: "Current annual salary",
              value: formatCurrency(latest?.annualSalary ?? 0, currency),
              badge: latest?.periodLabel,
              note: `${latest?.partTimePercentage ?? 100}% contracted hours`,
              detail: `${latest?.employerName ?? "Latest employer"} · revision ${latest?.revision ?? "—"}`,
              icon: CircleGaugeIcon,
            },
          ]}
        />
        {gaps.length > 0 || ytdCoverageGaps.length > 0 ? (
          <div className="px-4 lg:px-6">
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarClockIcon className="size-4 text-amber-600" />
                  Coverage gap detected
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                {gaps.length > 0 ? (
                  <p>Missing between the first and latest imported periods: {gaps.join(", ")}.</p>
                ) : null}
                {ytdCoverageGaps.length > 0 ? (
                  <p>
                    Payroll YTD totals include additional net income not represented by monthly
                    PDFs:{" "}
                    {ytdCoverageGaps
                      .map((gap) => `${gap.year} ${formatCurrency(gap.amount, currency)}`)
                      .join("; ")}
                    .
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        ) : null}
        <SalaryCharts data={chartData} currency={currency} />
        <div className="grid gap-4 px-4 xl:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)] lg:px-6">
          <TableCard
            title="Monthly payslips"
            description="Latest imported revision per employer and pay period."
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Employer</TableHead>
                  <TableHead className="text-right">Base</TableHead>
                  <TableHead className="text-right">Special</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...payslips].reverse().map((payslip) => (
                  <TableRow key={payslip.id}>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/salary/${payslip.id}`} className="hover:underline">
                        {payslip.periodLabel}
                      </Link>
                      {payslip.versionCount > 1 ? (
                        <div className="text-xs text-muted-foreground">
                          {payslip.versionCount} revisions
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>{payslip.employerName}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(payslip.baseSalary, payslip.currency)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(payslip.supplementalGross, payslip.currency)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(payslip.wageTax, payslip.currency)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(payslip.netPay, payslip.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={payslip.validationStatus === "verified" ? "secondary" : "outline"}
                      >
                        {payslip.validationStatus.replace("_", " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
          <TableCard
            title="Largest payroll components"
            description="Across current payslip versions."
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Component</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItemTotals.slice(0, 10).map((item) => (
                  <TableRow key={`${item.category}:${item.description}`}>
                    <TableCell className="max-w-48 truncate font-medium">
                      {item.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(item.amount, currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </div>
        <div className="grid gap-4 px-4 xl:grid-cols-2 lg:px-6">
          <TableCard title="Annual summary" description="Totals from imported monthly statements.">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead className="text-right">Months</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                  <TableHead className="text-right">Pension</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead className="text-right">Reported YTD</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...annual.values()].reverse().map((year) => (
                  <TableRow key={year.year}>
                    <TableCell className="font-medium">{year.year}</TableCell>
                    <TableCell className="text-right">{year.months}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(year.gross, currency)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(year.tax, currency)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(year.pension, currency)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(year.net, currency)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {year.reportedYtdNet === null
                        ? "—"
                        : formatCurrency(year.reportedYtdNet, currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
          <TableCard
            title="Recent PDF processing"
            description="No raw PDF or extracted personal text is retained."
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Processed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {imports.slice(0, 8).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="max-w-48 truncate font-medium">{item.fileName}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === "completed" ? "secondary" : "outline"}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.completedAt?.toLocaleString("en-GB") ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </div>
      </div>
    </div>
  );
}
