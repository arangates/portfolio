import "server-only";

import { aiChatThread, db } from "@portfolio/db";
import { and, desc, eq } from "drizzle-orm";

export type StoredChatMessage = {
  id: string;
  role: "user" | "assistant";
  parts: Array<Record<string, unknown>>;
};

export async function listChatThreads(userId: string) {
  return db
    .select({
      id: aiChatThread.id,
      title: aiChatThread.title,
      provider: aiChatThread.provider,
      model: aiChatThread.model,
      updatedAt: aiChatThread.updatedAt,
    })
    .from(aiChatThread)
    .where(eq(aiChatThread.userId, userId))
    .orderBy(desc(aiChatThread.updatedAt))
    .limit(100);
}

export async function getChatThread(userId: string, id: string) {
  const [thread] = await db
    .select()
    .from(aiChatThread)
    .where(and(eq(aiChatThread.id, id), eq(aiChatThread.userId, userId)))
    .limit(1);
  return thread ?? null;
}

export async function createChatThread(userId: string) {
  const [thread] = await db.insert(aiChatThread).values({ userId }).returning();
  if (!thread) throw new Error("Could not create chat");
  return thread;
}

export async function deleteChatThread(userId: string, id: string) {
  return db
    .delete(aiChatThread)
    .where(and(eq(aiChatThread.id, id), eq(aiChatThread.userId, userId)))
    .returning({ id: aiChatThread.id });
}

export async function renameChatThread(userId: string, id: string, title: string) {
  return db
    .update(aiChatThread)
    .set({ title, updatedAt: new Date() })
    .where(and(eq(aiChatThread.id, id), eq(aiChatThread.userId, userId)))
    .returning({ id: aiChatThread.id });
}

export async function saveChatThread(
  userId: string,
  id: string,
  messages: StoredChatMessage[],
  provider: string,
  model: string,
) {
  const title =
    messages
      .find((message) => message.role === "user")
      ?.parts.map((part) => part.text)
      .join(" ")
      .slice(0, 70) || "New chat";
  await db
    .update(aiChatThread)
    .set({ messages: messages.slice(-100), provider, model, title, updatedAt: new Date() })
    .where(and(eq(aiChatThread.id, id), eq(aiChatThread.userId, userId)));
}
