import { processNetherlandsTaxImport } from "@portfolio/api/netherlands-tax-import";
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
    const taxpayerMemberValue = formData.get("taxpayerMemberId");
    const taxpayerMemberId =
      typeof taxpayerMemberValue === "string" && taxpayerMemberValue !== "owner"
        ? taxpayerMemberValue
        : null;
    if (!(file instanceof File)) {
      return Response.json({ error: "Select one final-assessment PDF" }, { status: 400 });
    }
    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return Response.json({ error: `${file.name} must be smaller than 10 MB` }, { status: 413 });
    }
    const hasControlCharacters = [...file.name].some((character) => character.charCodeAt(0) < 32);
    if (!file.name.toLowerCase().endsWith(".pdf") || hasControlCharacters) {
      return Response.json(
        { error: "Only Belastingdienst assessment PDFs are supported" },
        { status: 415 },
      );
    }
    const name = file.name.replace(/^.*[\\/]/, "").slice(0, 255);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await processNetherlandsTaxImport({
      userId: session.user.id,
      taxpayerMemberId,
      file: {
        name,
        type: file.type,
        bytes: bytes.slice(),
      },
    });
    const archive = await archiveImportedFile({
      userId: session.user.id,
      sourceType: "netherlands_income_tax",
      sourceId: result.importId,
      fileName: name,
      mimeType: file.type,
      bytes,
    });
    return Response.json({ result: { ...result, archive } });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Dutch assessment import failed" },
      { status: 400 },
    );
  }
}
