import { createDb, isSovereignMode, SOVEREIGN_DEFAULT_USER } from "@portfolio/db";
import * as schema from "@portfolio/db/schema/auth";
import { env } from "@portfolio/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

export const googleAuthEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

export const SOVEREIGN_SESSION = {
  id: "sovereign-session-id",
  userId: SOVEREIGN_DEFAULT_USER.id,
  expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  token: "sovereign-session-token",
  createdAt: new Date(),
  updatedAt: new Date(),
  ipAddress: "127.0.0.1",
  userAgent: "Selvam Sovereign Local",
};

export function createAuth() {
  if (Boolean(env.GOOGLE_CLIENT_ID) !== Boolean(env.GOOGLE_CLIENT_SECRET)) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured together");
  }

  const db = createDb();

  const baseAuth = betterAuth({
    appName: "Selvam",
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: schema,
    }),
    trustedOrigins: [env.CORS_ORIGIN, "https://*.vercel.app"],
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
    },
    session: {
      // A persistent rolling session: active users remain signed in across browser restarts.
      expiresIn: 60 * 60 * 24 * 365,
      updateAge: 60 * 60 * 24,
      freshAge: 60 * 30,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5,
      },
    },
    user: {
      deleteUser: { enabled: true },
    },
    account: {
      // Better Auth can read existing plaintext tokens and encrypts every new token write.
      encryptOAuthTokens: true,
    },
    socialProviders: googleAuthEnabled
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID!,
            clientSecret: env.GOOGLE_CLIENT_SECRET!,
            // Drive access is requested incrementally in Settings. Offline access lets the
            // archive continue after Google's short-lived access token expires.
            accessType: "offline",
          },
        }
      : {},
    rateLimit: {
      enabled: !isSovereignMode(),
      window: 60,
      max: 100,
      storage: "database",
    },
    advanced: {
      useSecureCookies: env.NODE_ENV === "production" && !isSovereignMode(),
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    plugins: [nextCookies()],
  });

  if (isSovereignMode()) {
    const originalGetSession = baseAuth.api.getSession.bind(baseAuth.api);
    baseAuth.api.getSession = (async (context?: any) => {
      try {
        const session = await originalGetSession(context);
        if (session?.user) return session;
      } catch {
        // Fall back to sovereign user when running offline or zero-cookie
      }
      return {
        session: SOVEREIGN_SESSION,
        user: {
          id: SOVEREIGN_DEFAULT_USER.id,
          name: SOVEREIGN_DEFAULT_USER.name,
          email: SOVEREIGN_DEFAULT_USER.email,
          emailVerified: SOVEREIGN_DEFAULT_USER.emailVerified,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      } as any;
    }) as any;
  }

  return baseAuth;
}

export const auth = createAuth();

export * from "./vault";
