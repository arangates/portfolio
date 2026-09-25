import { processBankStatementImport } from "@portfolio/api/bank-statement-import";
import { auth } from "@portfolio/auth";
import { headers } from "next/headers";
import { revalidateTag } from "next/cache";
import { z } from "zod";

import { archiveImportedFile } from "@/lib/google-drive-archive";

export const runtime = "nodejs";
export const maxDuration = 60;
const MAX_FILE_SIZE = 15 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const ownershipType = z.enum(["personal", "joint"]).parse(formData.get("ownershipType"));
    if (!(file instanceof File))
      return Response.json({ error: "Select a bank statement" }, { status: 400 });
    const extension = file.name.toLowerCase().split(".").at(-1);
    if (!file.size || file.size > MAX_FILE_SIZE || !["pdf", "csv"].includes(extension ?? ""))
      return Response.json(
        { error: `${file.name} must be a PDF or CSV smaller than 15 MB` },
        { status: 415 },
      );
    const name = file.name.replace(/^.*[\\/]/, "").slice(0, 255);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await processBankStatementImport({
      userId: session.user.id,
      ownershipType,
      file: { name, type: file.type, bytes: bytes.slice() },
    });
    const archive = await archiveImportedFile({
      userId: session.user.id,
      sourceType: "bank_statement",
      sourceId: result.importId,
      fileName: name,
      mimeType: file.type || (extension === "pdf" ? "application/pdf" : "text/csv"),
      bytes,
    });
    revalidateTag("cashflow", { expire: 0 });
    revalidateTag("household", { expire: 0 });
    revalidateTag("portfolio", { expire: 0 });
    return Response.json({ result: { ...result, archive } });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "";
    const message = /(?:Failed query:|insert into|update .* set|delete from)/i.test(rawMessage)
      ? "The statement was read, but its transactions could not be saved. No raw database details were exposed; please retry after updating the application."
      : rawMessage || "Bank statement import failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
