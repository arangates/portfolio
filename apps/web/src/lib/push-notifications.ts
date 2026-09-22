import "server-only";

import { getFinancialCalendar } from "@portfolio/api/calendar-queries";
import {
  db,
  notificationPreference,
  portfolioPreference,
  pushDelivery,
  pushSubscription,
} from "@portfolio/db";
import { env } from "@portfolio/env/server";
import { and, eq, or } from "drizzle-orm";

import { createReminderNotification } from "@/lib/in-app-notifications";
import * as webPush from "web-push";

type BrowserSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export type NotificationSettings = {
  configured: boolean;
  publicKey: string | null;
  enabled: boolean;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  reminderHour: number;
  daysAhead: number;
  subscriptionCount: number;
};

function pushConfigured() {
  return Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_SUBJECT);
}

function configureWebPush() {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT) {
    throw new Error("Push notifications are not configured");
  }
  webPush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
}

export async function getNotificationSettings(userId: string): Promise<NotificationSettings> {
  const [preference, subscriptions] = await Promise.all([
    db.query.notificationPreference.findFirst({
      where: eq(notificationPreference.userId, userId),
    }),
    db
      .select({ id: pushSubscription.id })
      .from(pushSubscription)
      .where(eq(pushSubscription.userId, userId)),
  ]);
  return {
    configured: pushConfigured(),
    publicKey: env.VAPID_PUBLIC_KEY ?? null,
    enabled: preference?.enabled ?? true,
    inAppEnabled: preference?.inAppEnabled ?? true,
    pushEnabled: preference?.pushEnabled ?? true,
    emailEnabled: preference?.emailEnabled ?? false,
    reminderHour: preference?.reminderHour ?? 8,
    daysAhead: preference?.daysAhead ?? 3,
    subscriptionCount: subscriptions.length,
  };
}

export async function savePushSubscription(
  userId: string,
  subscription: BrowserSubscription,
  userAgent?: string | null,
) {
  await db
    .insert(pushSubscription)
    .values({
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: userAgent?.slice(0, 500),
    })
    .onConflictDoUpdate({
      target: pushSubscription.endpoint,
      set: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: userAgent?.slice(0, 500),
        updatedAt: new Date(),
      },
    });
  await db
    .insert(notificationPreference)
    .values({ userId, enabled: true, pushEnabled: true })
    .onConflictDoUpdate({
      target: notificationPreference.userId,
      set: { enabled: true, pushEnabled: true, updatedAt: new Date() },
    });
}

export async function removePushSubscription(userId: string, endpoint: string) {
  await db
    .delete(pushSubscription)
    .where(and(eq(pushSubscription.userId, userId), eq(pushSubscription.endpoint, endpoint)));
}

export async function saveNotificationPreference(
  userId: string,
  input: {
    enabled: boolean;
    inAppEnabled: boolean;
    pushEnabled: boolean;
    emailEnabled: boolean;
    reminderHour: number;
    daysAhead: number;
  },
) {
  await db
    .insert(notificationPreference)
    .values({ userId, ...input })
    .onConflictDoUpdate({
      target: notificationPreference.userId,
      set: { ...input, updatedAt: new Date() },
    });
}

function dateInTimeZone(now: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function hourInTimeZone(now: Date, timeZone: string) {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(now),
  );
}

