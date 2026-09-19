import { GoogleDriveArchiveCard } from "@/components/google-drive-archive-card";
import { PageHeader } from "@/components/page-header";
import { TableCard } from "@/components/table-card";
import { UploadDialog } from "@/components/upload-dialog";
import { driveArchiveSourceLabel } from "@/lib/drive-archive-shared";
import { getDriveArchiveState } from "@/lib/google-drive-archive";
import { getSourceDocumentHistory } from "@/lib/source-document-history";
import Link from "next/link";
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
import { DownloadIcon, ExternalLinkIcon } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const rawPage = Number((await searchParams).page ?? 1);
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, 100000) : 1;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const [archive, imports] = await Promise.all([
    getDriveArchiveState(session.user.id),
    getSourceDocumentHistory(session.user.id, page),
  ]);
  const summary = {
    available: archive.available,
    connected: archive.connected,
    refreshReady: archive.refreshReady,
    enabled: archive.enabled,
    rootFolderReady: archive.rootFolderReady,
    documentCount: archive.documentCount,
    storedCount: archive.storedCount,
    failedCount: archive.failedCount,
  };

  return (
    <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col">
      <div className="flex flex-col gap-4 py-4 sm:py-5 md:gap-5 md:py-6">
        <PageHeader
          title="Source documents"
          description="Import provenance, processing results and exact source files stored privately in your Google Drive."
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
        <div className="grid min-w-0 gap-4 px-4 lg:px-6 xl:grid-cols-2">
          <GoogleDriveArchiveCard summary={summary} />
        </div>
        <div className="min-w-0 px-4 lg:px-6">
          <TableCard
            title="Imports and source files"
            description="All supported import types, with processing and Drive storage tracked separately. Re-import the original file to retry a failed import or archive."
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imported</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Import</TableHead>
                  <TableHead>Drive archive</TableHead>
                  <TableHead className="text-right">Rows / New / Skipped</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {imports.documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                      No imports on this page. Import a source file from its feature page to get
                      started.
                    </TableCell>
                  </TableRow>
                ) : (
                  imports.documents.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(document.createdAt).toLocaleString("en-GB")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {driveArchiveSourceLabel(document.sourceType)}
                      </TableCell>
                      <TableCell className="max-w-72 truncate" title={document.fileName}>
                        {document.fileName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={document.importStatus === "failed" ? "destructive" : "secondary"}
                        >
                          {document.importStatus ?? "No import record"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={document.archiveStatus === "failed" ? "destructive" : "outline"}
                        >
                          {document.archiveStatus ?? "Not archived"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {document.rowCount == null
                          ? "—"
                          : `${document.rowCount} / ${document.insertedRows ?? 0} / ${document.skippedRows ?? 0}`}
                      </TableCell>
                      <TableCell className="text-right">
                        {document.archiveStatus === "stored" && document.archiveId ? (
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              nativeButton={false}
                              render={
                                <a
                                  href={`/api/google-drive/documents/${document.archiveId}/open`}
                                  target="_blank"
                                  aria-label={`Open ${document.fileName} in Google Drive`}
                                />
                              }
                            >
                              <ExternalLinkIcon />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              nativeButton={false}
                              render={
                                <a
                                  href={`/api/google-drive/documents/${document.archiveId}/download`}
                                  aria-label={`Download ${document.fileName}`}
                                />
                              }
                            >
                              <DownloadIcon />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Original file required
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableCard>
          <nav
            aria-label="Import history pages"
            className="mt-4 flex items-center justify-between text-sm"
          >
            {page > 1 ? (
              <Link href={`/dashboard/documents?page=${page - 1}`}>Previous</Link>
            ) : (
              <span />
            )}
            <span>Page {page}</span>
            {imports.hasNext ? (
              <Link href={`/dashboard/documents?page=${page + 1}`}>Next</Link>
            ) : (
              <span />
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}
