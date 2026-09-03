import { importManualData, parseManualDataFile } from "@portfolio/api/manual-data-portability";
import { auth } from "@portfolio/auth";
import { headers } from "next/headers";

const MAX_FILE_BYTES = 15 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return Response.json({ error: "Choose an XLSX or CSV export" }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return Response.json({ error: "The maximum import size is 15 MB" }, { status: 413 });
    }
    const rows = await parseManualDataFile({
      name: file.name,
      bytes: new Uint8Array(await file.arrayBuffer()),
    });
    const result = await importManualData(session.user.id, rows);
    return Response.json({ result });
  } catch (error) {
    const raw = error instanceof Error ? error.message : "Could not import manual data";
    const message = raw.startsWith("Failed query:")
      ? "The import conflicts with an existing record. No records are ever deleted by this import."
      : raw;
    return Response.json({ error: message }, { status: 400 });
  }
}
