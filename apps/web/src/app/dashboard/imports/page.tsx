import { PageHeader } from "@/components/page-header";
import { EmptyDataState } from "@/components/empty-data-state";
import { TableCard } from "@/components/table-card";
import { UploadDialog } from "@/components/upload-dialog";
import { getRecentPortfolioImports } from "@portfolio/api/portfolio-import";
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
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DatabaseIcon } from "lucide-react";

function kindLabel(kind: string) {
  if (kind === "zerodha_holdings") return "Zerodha holdings";
  if (kind === "zerodha_tradebook") return "Zerodha tradebook";
  if (kind === "degiro_transactions") return "Degiro transactions";
  if (kind === "degiro_account") return "Degiro account";
  return kind;
}

export default async function ImportsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const imports = await getRecentPortfolioImports(session.user.id);

  return (
    <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col">
      <div className="flex flex-col gap-4 py-4 sm:py-5 md:gap-5 md:py-6">
        <PageHeader
          title="Import history"
          description="Every source file is retained with a SHA-256 fingerprint, raw rows, import counts, and completion status. Re-uploading the same file never duplicates portfolio history."
          action={
            <>
              <UploadDialog
                kind="zerodha_holdings"
                title="Import Zerodha holdings"
                description="Upload one holdings XLSX file."
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              />
              <UploadDialog
                kind="zerodha_tradebook"
                title="Import Zerodha tradebooks"
                description="Select annual tradebook XLSX files. Overlapping trades are deduplicated."
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                multiple
                triggerLabel="Import tradebooks"
              />
              <UploadDialog
                kind="degiro"
                title="Import Degiro exports"
                description="Select the Transactions and Account CSV files."
                accept=".csv,text/csv"
                multiple
              />
            </>
          }
        />
        <div className="px-4 lg:px-6">
          {imports.length === 0 ? (
            <EmptyDataState
              icon={DatabaseIcon}
              title="No imports yet"
              description="Import a Zerodha or Degiro export. Files and rows are isolated to this signed-in account."
              action={
                <UploadDialog
                  kind="zerodha_holdings"
                  title="Import Zerodha holdings"
                  description="Upload one holdings XLSX file."
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                />
              }
            />
          ) : (
            <TableCard title="Recent imports" description="Latest 20 archived source files.">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Imported</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Statement date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Rows</TableHead>
                    <TableHead className="text-right">New</TableHead>
                    <TableHead className="text-right">Skipped</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {imports.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.createdAt.toLocaleString("en-GB")}</TableCell>
                      <TableCell className="font-medium">{kindLabel(item.kind)}</TableCell>
                      <TableCell className="max-w-60 truncate">{item.fileName}</TableCell>
                      <TableCell>{item.statementDate ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === "completed" ? "secondary" : "outline"}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{item.rowCount}</TableCell>
                      <TableCell className="text-right tabular-nums">{item.insertedRows}</TableCell>
                      <TableCell className="text-right tabular-nums">{item.skippedRows}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableCard>
          )}
        </div>
      </div>
    </div>
  );
}
