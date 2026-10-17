import { auth, SOVEREIGN_SESSION } from "@portfolio/auth";
import { isSovereignMode, SOVEREIGN_DEFAULT_USER } from "@portfolio/db";
import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse, type NextRequest } from "next/server";

const handlers = toNextJsHandler(auth);

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const isGetSession = url.pathname.endsWith("/get-session") || url.pathname.endsWith("/session");

  if (isSovereignMode() && isGetSession) {
    const res = await handlers.GET(request);
    if (res.status === 200) {
      try {
        const data = await res.clone().json();
        if (data && data.user) return res;
      } catch {
        // Fall back to sovereign session
      }
    }

    return NextResponse.json({
      session: SOVEREIGN_SESSION,
      user: {
        id: SOVEREIGN_DEFAULT_USER.id,
        name: SOVEREIGN_DEFAULT_USER.name,
        email: SOVEREIGN_DEFAULT_USER.email,
        emailVerified: SOVEREIGN_DEFAULT_USER.emailVerified,
        image: null,
        createdAt: SOVEREIGN_SESSION.createdAt,
        updatedAt: SOVEREIGN_SESSION.updatedAt,
      },
    });
  }

  return handlers.GET(request);
}

export const POST = handlers.POST;
