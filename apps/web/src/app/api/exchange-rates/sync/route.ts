import { syncEurInrExchangeRates } from "@portfolio/api/exchange-rate-sync";
import { auth } from "@portfolio/auth";
import { headers } from "next/headers";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    return Response.json({ result: await syncEurInrExchangeRates(session.user.id) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Exchange-rate sync failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
