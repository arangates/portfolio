import { PageHeader } from "@/components/page-header";
import { SectionCards } from "@/components/section-cards";
import { TableCard } from "@/components/table-card";
import { formatCurrency, formatPercent } from "@/lib/format";
import { getSalaryPayslip } from "@portfolio/api/salary-queries";
import { auth } from "@portfolio/auth";
import { Badge } from "@portfolio/ui/components/badge";
import { Button } from "@portfolio/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@portfolio/ui/components/table";
import {
  ArrowLeftIcon,
  BanknoteIcon,
  HandCoinsIcon,
  LandmarkIcon,
  ReceiptTextIcon,
} from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function SalaryPayslipPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const { id } = await params;
  const payslip = await getSalaryPayslip(session.user.id, id);
  if (!payslip) notFound();

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <PageHeader
          title={payslip.periodLabel}
          description={`${payslip.employerName} · parsed revision ${payslip.revision ?? "—"} · ${payslip.validationStatus.replace("_", " ")}`}
          action={
            <Button variant="outline" size="sm" render={<Link href="/dashboard/salary" />}>
              <ArrowLeftIcon data-icon="inline-start" />
              Salary overview
            </Button>
          }
        />
        <SectionCards
          items={[
            {
              label: "Gross earnings",
              value: formatCurrency(payslip.grossPay, payslip.currency),
              badge: `Base ${formatCurrency(payslip.baseSalary, payslip.currency)}`,
              note: `Special earnings ${formatCurrency(payslip.supplementalGross, payslip.currency)}`,
              detail: "Positive gross payroll components",
              icon: HandCoinsIcon,
            },
            {
              label: "Net pay",
              value: formatCurrency(payslip.netPay, payslip.currency),
              badge: formatPercent(
                payslip.grossPay === 0 ? 0 : payslip.netPay / payslip.grossPay,
                1,
              ),
              note: "Verified payable amount",
              detail: `Expense reimbursements ${formatCurrency(payslip.expenseReimbursements, payslip.currency)}`,
              icon: BanknoteIcon,
            },
            {
              label: "Wage tax",
              value: formatCurrency(payslip.wageTax, payslip.currency),
              badge: formatPercent(
                payslip.taxableWage === 0 ? 0 : payslip.wageTax / payslip.taxableWage,
                1,
              ),
              note: `Taxable wage ${formatCurrency(payslip.taxableWage, payslip.currency)}`,
              detail: payslip.ytdWageTax
                ? `YTD ${formatCurrency(payslip.ytdWageTax, payslip.currency)}`
                : "No YTD tax value",
              icon: ReceiptTextIcon,
            },
            {
              label: "Pension contribution",
              value: formatCurrency(payslip.pensionContribution, payslip.currency),
              badge: payslip.ytdPension
                ? `YTD ${formatCurrency(payslip.ytdPension, payslip.currency)}`
                : "Monthly",
              note: `Social insurance ${formatCurrency(payslip.socialInsurance, payslip.currency)}`,
              detail: `30% ruling compensation ${formatCurrency(payslip.thirtyPercentCompensation, payslip.currency)}`,
              icon: LandmarkIcon,
            },
          ]}
        />
        {payslip.validationIssues.length > 0 ? (
          <div className="px-4 lg:px-6">
            <TableCard title="Review required" description="Parser reconciliation warnings.">
              <ul className="list-disc space-y-1 px-8 text-sm text-muted-foreground">
                {payslip.validationIssues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </TableCard>
          </div>
        ) : null}
        <div className="px-4 lg:px-6">
          <TableCard
            title="Payslip line items"
            description="Normalized financial rows only; address, birth date, payroll number and bank account are not retained."
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslip.lineItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.category.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.quantity === null
                        ? "—"
                        : `${item.quantity.toLocaleString("en")} ${item.unit ?? ""}`}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(item.amount, payslip.currency)}
                    </TableCell>
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
