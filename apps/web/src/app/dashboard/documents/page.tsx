import { GoogleDriveArchiveCard } from "@/components/google-drive-archive-card";
import { PageHeader } from "@/components/page-header";
import { TableCard } from "@/components/table-card";
import { driveArchiveSourceLabel } from "@/lib/drive-archive-shared";
import { getDriveArchiveState } from "@/lib/google-drive-archive";
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

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DocumentsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const archive = await getDriveArchiveState(session.user.id);
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
          description="Exact source files stored privately in your Google Drive, linked to account-scoped import history."
        />
        <div className="grid min-w-0 gap-4 px-4 lg:px-6 xl:grid-cols-2">
          <GoogleDriveArchiveCard summary={summary} />
        </div>
        <div className="min-w-0 px-4 lg:px-6">
          <TableCard
            title="Archived documents"
            description="Latest 100 files. Failed archives can be retried by importing the same source file again."
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imported</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archive.documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                      Connect Drive, then import a supported source file to create the first
                      archive.
                    </TableCell>
                  </TableRow>
                ) : (
                  archive.documents.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell className="whitespace-nowrap">
                        {(document.uploadedAt ?? document.createdAt).toLocaleString("en-GB")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {driveArchiveSourceLabel(document.sourceType)}
                      </TableCell>
                      <TableCell className="max-w-72 truncate" title={document.fileName}>
                        {document.fileName}
                      </TableCell>
                      <TableCell>
                        <Badge variant={document.status === "stored" ? "secondary" : "outline"}>
                          {document.status === "stored" ? "Stored" : "Needs attention"}
                        </Badge>
                        {document.errorMessage ? (
                          <p className="mt-1 max-w-72 text-xs text-muted-foreground">
                            {document.errorMessage}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatSize(document.fileSize)}
                      </TableCell>
                      <TableCell className="text-right">
                        {document.status === "stored" ? (
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              nativeButton={false}
                              render={
                                <a
                                  href={`/api/google-drive/documents/${document.id}/open`}
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
                                  href={`/api/google-drive/documents/${document.id}/download`}
                                  aria-label={`Download ${document.fileName}`}
                                />
                              }
                            >
                              <DownloadIcon />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Re-import to retry</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableCard>
        </div>
      </div>
    </div>
  );
}
