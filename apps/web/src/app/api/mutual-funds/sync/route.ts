import { syncMutualFundNav } from "@portfolio/api/mutual-fund-sync";
import { auth } from "@portfolio/auth";
import { headers } from "next/headers";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await syncMutualFundNav(session.user.id);
    return Response.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "MFAPI sync failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
