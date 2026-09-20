import { index, jsonb, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const aiProviderCredential = pgTable(
  "ai_provider_credential",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    encryptedKey: text("encrypted_key").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.provider], name: "ai_provider_credential_pk" }),
  ],
);

export const aiChatThread = pgTable(
  "ai_chat_thread",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("New chat"),
    provider: text("provider").notNull().default("openai"),
    model: text("model").notNull().default("gpt-4.1-mini"),
    messages: jsonb("messages")
      .$type<
        Array<{
          id: string;
          role: "user" | "assistant";
          parts: Array<{ type: "text"; text: string }>;
        }>
      >()
      .notNull()
      .default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("ai_chat_thread_user_updated_idx").on(table.userId, table.updatedAt)],
);
