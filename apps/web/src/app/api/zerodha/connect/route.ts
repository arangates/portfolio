import { getKiteLoginUrl } from "@portfolio/api/kite-client";
import { auth } from "@portfolio/auth";
import { env } from "@portfolio/env/server";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const redirectUrl = `${env.BETTER_AUTH_URL}/api/zerodha/callback`;
  const loginUrl = getKiteLoginUrl(redirectUrl);
  return Response.redirect(loginUrl);
}
