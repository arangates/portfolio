import { auth } from "@portfolio/auth";
import { headers } from "next/headers";

import { fetchDriveDocumentContent } from "@/lib/google-drive-archive";

function contentDisposition(fileName: string) {
  const ascii = fileName.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await context.params;
    const result = await fetchDriveDocumentContent(session.user.id, id);
    if (!result) return Response.json({ error: "Archived document not found" }, { status: 404 });
    return new Response(result.response.body, {
      headers: {
        "Content-Type": result.document.mimeType,
        "Content-Length": String(result.document.fileSize),
        "Content-Disposition": contentDisposition(result.document.fileName),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json(
      { error: "The document could not be downloaded from Google Drive" },
      { status: 502 },
    );
  }
}
