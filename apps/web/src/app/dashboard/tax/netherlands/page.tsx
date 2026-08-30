import { EmptyDataState } from "@/components/empty-data-state";
import { NetherlandsTaxCharts } from "@/components/netherlands-tax-charts";
import { NetherlandsTaxUploadDialog } from "@/components/netherlands-tax-upload-dialog";
import { PageHeader } from "@/components/page-header";
import { SectionCards } from "@/components/section-cards";
import { TableCard } from "@/components/table-card";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import {
  getNetherlandsTaxAssessments,
  getNetherlandsTaxpayerOptions,
} from "@portfolio/api/netherlands-tax-queries";
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
import { BadgeEuroIcon, BanknoteIcon, CalendarCheckIcon, ReceiptTextIcon } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function NetherlandsTaxPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const [assessments, taxpayers] = await Promise.all([
    getNetherlandsTaxAssessments(session.user.id),
    getNetherlandsTaxpayerOptions(session.user.id),
  ]);
  const upload = <NetherlandsTaxUploadDialog taxpayers={taxpayers} />;

  if (assessments.length === 0) {
    return (
      <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 sm:py-5 md:gap-5 md:py-6">
          <PageHeader
            title="Dutch income tax"
            description="Track accepted Box income, tax, credits and settlements from definitive assessments."
            action={upload}
          />
          <div className="px-4 lg:px-6">
            <EmptyDataState
              icon={ReceiptTextIcon}
              title="No Dutch assessments yet"
              description="Bulk import final income-tax assessment PDFs from Mijn Belastingdienst. Select one taxpayer for each batch."
              action={upload}
            />
          </div>
        </div>
      </div>
    );
  }

  const latest = assessments.at(-1);
  const totalFinalTax = assessments.reduce((sum, row) => sum + row.finalTaxAndSocialInsurance, 0);
  const totalRefunds = assessments.reduce(
    (sum, row) => sum + (row.outcomeType === "refund" ? row.settlementAmount : 0),
    0,
  );
  const verified = assessments.filter((row) => row.validationStatus === "verified").length;
  const multipleTaxpayers =
    new Set(assessments.map((row) => row.taxpayerMemberId ?? "owner")).size > 1;
  const chartData = assessments.map((row) => ({
    label: multipleTaxpayers ? `${row.taxYear} · ${row.taxpayerName}` : String(row.taxYear),
    box1TaxableIncome: row.box1TaxableIncome,
    box2TaxableIncome: row.box2TaxableIncome,
    box3TaxableIncome: row.box3TaxableIncome,
    aggregateIncome: row.aggregateIncome,
    finalTaxAndSocialInsurance: row.finalTaxAndSocialInsurance,
    payrollTaxWithheld: row.payrollTaxWithheld,
    totalTaxCredits: row.totalTaxCredits,
    settlementAmount: row.outcomeType === "payable" ? -row.settlementAmount : row.settlementAmount,
  }));

  return (
    <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col">
      <div className="flex flex-col gap-4 py-4 sm:py-5 md:gap-5 md:py-6">
        <PageHeader
          title="Dutch income-tax history"
          description="Authoritative values accepted by Belastingdienst, with revisions, reconciliation and taxpayer ownership preserved."
          action={upload}
        />
        <SectionCards
          items={[
            {
              label: "Latest aggregate income",
              value: formatCurrency(latest?.aggregateIncome ?? 0, "EUR"),
              badge: String(latest?.taxYear ?? "—"),
              note: `Box 1 ${formatCurrency(latest?.box1TaxableIncome ?? 0, "EUR")}`,
              detail: latest?.taxpayerName,
              icon: BanknoteIcon,
            },
            {
              label: "Latest final tax",
              value: formatCurrency(latest?.finalTaxAndSocialInsurance ?? 0, "EUR"),
              badge: formatPercent(
                latest?.aggregateIncome
                  ? latest.finalTaxAndSocialInsurance / latest.aggregateIncome
                  : 0,
                1,
              ),
              note: `Tax credits ${formatCurrency(latest?.totalTaxCredits ?? 0, "EUR")}`,
              detail: "Income tax plus national insurance after credits",
              icon: BadgeEuroIcon,
            },
            {
              label: "Refunds recorded",
              value: formatCurrency(totalRefunds, "EUR"),
              badge: `${assessments.filter((row) => row.outcomeType === "refund").length} assessments`,
              note: `Accepted tax across history ${formatCurrency(totalFinalTax, "EUR")}`,
              detail: "Final-assessment outcomes only",
              icon: ReceiptTextIcon,
            },
            {
              label: "History quality",
              value: `${verified}/${assessments.length} verified`,
              badge: `${new Set(assessments.map((row) => row.taxYear)).size} years`,
              note: "Assessment arithmetic independently reconciled",
              detail: "Exact duplicate PDFs are ignored",
              icon: CalendarCheckIcon,
            },
          ]}
        />
        <NetherlandsTaxCharts data={chartData} />
        <div className="px-4 lg:px-6">
          <TableCard
            title="Final assessments"
            description="Latest assessment per taxpayer and tax year; previous revisions remain preserved."
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead>Taxpayer</TableHead>
                  <TableHead>Assessment</TableHead>
                  <TableHead className="text-right">Box 1 income</TableHead>
                  <TableHead className="text-right">Aggregate income</TableHead>
                  <TableHead className="text-right">Final tax</TableHead>
                  <TableHead className="text-right">Payroll tax</TableHead>
                  <TableHead className="text-right">Credits</TableHead>
                  <TableHead className="text-right">Settlement</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...assessments].reverse().map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.taxYear}</TableCell>
                    <TableCell>
                      <div>{row.taxpayerName}</div>
                      <div className="text-xs capitalize text-muted-foreground">
                        {row.taxpayerRelationship}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {row.assessmentType === "revised_final" ? "Revised final" : "Final"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(row.assessmentDate)}
                        {row.assessmentReferenceSuffix
                          ? ` · Ref ••••${row.assessmentReferenceSuffix}`
                          : ""}
                        {row.versionCount > 1 ? ` · ${row.versionCount} versions` : ""}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(row.box1TaxableIncome, "EUR")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(row.aggregateIncome, "EUR")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(row.finalTaxAndSocialInsurance, "EUR")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(row.payrollTaxWithheld, "EUR")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(row.totalTaxCredits, "EUR")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span
                        className={
                          row.outcomeType === "payable"
                            ? "text-destructive"
                            : "text-emerald-600 dark:text-emerald-400"
                        }
                      >
                        {row.outcomeType === "payable" ? "−" : "+"}
                        {formatCurrency(row.settlementAmount, "EUR")}
                      </span>
                      {row.collectionThresholdRelief > 0 ? (
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(row.collectionThresholdRelief, "EUR")} below threshold
                        </div>
                      ) : null}
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
