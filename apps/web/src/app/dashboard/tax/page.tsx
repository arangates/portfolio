import { EmptyDataState } from "@/components/empty-data-state";
import { IncomeTaxCharts } from "@/components/income-tax-charts";
import { IncomeTaxUploadDialog } from "@/components/income-tax-upload-dialog";
import { PageHeader } from "@/components/page-header";
import { SectionCards } from "@/components/section-cards";
import { TableCard } from "@/components/table-card";
import { formatCurrency, formatPercent } from "@/lib/format";
import { getIncomeTaxReturns } from "@portfolio/api/income-tax-queries";
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
import { BanknoteIcon, CalendarCheckIcon, LandmarkIcon, ReceiptTextIcon } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

function assessmentYearGaps(years: number[]) {
  if (years.length < 2) return [];
  const known = new Set(years);
  const missing: string[] = [];
  for (let year = Math.min(...years) + 1; year < Math.max(...years); year += 1) {
    if (!known.has(year)) missing.push(`${year}-${String((year + 1) % 100).padStart(2, "0")}`);
  }
  return missing;
}

export default async function IncomeTaxPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const returns = await getIncomeTaxReturns(session.user.id);

  if (returns.length === 0) {
    return (
      <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 sm:py-5 md:gap-5 md:py-6">
          <PageHeader
            title="Income tax"
            description="Build a private, reconciled history from Indian ITR-2 and ITR-3 JSON exports."
            action={<IncomeTaxUploadDialog />}
          />
          <div className="px-4 lg:px-6">
            <EmptyDataState
              icon={ReceiptTextIcon}
              title="No tax returns yet"
              description="Bulk import the JSON downloaded for each assessment year. Exact duplicates are ignored and the original JSON is not retained."
              action={<IncomeTaxUploadDialog />}
            />
          </div>
        </div>
      </div>
    );
  }

  const latest = returns.at(-1);
  const totalTaxesPaid = returns.reduce((sum, row) => sum + row.totalTaxesPaid, 0);
  const totalRefunds = returns.reduce((sum, row) => sum + row.refundDue, 0);
  const verified = returns.filter((row) => row.validationStatus === "verified").length;
  const gaps = assessmentYearGaps(returns.map((row) => row.assessmentYearStart));
  const chartData = returns.map((row) => ({
    year: `AY ${row.assessmentYearLabel}`,
    salaryIncome: row.salaryIncome,
    businessIncome: row.businessIncome,
    capitalGains: row.capitalGains,
    otherSourcesIncome: row.otherSourcesIncome,
    totalIncome: row.totalIncome,
    aggregateTaxLiability: row.aggregateTaxLiability,
    totalTaxesPaid: row.totalTaxesPaid,
    refundDue: row.refundDue,
  }));

  return (
    <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col">
      <div className="flex flex-col gap-4 py-4 sm:py-5 md:gap-5 md:py-6">
        <PageHeader
          title="Income tax history"
          description="Reported income, deductions, tax liability, credits and refunds normalized from your Indian ITR JSON exports."
          action={<IncomeTaxUploadDialog />}
        />
        <SectionCards
          items={[
            {
              label: "Latest taxable income",
              value: formatCurrency(latest?.totalIncome ?? 0, "INR"),
              badge: `AY ${latest?.assessmentYearLabel}`,
              note: `Gross income ${formatCurrency(latest?.grossTotalIncome ?? 0, "INR")}`,
              detail: `Deductions ${formatCurrency(latest?.chapterViDeductions ?? 0, "INR")}`,
              icon: BanknoteIcon,
            },
            {
              label: "Latest tax liability",
              value: formatCurrency(latest?.aggregateTaxLiability ?? 0, "INR"),
              badge: formatPercent(
                latest?.totalIncome ? latest.aggregateTaxLiability / latest.totalIncome : 0,
                1,
              ),
              note: "Effective rate on reported total income",
              detail: `Taxes credited ${formatCurrency(latest?.totalTaxesPaid ?? 0, "INR")}`,
              icon: LandmarkIcon,
            },
            {
              label: "Refunds recorded",
              value: formatCurrency(totalRefunds, "INR"),
              badge: `${returns.filter((row) => row.refundDue > 0).length} years`,
              note: `Total taxes credited ${formatCurrency(totalTaxesPaid, "INR")}`,
              detail: "Amounts declared in imported returns",
              icon: ReceiptTextIcon,
            },
            {
              label: "History quality",
              value: `${verified}/${returns.length} verified`,
              badge: gaps.length === 0 ? "Continuous" : `${gaps.length} gaps`,
              note:
                gaps.length === 0
                  ? "No missing years inside the imported range"
                  : `Missing AY ${gaps.join(", ")}`,
              detail: "Arithmetic reconciliation only; not government acceptance",
              icon: CalendarCheckIcon,
            },
          ]}
        />
        <IncomeTaxCharts data={chartData} />
        <div className="px-4 lg:px-6">
          <TableCard
            title="Assessment-year history"
            description="Latest imported filing for each assessment year. Re-imported revisions remain preserved."
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Financial year</TableHead>
                  <TableHead>Assessment year</TableHead>
                  <TableHead>Return</TableHead>
                  <TableHead className="text-right">Total income</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Tax liability</TableHead>
                  <TableHead className="text-right">Taxes paid</TableHead>
                  <TableHead className="text-right">Refund</TableHead>
                  <TableHead className="text-right">Effective rate</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...returns].reverse().map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">FY {row.financialYearLabel}</TableCell>
                    <TableCell>AY {row.assessmentYearLabel}</TableCell>
                    <TableCell>
                      <div>{row.formType}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.filingSection ?? "Section unknown"}
                        {row.acknowledgementLast4 ? ` · Ack ••••${row.acknowledgementLast4}` : ""}
                        {row.versionCount > 1 ? ` · ${row.versionCount} versions` : ""}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(row.totalIncome, "INR")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(row.chapterViDeductions, "INR")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(row.aggregateTaxLiability, "INR")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(row.totalTaxesPaid, "INR")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(row.refundDue, "INR")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPercent(
                        row.totalIncome === 0 ? 0 : row.aggregateTaxLiability / row.totalIncome,
                        1,
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={row.validationStatus === "verified" ? "secondary" : "outline"}
                      >
                        {row.validationStatus === "verified" ? "Verified" : "Review"}
                      </Badge>
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
