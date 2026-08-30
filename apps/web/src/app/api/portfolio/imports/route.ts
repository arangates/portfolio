import { getRecentPortfolioImports, processPortfolioImport } from "@portfolio/api/portfolio-import";
import { auth } from "@portfolio/auth";
import { headers } from "next/headers";
import { z } from "zod";

import { archiveImportedFile, type ArchiveSourceType } from "@/lib/google-drive-archive";

const kindSchema = z.enum(["zerodha_holdings", "zerodha_tradebook", "degiro"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ imports: await getRecentPortfolioImports(session.user.id) });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const kind = kindSchema.parse(formData.get("kind"));
    const files = formData.getAll("files").filter((value): value is File => value instanceof File);
    if (files.length === 0) {
      return Response.json({ error: "Select at least one file" }, { status: 400 });
    }
    const maxFiles = kind === "zerodha_holdings" ? 1 : kind === "zerodha_tradebook" ? 10 : 2;
    if (files.length > maxFiles) {
      return Response.json({ error: "Too many files selected" }, { status: 400 });
    }
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return Response.json(
          { error: `${file.name} is larger than the 10 MB limit` },
          { status: 413 },
        );
      }
      const lowerName = file.name.toLowerCase();
      const validExtension =
        kind === "degiro" ? lowerName.endsWith(".csv") : lowerName.endsWith(".xlsx");
      const hasControlCharacters = [...file.name].some((character) => character.charCodeAt(0) < 32);
      if (!validExtension || hasControlCharacters) {
        return Response.json({ error: `Unsupported file: ${file.name}` }, { status: 415 });
      }
    }

    const importFiles = await Promise.all(
      files.map(async (file) => ({
        name: file.name.replace(/^.*[\\/]/, "").slice(0, 255),
        type: file.type,
        bytes: new Uint8Array(await file.arrayBuffer()),
      })),
    );
    const results = await processPortfolioImport({
      userId: session.user.id,
      kind,
      // Some parsers transfer or mutate buffers. Keep the exact upload bytes for Drive.
      files: importFiles.map((file) => ({ ...file, bytes: file.bytes.slice() })),
    });
    const resultsWithArchive = await Promise.all(
      results.map(async (result, index) => {
        const file = importFiles[index];
        if (!file) return { ...result, archive: { status: "failed" as const } };
        const archive = await archiveImportedFile({
          userId: session.user.id,
          sourceType: result.kind as ArchiveSourceType,
          sourceId: result.batchId,
          fileName: file.name,
          mimeType: file.type,
          bytes: file.bytes,
        });
        return { ...result, archive };
      }),
    );
    return Response.json({ results: resultsWithArchive });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
