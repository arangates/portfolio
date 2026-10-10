import { createKiteSession } from "@portfolio/api/kite-client";
import { saveConnection } from "@portfolio/api/zerodha-sync";
import { auth } from "@portfolio/auth";
import { env } from "@portfolio/env/server";
import { headers } from "next/headers";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return Response.redirect(`${env.BETTER_AUTH_URL}/sign-in`);
  }

  const url = new URL(request.url);
  const requestToken = url.searchParams.get("request_token");
  const status = url.searchParams.get("status");

  if (status !== "success" || !requestToken) {
    const errorMessage = encodeURIComponent("Zerodha login was cancelled or failed");
    return Response.redirect(`${env.BETTER_AUTH_URL}/dashboard/tradebook?error=${errorMessage}`);
  }

  try {
    const kiteSession = await createKiteSession(requestToken);
    await saveConnection({
      userId: session.user.id,
      accessToken: kiteSession.access_token,
      publicToken: kiteSession.public_token ?? null,
      loginTime: new Date(kiteSession.login_time),
    });
    return Response.redirect(`${env.BETTER_AUTH_URL}/dashboard/tradebook?connected=true`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to connect Zerodha";
    const errorMessage = encodeURIComponent(message);
    return Response.redirect(`${env.BETTER_AUTH_URL}/dashboard/tradebook?error=${errorMessage}`);
  }
}
