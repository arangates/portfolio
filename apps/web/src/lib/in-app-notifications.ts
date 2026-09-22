import "server-only";

import { db, inAppNotification, notificationPreference } from "@portfolio/db";
import { and, desc, eq, isNull, sql } from "drizzle-orm";

export type InAppNotification = {
  id: string;
  title: string;
  body: string;
  url: string;
  readAt: string | null;
  createdAt: string;
};

export async function listInAppNotifications(userId: string) {
  const rows = await db
    .select()
    .from(inAppNotification)
    .where(and(eq(inAppNotification.userId, userId), isNull(inAppNotification.archivedAt)))
    .orderBy(desc(inAppNotification.createdAt))
    .limit(50);
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    url: row.url,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function getUnreadInAppCount(userId: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(inAppNotification)
    .where(
      and(
        eq(inAppNotification.userId, userId),
        isNull(inAppNotification.readAt),
        isNull(inAppNotification.archivedAt),
      ),
    );
  return row?.count ?? 0;
}

export async function markInAppNotificationRead(userId: string, id: string) {
  await db
    .update(inAppNotification)
    .set({ readAt: new Date() })
    .where(and(eq(inAppNotification.userId, userId), eq(inAppNotification.id, id)));
}

export async function archiveInAppNotifications(userId: string) {
  await db
    .update(inAppNotification)
    .set({ archivedAt: new Date() })
    .where(and(eq(inAppNotification.userId, userId), isNull(inAppNotification.archivedAt)));
}

export async function createReminderNotification(
  userId: string,
  input: { deliveryKey: string; title: string; body: string; url: string },
) {
  const [preference] = await db
    .select({ enabled: notificationPreference.inAppEnabled })
    .from(notificationPreference)
    .where(eq(notificationPreference.userId, userId))
    .limit(1);
  if (preference?.enabled === false) return;
  await db
    .insert(inAppNotification)
    .values({ userId, ...input })
    .onConflictDoNothing();
}
