import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const documentArchiveSetting = pgTable("document_archive_setting", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  enabled: boolean("enabled").default(true).notNull(),
  rootFolderId: text("root_folder_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const documentArchive = pgTable(
  "document_archive",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sourceType: text("source_type").notNull(),
    sourceId: text("source_id").notNull(),
    fileName: text("file_name").notNull(),
    fileHash: text("file_hash").notNull(),
    mimeType: text("mime_type").notNull(),
    fileSize: integer("file_size").notNull(),
    provider: text("provider").default("google_drive").notNull(),
    providerFileId: text("provider_file_id"),
    providerFolderId: text("provider_folder_id"),
    status: text("status").default("processing").notNull(),
    errorMessage: text("error_message"),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("document_archive_user_source_uidx").on(
      table.userId,
      table.sourceType,
      table.sourceId,
    ),
    uniqueIndex("document_archive_id_user_uidx").on(table.id, table.userId),
    index("document_archive_user_created_idx").on(table.userId, table.createdAt),
    index("document_archive_user_hash_idx").on(table.userId, table.fileHash),
  ],
);
