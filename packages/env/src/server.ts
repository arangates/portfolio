import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const runtimeEnv = {
  ...process.env,
  BETTER_AUTH_URL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : (process.env.V0_RUNTIME_URL ?? "http://localhost:3001")),
  CORS_ORIGIN:
    process.env.CORS_ORIGIN ??
    (process.env.V0_RUNTIME_URL
      ? process.env.V0_RUNTIME_URL
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3001"),
};

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    DATABASE_URL_DIRECT: z.string().min(1).optional(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CORS_ORIGIN: z.url(),
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },
  runtimeEnv,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
