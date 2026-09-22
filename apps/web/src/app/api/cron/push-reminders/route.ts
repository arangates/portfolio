import { env } from "@portfolio/env/server";

import { sendScheduledReminders } from "@/lib/push-notifications";

export const maxDuration = 60;

export async function GET(request: Request) {
  if (!env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    return Response.json({ ok: true, ...(await sendScheduledReminders()) });
  } catch (error) {
    console.error("Push reminder cron failed", error);
    return Response.json({ ok: false, error: "Push reminder delivery failed" }, { status: 500 });
  }
}
