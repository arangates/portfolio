import { createDb } from "@portfolio/db";
import * as schema from "@portfolio/db/schema/auth";
import { env } from "@portfolio/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

export const googleAuthEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

export function createAuth() {
  if (Boolean(env.GOOGLE_CLIENT_ID) !== Boolean(env.GOOGLE_CLIENT_SECRET)) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured together");
  }

  const db = createDb();

  return betterAuth({
    appName: "Selvam",
    database: drizzleAdapter(db, {
      provider: "pg",

      schema: schema,
    }),
    trustedOrigins: [env.CORS_ORIGIN],
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
      enabled: true,
      window: 60,
      max: 100,
      storage: "database",
    },
    advanced: {
      useSecureCookies: env.NODE_ENV === "production",
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    plugins: [nextCookies()],
  });
}

export const auth = createAuth();
