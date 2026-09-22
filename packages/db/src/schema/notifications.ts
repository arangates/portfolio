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

export const pushSubscription = pgTable(
  "push_subscription",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("push_subscription_endpoint_uidx").on(table.endpoint),
    index("push_subscription_user_idx").on(table.userId),
  ],
);

export const notificationPreference = pgTable("notification_preference", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  enabled: boolean("enabled").default(true).notNull(),
  inAppEnabled: boolean("in_app_enabled").default(true).notNull(),
  pushEnabled: boolean("push_enabled").default(true).notNull(),
  emailEnabled: boolean("email_enabled").default(false).notNull(),
  reminderHour: integer("reminder_hour").default(8).notNull(),
  daysAhead: integer("days_ahead").default(3).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const inAppNotification = pgTable(
  "in_app_notification",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    deliveryKey: text("delivery_key"),
    title: text("title").notNull(),
    body: text("body").notNull(),
    url: text("url").notNull().default("/dashboard"),
    readAt: timestamp("read_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("in_app_notification_user_created_idx").on(table.userId, table.createdAt),
    uniqueIndex("in_app_notification_delivery_uidx").on(table.userId, table.deliveryKey),
  ],
);

export const pushDelivery = pgTable(
  "push_delivery",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    subscriptionId: uuid("subscription_id")
      .notNull()
      .references(() => pushSubscription.id, { onDelete: "cascade" }),
    deliveryKey: text("delivery_key").notNull(),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("push_delivery_subscription_key_uidx").on(table.subscriptionId, table.deliveryKey),
    index("push_delivery_delivered_idx").on(table.deliveredAt),
  ],
);
