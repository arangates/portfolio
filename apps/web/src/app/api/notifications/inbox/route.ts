import { auth } from "@portfolio/auth";
import { headers } from "next/headers";
import { z } from "zod";

import {
  archiveInAppNotifications,
  getUnreadInAppCount,
  listInAppNotifications,
  markInAppNotificationRead,
} from "@/lib/in-app-notifications";

async function currentUser() {
  return (await auth.api.getSession({ headers: await headers() }))?.user ?? null;
}

export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({
    notifications: await listInAppNotifications(user.id),
    unread: await getUnreadInAppCount(user.id),
  });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = z
    .object({ action: z.enum(["read", "archive-all"]), id: z.uuid().optional() })
    .safeParse(await request.json());
  if (!body.success || (body.data.action === "read" && !body.data.id))
    return Response.json({ error: "Invalid notification action" }, { status: 400 });
  if (body.data.action === "read") await markInAppNotificationRead(user.id, body.data.id!);
  else await archiveInAppNotifications(user.id);
  return Response.json({ unread: await getUnreadInAppCount(user.id) });
}
