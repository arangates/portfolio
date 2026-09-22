import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { aiProviderCredential, db } from "@portfolio/db";
import { env } from "@portfolio/env/server";
import { and, eq } from "drizzle-orm";

export type AIProvider = "openai" | "google" | "anthropic" | "opencode" | "mistral";

const encryptionKey = () =>
  createHash("sha256")
    .update("selvam:ai-provider-credential:v1:")
    .update(env.BETTER_AUTH_SECRET)
    .digest();

function encrypt(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

function decrypt(value: string) {
  const [version, iv, tag, ciphertext] = value.split(".");
  if (version !== "v1" || !iv || !tag || !ciphertext)
    throw new Error("Credential format is invalid");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export async function providerStatus(userId: string) {
  const rows = await db
    .select({
      provider: aiProviderCredential.provider,
      encryptedKey: aiProviderCredential.encryptedKey,
    })
    .from(aiProviderCredential)
    .where(eq(aiProviderCredential.userId, userId));
  const valid = (provider: AIProvider) =>
    rows.some((row) => {
      if (row.provider !== provider) return false;
      try {
        return decrypt(row.encryptedKey).length >= 8;
      } catch {
        return false;
      }
    });
  return {
    openai: valid("openai"),
    google: valid("google"),
    anthropic: valid("anthropic"),
    opencode: valid("opencode"),
    mistral: valid("mistral"),
  };
}

export async function saveProviderKey(userId: string, provider: AIProvider, key: string) {
  const encryptedKey = encrypt(key);
  await db
    .insert(aiProviderCredential)
    .values({ userId, provider, encryptedKey })
    .onConflictDoUpdate({
      target: [aiProviderCredential.userId, aiProviderCredential.provider],
      set: { encryptedKey, updatedAt: new Date() },
    });
}

export async function removeProviderKey(userId: string, provider: AIProvider) {
  await db
    .delete(aiProviderCredential)
    .where(
      and(eq(aiProviderCredential.userId, userId), eq(aiProviderCredential.provider, provider)),
    );
}

export async function getProviderKey(userId: string, provider: AIProvider) {
  const [row] = await db
    .select({ encryptedKey: aiProviderCredential.encryptedKey })
    .from(aiProviderCredential)
    .where(
      and(eq(aiProviderCredential.userId, userId), eq(aiProviderCredential.provider, provider)),
    )
    .limit(1);
  return row ? decrypt(row.encryptedKey) : null;
}
