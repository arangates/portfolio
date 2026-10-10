import { syncZerodhaPortfolio } from "@portfolio/api/zerodha-sync";
import { auth } from "@portfolio/auth";
import { headers } from "next/headers";
import { revalidateTag } from "next/cache";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await syncZerodhaPortfolio(session.user.id);
    revalidateTag("portfolio", { expire: 0 });
    revalidateTag("returns", { expire: 0 });
    return Response.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Zerodha sync failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