function addDays(day: string, count: number) {
  const date = new Date(`${day}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

async function plannedEvents(userId: string, today: string, daysAhead: number) {
  const finalDay = addDays(today, daysAhead);
  const months = new Set([today.slice(0, 7), finalDay.slice(0, 7)]);
  const calendars = await Promise.all(
    [...months].map((month) => getFinancialCalendar(userId, month)),
  );
  return calendars
    .flatMap((calendar) => calendar.events)
    .filter(
      (event) =>
        event.planned && event.precision === "day" && event.date >= today && event.date <= finalDay,
    )
    .toSorted((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}

function reminderPayload(
  today: string,
  events: Awaited<ReturnType<typeof plannedEvents>>,
  daysAhead: number,
) {
  const dueToday = events.filter((event) => event.date === today);
  const first = events[0];
  const title = dueToday.length
    ? `${dueToday.length} financial ${dueToday.length === 1 ? "reminder" : "reminders"} today`
    : `${events.length} upcoming financial ${events.length === 1 ? "event" : "events"}`;
  const body = events
    .slice(0, 3)
    .map((event) => `${event.date === today ? "Today" : event.date}: ${event.title}`)
    .join(" · ");
  return JSON.stringify({
    title,
    body: events.length > 3 ? `${body} · +${events.length - 3} more` : body,
    url: first?.href ?? "/dashboard/calendar",
    tag: `financial-reminders-${today}`,
    daysAhead,
  });
}

async function sendToSubscription(
  row: typeof pushSubscription.$inferSelect,
  payload: string,
  deliveryKey?: string,
) {
  let claimed = false;
  if (deliveryKey) {
    const inserted = await db
      .insert(pushDelivery)
      .values({ subscriptionId: row.id, deliveryKey })
      .onConflictDoNothing()
      .returning({ id: pushDelivery.id });
    if (!inserted[0]) return "skipped" as const;
    claimed = true;
  }
  try {
    configureWebPush();
    await webPush.sendNotification(
      { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
      payload,
      { TTL: 60 * 60 * 12, urgency: "normal" },
    );
    return "sent" as const;
  } catch (error) {
    const statusCode =
      typeof error === "object" && error && "statusCode" in error
        ? Number(error.statusCode)
        : undefined;
    if (statusCode === 404 || statusCode === 410) {
      await db.delete(pushSubscription).where(eq(pushSubscription.id, row.id));
      return "expired" as const;
    }
    if (claimed)
      await db
        .delete(pushDelivery)
        .where(
          and(eq(pushDelivery.subscriptionId, row.id), eq(pushDelivery.deliveryKey, deliveryKey!)),
        );
    throw error;
  }
}

export async function sendTestNotification(userId: string) {
  const subscriptions = await db
    .select()
    .from(pushSubscription)
    .where(eq(pushSubscription.userId, userId));
  if (subscriptions.length === 0) throw new Error("Enable notifications on this device first");
  const payload = JSON.stringify({
    title: "Selvam notifications are ready",
    body: "You’ll receive reminders for upcoming bills, contract endings and deposit maturities.",
    url: "/dashboard/calendar",
    tag: "push-test",
  });
  const results = await Promise.allSettled(
    subscriptions.map((subscription) => sendToSubscription(subscription, payload)),
  );
  if (!results.some((result) => result.status === "fulfilled" && result.value === "sent"))
    throw new Error("The test notification could not be delivered");
  return { sent: results.filter((result) => result.status === "fulfilled").length };
}

export async function sendScheduledReminders(now = new Date()) {
  const preferences = await db
    .select({
      userId: notificationPreference.userId,
      reminderHour: notificationPreference.reminderHour,
      daysAhead: notificationPreference.daysAhead,
      timeZone: portfolioPreference.timeZone,
    })
    .from(notificationPreference)
    .leftJoin(portfolioPreference, eq(portfolioPreference.userId, notificationPreference.userId))
    .where(
      or(
        eq(notificationPreference.pushEnabled, true),
        eq(notificationPreference.inAppEnabled, true),
      ),
    );

  let sent = 0;
  let expired = 0;
  let failed = 0;
  for (const preference of preferences) {
    const timeZone = preference.timeZone ?? "UTC";
    if (hourInTimeZone(now, timeZone) !== preference.reminderHour) continue;
    try {
      const subscriptions = await db
        .select()
        .from(pushSubscription)
        .where(eq(pushSubscription.userId, preference.userId));
      const today = dateInTimeZone(now, timeZone);
      const events = await plannedEvents(preference.userId, today, preference.daysAhead);
      if (events.length === 0) continue;
      const payload = reminderPayload(today, events, preference.daysAhead);
      const parsedPayload = JSON.parse(payload) as { title: string; body: string; url: string };
      await createReminderNotification(preference.userId, {
        deliveryKey: `reminders:${today}`,
        title: parsedPayload.title,
        body: parsedPayload.body,
        url: parsedPayload.url,
      });
      if (subscriptions.length === 0 || !pushConfigured()) continue;
      const results = await Promise.allSettled(
        subscriptions.map((subscription) =>
          sendToSubscription(subscription, payload, `reminders:${today}`),
        ),
      );
      for (const result of results) {
        if (result.status === "rejected") failed += 1;
        else if (result.value === "sent") sent += 1;
        else if (result.value === "expired") expired += 1;
      }
    } catch (error) {
      failed += 1;
      console.error("Could not prepare push reminders for a user", error);
    }
  }
  return { sent, expired, failed };
}
