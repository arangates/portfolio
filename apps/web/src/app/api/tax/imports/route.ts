import { processIncomeTaxImport } from "@portfolio/api/income-tax-import";
import { auth } from "@portfolio/auth";
import { headers } from "next/headers";

import { archiveImportedFile } from "@/lib/google-drive-archive";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File))
      return Response.json({ error: "Select one ITR JSON file" }, { status: 400 });
    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return Response.json({ error: `${file.name} must be smaller than 10 MB` }, { status: 413 });
    }
    const hasControlCharacters = [...file.name].some((character) => character.charCodeAt(0) < 32);
    if (!file.name.toLowerCase().endsWith(".json") || hasControlCharacters) {
      return Response.json(
        { error: "Only JSON exports from the Indian income-tax portal are supported" },
        { status: 415 },
      );
    }

    const name = file.name.replace(/^.*[\\/]/, "").slice(0, 255);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await processIncomeTaxImport({
      userId: session.user.id,
      file: {
        name,
        type: file.type,
        bytes: bytes.slice(),
      },
    });
    const archive = await archiveImportedFile({
      userId: session.user.id,
      sourceType: "india_income_tax",
      sourceId: result.importId,
      fileName: name,
      mimeType: file.type,
      bytes,
    });
    return Response.json({ result: { ...result, archive } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ITR import failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
