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
  reminderHour: integer("reminder_hour").default(8).notNull(),
  daysAhead: integer("days_ahead").default(3).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

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
