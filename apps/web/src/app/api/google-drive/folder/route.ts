import { auth } from "@portfolio/auth";
import { headers } from "next/headers";

import { getDriveRootFolderUrl } from "@/lib/google-drive-archive";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const url = await getDriveRootFolderUrl(session.user.id);
  if (!url) return Response.json({ error: "Archive folder is not initialized" }, { status: 404 });
  return Response.redirect(url, 302);
}
