import { auth } from "@portfolio/auth";
import { headers } from "next/headers";

import { getDriveDocument } from "@/lib/google-drive-archive";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const document = await getDriveDocument(session.user.id, id);
  if (!document || document.status !== "stored" || !document.providerFileId) {
    return Response.json({ error: "Archived document not found" }, { status: 404 });
  }
  return Response.redirect(
    `https://drive.google.com/open?id=${encodeURIComponent(document.providerFileId)}`,
    302,
  );
}
