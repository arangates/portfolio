import { auth } from "@portfolio/auth";
import { headers } from "next/headers";
import { z } from "zod";

import {
  getNotificationSettings,
  removePushSubscription,
  saveNotificationPreference,
  savePushSubscription,
  sendTestNotification,
} from "@/lib/push-notifications";

const endpoint = z.string().url().max(4_096);
const requestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("subscribe"),
    subscription: z.object({
      endpoint,
      keys: z.object({ p256dh: z.string().min(20), auth: z.string().min(8) }),
    }),
  }),
  z.object({ action: z.literal("unsubscribe"), endpoint }),
  z.object({
    action: z.literal("preferences"),
    enabled: z.boolean(),
    reminderHour: z.number().int().min(0).max(23),
    daysAhead: z.number().int().min(1).max(14),
  }),
  z.object({ action: z.literal("test") }),
]);

async function currentUser() {
  return (await auth.api.getSession({ headers: await headers() }))?.user;
}

export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ settings: await getNotificationSettings(user.id) });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const input = requestSchema.parse(await request.json());
    if (input.action === "subscribe") {
      await savePushSubscription(user.id, input.subscription, (await headers()).get("user-agent"));
    } else if (input.action === "unsubscribe") {
      await removePushSubscription(user.id, input.endpoint);
    } else if (input.action === "preferences") {
      await saveNotificationPreference(user.id, input);
    } else {
      return Response.json(await sendTestNotification(user.id));
    }
    return Response.json({ settings: await getNotificationSettings(user.id) });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? (error.issues[0]?.message ?? "Invalid notification settings")
        : error instanceof Error
          ? error.message
          : "Could not update notifications";
    return Response.json({ error: message }, { status: 400 });
  }
}
